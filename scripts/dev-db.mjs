import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs/promises';
import net from 'node:net';

const ROOT = process.cwd();
const PG_DIR = path.join(ROOT, '.pgdata');
const PORT = Number(process.env.PG_LOCAL_PORT || 5433);
const USER = process.env.PG_LOCAL_USER || 'postgres';
const PASSWORD = process.env.PG_LOCAL_PASSWORD || 'postgres';
const DB_NAME = process.env.PG_LOCAL_DB || 'joyride';

const recentLogs = [];

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function ensureDatabaseExists() {
  const client = new pg.Client({
    host: '127.0.0.1',
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`[DB] Created database "${DB_NAME}"`);
  }
  await client.end();
}

async function main() {
  await fs.mkdir(PG_DIR, { recursive: true });

  if (await isPortOpen(PORT)) {
    console.log(`[DB] PostgreSQL already listening on port ${PORT}, reusing active instance...`);
    await ensureDatabaseExists();
    console.log(`[DB] PostgreSQL ready: postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}?schema=public`);
    const keepAlive = setInterval(() => {}, 60000);
    const exitClean = () => {
      clearInterval(keepAlive);
      process.exit(0);
    };
    process.on('SIGINT', exitClean);
    process.on('SIGTERM', exitClean);
    return;
  }

  const pidFile = path.join(PG_DIR, 'postmaster.pid');
  const hasStalePid = await fs.access(pidFile).then(() => true).catch(() => false);
  if (hasStalePid) {
    await fs.unlink(pidFile);
    console.log('[DB] Removed stale postmaster.pid');
  }

  const pgInstance = new EmbeddedPostgres({
    databaseDir: PG_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    onLog: (msg) => {
      const text = String(msg).trim();
      if (!text) return;
      recentLogs.push(text);
      if (recentLogs.length > 30) recentLogs.shift();
      if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fatal')) {
        console.error('[PG]', text);
      }
    },
  });

  const isInit = await fs
    .access(path.join(PG_DIR, 'PG_VERSION'))
    .then(() => true)
    .catch(() => false);

  if (!isInit) {
    console.log('[DB] Initializing PostgreSQL data cluster in .pgdata ...');
    await pgInstance.initialise();
  }

  console.log(`[DB] Starting local PostgreSQL on port ${PORT}...`);
  await pgInstance.start();
  await ensureDatabaseExists();
  console.log(`[DB] PostgreSQL ready: postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}?schema=public`);

  const shutdown = async () => {
    console.log('\n[DB] Stopping local PostgreSQL...');
    try {
      await pgInstance.stop();
    } catch {
      // ignore on forced shutdown
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[DB] Startup error:', err ?? 'pg_ctl failed');
  if (recentLogs.length > 0) {
    console.error('[DB] Recent PostgreSQL logs:\n' + recentLogs.join('\n'));
  }
  process.exit(1);
});
