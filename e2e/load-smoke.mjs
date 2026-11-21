import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function normalizeBaseUrl(rawUrl) {
  return rawUrl.trim().replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
}

function parseSetCookieHeaders(res) {
  if (typeof res.headers.getSetCookie === 'function') {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

function updateCookieJar(cookieJar, res) {
  const headers = parseSetCookieHeaders(res);
  for (const header of headers) {
    const parts = header.split(';');
    const first = parts[0] || '';
    const eqIdx = first.indexOf('=');
    if (eqIdx <= 0) continue;
    const name = first.slice(0, eqIdx).trim();
    const value = first.slice(eqIdx + 1).trim();
    const hasZeroMaxAge = parts.some((p) => p.trim().toLowerCase() === 'max-age=0');
    if (hasZeroMaxAge || !value) {
      cookieJar.delete(name);
    } else {
      cookieJar.set(name, value);
    }
  }
}

function buildCookieHeader(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function startStandaloneFallback() {
  const { default: Fastify } = require('../backend/node_modules/fastify');
  const { default: cookie } = require('../backend/node_modules/@fastify/cookie');
  const { default: helmet } = require('../backend/node_modules/@fastify/helmet');

  const app = Fastify({ logger: false });
  await app.register(helmet);
  await app.register(cookie, { secret: 'load-test-ephemeral-signing-key-32' });

  const sampleSchedule = Array.from({ length: 14 }, (_, i) => ({
    id: `sch-${i}`,
    subject: `Subject ${i + 1}`,
    room: 'A-204',
    start: '08:30',
    end: '10:05',
    status: i === 2 ? 'room_changed' : 'normal',
  }));

  app.get('/api/v1/health', async (request) => {
    const query = request.query || {};
    if (query.db === '1') {
      return { status: 'ok', timestamp: new Date().toISOString(), db: 'ok', seeded: true };
    }
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = request.body || {};
    if (!body.email || !body.password) {
      return reply.code(422).send({ code: 'VALIDATION_ERROR', message: 'Invalid login payload' });
    }
    reply.setCookie('dean_session', 'standalone-load-session-token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });
    return {
      id: '00000000-0000-4000-8000-000000000001',
      email: body.email,
      fullName: 'Айгуль Нурова',
      role: 'student',
    };
  });

  app.get('/api/v1/schedule', async (request, reply) => {
    if (request.cookies.dean_session !== 'standalone-load-session-token') {
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    return sampleSchedule;
  });

  app.get('/api/v1/grades', async (request, reply) => {
    if (request.cookies.dean_session !== 'standalone-load-session-token') {
      return reply.code(401).send({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    return { averagePoints: 89.5, gpa: 4.8, creditsEarned: 21, creditsRequired: 30, items: [] };
  });

  const address = await app.listen({ port: 0, host: '127.0.0.1' });
  return { app, baseUrl: address };
}

async function runLoadBenchmark() {
  const rawBaseUrl = process.env.BASE_URL?.trim();
  const VUS = Number(process.env.LOAD_VUS || 100);
  const DURATION_MS = Number(process.env.LOAD_DURATION_MS || 10_000);
  const P95_LIMIT_MS = Number(process.env.LOAD_P95_MS || 300);
  const CHECK_DB = process.env.LOAD_CHECK_DB === '1';
  const INCLUDE_LOGIN = process.env.LOAD_INCLUDE_LOGIN === '1';
  const STUDENT_EMAIL = process.env.LOAD_STUDENT_EMAIL || 'aigul.nurova@demo.edu';
  const STUDENT_PASSWORD = process.env.LOAD_STUDENT_PASSWORD || process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!';

  let fallbackApp = null;
  let baseUrl = '';

  if (rawBaseUrl) {
    baseUrl = normalizeBaseUrl(rawBaseUrl);
    console.log(`Target mode: REAL BACKEND (${baseUrl})`);
  } else {
    console.log('Target mode: STANDALONE FALLBACK (BASE_URL unset — starting local Fastify mock server)');
    const standalone = await startStandaloneFallback();
    fallbackApp = standalone.app;
    baseUrl = standalone.baseUrl;
  }

  const cookieJar = new Map();

  try {
    // 1. Pre-flight health probe
    const healthPath = CHECK_DB ? '/api/v1/health?db=1' : '/api/v1/health';
    const healthRes = await fetch(`${baseUrl}${healthPath}`);
    if (!healthRes.ok) {
      throw new Error(`Pre-flight health probe ${healthPath} failed with status ${healthRes.status}`);
    }
    await healthRes.arrayBuffer();

    // 2. Pre-flight authentication -> capture dean_session cookie
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
    });
    if (loginRes.status !== 200) {
      throw new Error(`Pre-flight login failed for ${STUDENT_EMAIL} with status ${loginRes.status}`);
    }
    await loginRes.arrayBuffer();
    updateCookieJar(cookieJar, loginRes);
    if (!cookieJar.has('dean_session')) {
      throw new Error('Pre-flight login succeeded but did not set dean_session cookie');
    }

    const cookieHeader = buildCookieHeader(cookieJar);

    // 3. Pre-flight authenticated endpoint checks
    for (const checkPath of ['/api/v1/schedule', '/api/v1/grades']) {
      const checkRes = await fetch(`${baseUrl}${checkPath}`, {
        headers: { Cookie: cookieHeader },
      });
      if (checkRes.status !== 200) {
        throw new Error(`Pre-flight authenticated GET ${checkPath} failed with status ${checkRes.status}`);
      }
      await checkRes.arrayBuffer();
    }

    // 4. Concurrent VU load loop
    const latencies = [];
    let completed = 0;
    let errors = 0;

    const tasks = [
      { method: 'GET', path: '/api/v1/health', auth: false },
      { method: 'GET', path: '/api/v1/schedule', auth: true },
      { method: 'GET', path: '/api/v1/grades', auth: true },
    ];
    if (INCLUDE_LOGIN) {
      tasks.push({ method: 'POST', path: '/api/v1/auth/login', auth: false });
    }

    const deadline = Date.now() + DURATION_MS;

    async function worker(id) {
      let idx = id % tasks.length;
      while (Date.now() < deadline) {
        const task = tasks[idx];
        idx = (idx + 1) % tasks.length;
        const target = `${baseUrl}${task.path}`;
        const start = performance.now();
        try {
          const init =
            task.method === 'POST'
              ? {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
                }
              : task.auth
              ? { headers: { Cookie: cookieHeader } }
              : undefined;

          const res = await fetch(target, init);
          await res.arrayBuffer();
          const elapsed = performance.now() - start;
          latencies.push(elapsed);
          if (task.path === '/api/v1/auth/login') {
            if (res.status !== 200 && res.status !== 429) errors++;
          } else if (!res.ok) {
            errors++;
          }
        } catch {
          errors++;
        }
        completed++;
      }
    }

    console.log(`Starting ${VUS}-VU load smoke benchmark against ${baseUrl} for ${DURATION_MS / 1000}s...`);
    const t0 = performance.now();
    await Promise.all(Array.from({ length: VUS }, (_, i) => worker(i)));
    const totalSec = (performance.now() - t0) / 1000;

    latencies.sort((a, b) => a - b);
    const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((latencies.length * p) / 100))] || 0;

    const stats = {
      mode: rawBaseUrl ? 'real-backend' : 'standalone-fallback',
      baseUrl,
      virtualUsers: VUS,
      durationSec: Number(totalSec.toFixed(2)),
      totalRequests: completed,
      rps: Number((completed / totalSec).toFixed(1)),
      errorCount: errors,
      errorRatePct: Number(((errors / Math.max(1, completed)) * 100).toFixed(3)),
      p50Ms: Number(pct(50).toFixed(2)),
      p95Ms: Number(pct(95).toFixed(2)),
      p99Ms: Number(pct(99).toFixed(2)),
      maxMs: Number((latencies[latencies.length - 1] || 0).toFixed(2)),
    };

    console.log('Load Benchmark Result:', JSON.stringify(stats, null, 2));
    if (stats.errorRatePct > 0 || stats.p95Ms > P95_LIMIT_MS) {
      process.exitCode = 1;
    }
  } finally {
    if (fallbackApp) {
      await fallbackApp.close();
    }
  }
}

runLoadBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
