import WebSocket from 'ws';
import http from 'http';
import { login, loadConfig } from './auth.js';

type RelayMessage = {
  type: 'request' | 'response';
  requestId: string;
  method?: string;
  path?: string;
  headers?: http.IncomingHttpHeaders;
  body?: string;
  status?: number;
};

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:4000/register';
const name = process.argv[2] || 'test';
const localPort = process.argv[3] || '3000';
const session = loadConfig();

const ws = new WebSocket(`${RELAY_URL}?name=${name}&token=${session?.token}`);

if (process.argv[2] === 'login') {
  const { token, username } = await login();
  console.log(`Logged in as ${username}`);
  process.exit(0);
}

// check for existing session before starting a tunnel
if (!session) {
  console.log('Not logged in. Run: helix login');
  process.exit(1);
}
console.log(`[client] using saved session for ${session.username}`);

ws.on('open', () => {
  console.log(`[client] up. Public: http://localhost:4000/tunnel/${name}/`)
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) { 
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, 30000);
});

ws.on('message', (data) => {
  const msg: RelayMessage = JSON.parse(data.toString());
  if (msg.type !== 'request') return;

  const proxyReq = http.request(
    { hostname: 'localhost', port: localPort, path: msg.path, method: msg.method, headers: msg.headers as any },
    (proxyRes) => {
      let body = '';
      proxyRes.on('data', (c) => (body += c));
      proxyRes.on('end', () => {
        ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, status: proxyRes.statusCode, headers: proxyRes.headers, body }));
      });
    }
  );

  proxyReq.on('error', () => {
    ws.send(JSON.stringify({ type: 'response', requestId: msg.requestId, status: 502, body: 'Local server unreachable' }));
  });

  if (msg.body) proxyReq.write(msg.body);
  proxyReq.end();
});

ws.on('close', () => console.log('[client] disconnected'));