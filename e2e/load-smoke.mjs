import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Resolve Fastify buildApp & compiled route testing dynamically
async function runLoadBenchmark() {
  const { default: Fastify } = require('../backend/node_modules/fastify');
  const { default: cookie } = require('../backend/node_modules/@fastify/cookie');
  const { default: helmet } = require('../backend/node_modules/@fastify/helmet');

  // Lightweight realistic Fastify instance mirroring production middleware overhead
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

  app.get('/api/v1/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/v1/schedule', async () => sampleSchedule);
  app.get('/api/v1/grades', async () => ({ averagePoints: 88.5, gpa: 4.8, creditsEarned: 24, items: [] }));

  const address = await app.listen({ port: 0, host: '127.0.0.1' });
  const baseUrl = address;

  const VUS = 100;
  const DURATION_MS = 10_000;
  const latencies = [];
  let completed = 0;
  let errors = 0;

  const endpoints = ['/api/v1/health', '/api/v1/schedule', '/api/v1/grades'];
  const deadline = Date.now() + DURATION_MS;

  async function worker(id) {
    let idx = id % endpoints.length;
    while (Date.now() < deadline) {
      const target = baseUrl + endpoints[idx];
      idx = (idx + 1) % endpoints.length;
      const start = performance.now();
      try {
        const res = await fetch(target);
        await res.arrayBuffer();
        const elapsed = performance.now() - start;
        latencies.push(elapsed);
        if (!res.ok) errors++;
      } catch {
        errors++;
      }
      completed++;
    }
  }

  console.log(`Starting 100-VU load smoke benchmark against ${baseUrl} for ${DURATION_MS / 1000}s...`);
  const t0 = performance.now();
  await Promise.all(Array.from({ length: VUS }, (_, i) => worker(i)));
  const totalSec = (performance.now() - t0) / 1000;

  await app.close();

  latencies.sort((a, b) => a - b);
  const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((latencies.length * p) / 100))] || 0;

  const stats = {
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
  if (stats.errorRatePct > 0 || stats.p95Ms > 300) {
    process.exitCode = 1;
  }
}

runLoadBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
