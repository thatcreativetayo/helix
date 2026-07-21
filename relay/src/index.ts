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
const lastSeen = new Map<string, number>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const name = url.searchParams.get('name');
  if (!name) return ws.close();

  tunnels.set(name, ws);
  lastSeen.set(name, Date.now());
  console.log(`[relay] registered: ${name}`);

  ws.on('message', (data) => {
    const msg: RelayMessage = JSON.parse(data.toString());
    lastSeen.set(name, Date.now());
    if (msg.type === 'response' && pending.has(msg.requestId)) {
      pending.get(msg.requestId)!(msg);
      pending.delete(msg.requestId);
    }
  });

  ws.on('close', () => {
    tunnels.delete(name);
    lastSeen.delete(name);
    console.log(`[relay] closed: ${name}`);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [name, ts] of lastSeen.entries()) {
    if (now - ts > 120000) {
      tunnels.get(name)?.terminate();
      tunnels.delete(name);
      lastSeen.delete(name);
      console.log(`[relay] swept dead tunnel: ${name}`);
    }
  }
}, 30000);

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

  const rewriteHtml = (body: string, name: string): string => {
  const prefix = `/tunnel/${name}`;
  return body.replace(
    /(href|src|action)=(["'])\/(?!\/|tunnel\/)/g,
    `$1=$2${prefix}/`
  );
}

    pending.set(requestId, (msg) => {
      clearTimeout(timeout);
      res.status(msg.status || 200);

      const contentType = msg.headers?.['content-type'] || "";
      let responseBody = msg.body || "";
      if (contentType.includes('text/html')) {
        responseBody = rewriteHtml(responseBody, name);
      }
      for (const [k, v] of Object.entries(msg.headers || {})) {
        if (['content-length', 'content-encoding'].includes(k.toLowerCase())) continue;
        res.set(k, v);
      }
      res.send(responseBody);
    });

    ws.send(JSON.stringify({ type: 'request', requestId, method: req.method, path, headers: req.headers, body }));
  });
});

app.get('/auth/github',  async (req: Request, res: Response) => { 
  const code = req.query.code as string;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', Accept : 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json() as { access_token: string };

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const user = await userRes.json()
  const token = crypto.randomUUID(); // placeholder until DB is wired up;
  res.json({ token, user });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => console.log(`[relay] listening on ${PORT}`));