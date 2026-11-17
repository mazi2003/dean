import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const e2eRequire = createRequire(path.join(rootDir, 'e2e', 'package.json'));
const EmbeddedPostgres = e2eRequire('embedded-postgres').default || e2eRequire('embedded-postgres');

const PG_PORT = Number(process.env.LOCAL_PG_PORT || 54329);
const BACKEND_PORT = Number(process.env.LOCAL_BACKEND_PORT || 3000);
const FRONTEND_PORT = Number(process.env.LOCAL_FRONTEND_PORT || 4176);
const PG_USER = 'dean';
const PG_PASS = 'local_test_pg_pass';
const PG_DB = 'dean';
const DATABASE_URL = `postgresql://${PG_USER}:${PG_PASS}@127.0.0.1:${PG_PORT}/${PG_DB}?schema=public`;

const pgDataDir = path.join(os.tmpdir(), `dean-office-pg-${Date.now()}`);
fs.mkdirSync(pgDataDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: pgDataDir,
  user: PG_USER,
  password: PG_PASS,
  port: PG_PORT,
  persistent: false,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

const children = [];

async function cleanup() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  try {
    await pg.stop();
  } catch {
    // ignore
  }
  try {
    fs.rmSync(pgDataDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

async function waitForHttp(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  console.log('[local-stack] Starting embedded PostgreSQL on port', PG_PORT);
  await pg.initialise();
  await pg.start();
  await pg.createDatabase(PG_DB);

  const dbEnv = {
    ...process.env,
    DATABASE_URL,
    SEED_STUDENT_PASSWORD: process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!',
    SEED_STAFF_PASSWORD: process.env.SEED_STAFF_PASSWORD || 'DemoStaff123!',
  };

  console.log('[local-stack] Running Prisma migrations...');
  const prismaCli = path.join(rootDir, 'database', 'node_modules', 'prisma', 'build', 'index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema=schema.prisma'], {
    cwd: path.join(rootDir, 'database'),
    env: dbEnv,
    stdio: 'inherit',
  });

  console.log('[local-stack] Running seed.ts...');
  const tsxCli = path.join(rootDir, 'e2e', 'node_modules', 'tsx', 'dist', 'cli.mjs');
  execFileSync(process.execPath, [tsxCli, 'seed.ts'], {
    cwd: path.join(rootDir, 'database'),
    env: dbEnv,
    stdio: 'inherit',
  });

  console.log('[local-stack] Starting Fastify backend on port', BACKEND_PORT);
  const apiChild = spawn(process.execPath, [path.join(rootDir, 'backend', 'dist', 'server.js')], {
    cwd: path.join(rootDir, 'backend'),
    env: {
      ...dbEnv,
      NODE_ENV: 'test',
      PORT: String(BACKEND_PORT),
      HOST: '127.0.0.1',
      DATABASE_URL,
      JWT_SECRET: 'local-e2e-jwt-signing-secret-min-32-chars',
      COOKIE_SECRET: 'local-e2e-cookie-signing-secret-min-32-chars',
      COOKIE_SECURE: 'false',
      TRUST_PROXY: 'true',
      LOGIN_RATE_LIMIT_MAX: '100',
      CORS_ORIGIN: `http://127.0.0.1:${FRONTEND_PORT}`,
      LOG_LEVEL: 'warn',
    },
    stdio: 'inherit',
  });
  children.push(apiChild);

  await waitForHttp(`http://127.0.0.1:${BACKEND_PORT}/api/v1/health`);
  console.log('[local-stack] Backend healthy!');

  console.log('[local-stack] Starting Vite preview on port', FRONTEND_PORT);
  const viteBin = path.join(rootDir, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js');
  const webChild = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', String(FRONTEND_PORT), '--host', '127.0.0.1'],
    {
      cwd: path.join(rootDir, 'frontend'),
      env: {
        ...process.env,
        VITE_BACKEND_PROXY: `http://127.0.0.1:${BACKEND_PORT}`,
      },
      stdio: 'inherit',
    }
  );
  children.push(webChild);

  await waitForHttp(`http://127.0.0.1:${FRONTEND_PORT}`);
  console.log(`[local-stack] Ready at http://127.0.0.1:${FRONTEND_PORT}`);

  // Keep running until terminated
  await new Promise(() => {});
}

main().catch(async (err) => {
  console.error('[local-stack] Failed:', err);
  await cleanup();
  process.exit(1);
});
