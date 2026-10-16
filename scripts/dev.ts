import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer as createViteServer } from 'vite';
import apiHandler from '../api/[...route]';
import { closeDatabase, configuredDatabaseUrl } from '../server/db';

const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 5173);
const autoAuth = process.argv.includes('--local-demo-auto-auth');

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}
if (!configuredDatabaseUrl()) {
  throw new Error('Persistent storage is not configured. Add DATABASE_URL or STORAGE_DATABASE_URL to .env.local.');
}
if (autoAuth) process.env.NEXUS_LOCAL_DEMO_AUTO_AUTH = 'true';

type LocalRequest = IncomingMessage & { query: Record<string, string[]>; body?: unknown };
type LocalResponse = ServerResponse & {
  status(code: number): LocalResponse;
  json(value: unknown): LocalResponse;
};

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_000_000) throw new Error('Request body exceeds 1 MB.');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

const vite = await createViteServer({
  appType: 'spa',
  server: { middlewareMode: true },
});

const server = createServer(async (incoming, outgoing) => {
  const requestUrl = new URL(incoming.url ?? '/', `http://${incoming.headers.host ?? `${host}:${port}`}`);
  if (requestUrl.pathname !== '/api' && !requestUrl.pathname.startsWith('/api/')) {
    vite.middlewares(incoming, outgoing, () => {
      outgoing.statusCode = 404;
      outgoing.end('Not found');
    });
    return;
  }

  const req = incoming as LocalRequest;
  const res = outgoing as LocalResponse;
  req.query = { route: requestUrl.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean) };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (value) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(value));
    return res;
  };

  try {
    if (!['GET', 'HEAD', 'DELETE'].includes(req.method?.toUpperCase() ?? 'GET')) req.body = await readJson(req);
    await apiHandler(req as unknown as VercelRequest, res as unknown as VercelResponse);
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (!res.writableEnded) res.end(JSON.stringify({ error: { message: error instanceof Error ? error.message : 'Invalid request.' } }));
  }
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') console.error(`Port ${port} is already in use. Stop the existing process and run npm run dev again.`);
  else console.error(error);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Onboard full stack: http://${host}:${port}`);
  console.log(`Persistent API: enabled; local demo auto-auth: ${autoAuth ? 'enabled (loopback only)' : 'disabled'}`);
});

async function shutdown() {
  server.close();
  await Promise.all([vite.close(), closeDatabase()]);
}

process.once('SIGINT', () => { void shutdown().finally(() => process.exit(0)); });
process.once('SIGTERM', () => { void shutdown().finally(() => process.exit(0)); });
