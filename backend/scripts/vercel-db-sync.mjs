import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function main() {
  if (process.env.VERCEL !== '1') {
    return;
  }

  const dbUrl =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.log('[vercel-db-sync] DATABASE_URL is not set; skipping Prisma migrate & seed.');
    return;
  }

  const backendDir = path.resolve(import.meta.dirname, '..');
  const databaseDir = path.resolve(backendDir, '..', 'database');
  const schemaPath = path.join(databaseDir, 'schema.prisma');
  const seedPath = path.join(databaseDir, 'seed.ts');
  const backendNodeModules = path.join(backendDir, 'node_modules');

  if (!fs.existsSync(schemaPath)) {
    console.log('[vercel-db-sync] database/schema.prisma not found; skipping.');
    return;
  }

  const dbEnv = {
    ...process.env,
    DATABASE_URL: dbUrl,
    NODE_PATH: [backendNodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter),
  };

  try {
    const prismaCli = require.resolve('prisma/build/index.js', { paths: [backendDir] });
    console.log('[vercel-db-sync] Running prisma migrate deploy...');
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', `--schema=${schemaPath}`], {
      cwd: databaseDir,
      env: dbEnv,
      stdio: 'inherit',
    });

    if (process.env.SEED_STUDENT_PASSWORD && process.env.SEED_STAFF_PASSWORD && fs.existsSync(seedPath)) {
      const tsNodeCli = require.resolve('ts-node/dist/bin.js', { paths: [backendDir] });
      console.log('[vercel-db-sync] Running idempotent database seed...');
      execFileSync(
        process.execPath,
        [
          tsNodeCli,
          '--transpile-only',
          '-O',
          JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' }),
          seedPath,
        ],
        {
          cwd: databaseDir,
          env: dbEnv,
          stdio: 'inherit',
        }
      );
    } else {
      console.log(
        '[vercel-db-sync] Skipping seed: set SEED_STUDENT_PASSWORD and SEED_STAFF_PASSWORD in Vercel Environment Variables to seed demo accounts.'
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[vercel-db-sync] Warning: DB sync step failed during build (${message}).`);
  }
}

main();
