import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import crypto from 'crypto';

type RelayMessage = {
  type: 'request' | 'response';
  requestId: string;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: string;
  status?: number;
};

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/register' });

const tunnels = new Map<string, WebSocket>();
const pending = new Map<string, (msg: RelayMessage) => void>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const name = url.searchParams.get('name');
  if (!name) return ws.close();

  tunnels.set(name, ws);
  console.log(`[relay] registered: ${name}`);

  ws.on('message', (data) => {
    const msg: RelayMessage = JSON.parse(data.toString());
    if (msg.type === 'response' && pending.has(msg.requestId)) {
      pending.get(msg.requestId)!(msg);
      pending.delete(msg.requestId);
    }
  });

  ws.on('close', () => {
    tunnels.delete(name);
    console.log(`[relay] closed: ${name}`);
  });
});

app.use('/tunnel/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const ws = tunnels.get(name);
  if (!ws) return res.status(404).send('Tunnel not found');

  const requestId = crypto.randomUUID();
  const path = req.originalUrl.replace(`/tunnel/${name}`, '') || '/';

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const timeout = setTimeout(() => {
      pending.delete(requestId);
      res.status(504).send('Tunnel timeout');
    }, 10000);

    pending.set(requestId, (msg) => {
      clearTimeout(timeout);
      res.status(msg.status || 200);
      for (const [k, v] of Object.entries(msg.headers || {})) {
        if (k.toLowerCase() !== 'content-length') res.set(k, v);
      }
      res.send(msg.body || '');
    });

    ws.send(JSON.stringify({ type: 'request', requestId, method: req.method, path, headers: req.headers, body }));
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => console.log(`[relay] listening on ${PORT}`));