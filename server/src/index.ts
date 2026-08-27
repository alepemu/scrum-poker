import { createServer } from 'node:http';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { loadConfig } from './config';
import { registerHandlers } from './socket/registerHandlers';
import type { PokerServer } from './socket/types';
import { createRoomStore } from './store/roomStore';
import { startSweeper } from './sweeper';

const config = loadConfig();
const store = createRoomStore();

const app = express();
// Correct client IPs and protocol when this sits behind a reverse proxy.
app.set('trust proxy', true);
app.disable('x-powered-by');

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, rooms: store.all().length });
});

const httpServer = createServer(app);

const io: PokerServer = new Server(httpServer, {
  cors: config.corsOrigin === false ? undefined : { origin: config.corsOrigin },
});

registerHandlers(io, store);
const stopSweeper = startSweeper(io, store);

if (config.isProduction) {
  // One process serves the API and the built client, so the browser talks to a
  // single origin and no CORS or extra host configuration is needed.
  const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback, so a hard refresh on /room/:id serves the app rather than 404.
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

httpServer.listen(config.port, () => {
  const mode = config.isProduction ? 'production' : 'development';
  console.log(`Scrum Poker server listening on http://localhost:${config.port} (${mode})`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    stopSweeper();
    io.close(() => {
      httpServer.close(() => process.exit(0));
    });
  });
}
