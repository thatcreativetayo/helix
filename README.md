# Helix

Expose your localhost to the internet. No 2-hour timeouts, no vendor lock-in, no BS.

Helix is a lightweight, open-source tunneling tool — an ngrok alternative built for developers who need to share a local dev server, test webhooks, or demo work-in-progress without spinning up real infrastructure.

```bash
helix login
helix myapp 3000
# → https://helix.onrender.com/tunnel/myapp/
```

## Why

Free tiers on existing tunnel tools expire your URL every couple hours, forcing you to re-paste links mid-demo or mid-webhook-test. Helix keeps your tunnel alive as long as your client is connected — persistent names, tied to your GitHub account, no clock running out on you.

## Features

- 🔗 **Persistent public URLs** — claim a name, keep it across restarts
- 🔐 **GitHub OAuth login** — no passwords, no separate account system
- 🩺 **Auto-reconnect + heartbeat** — dead tunnels get swept automatically
- 🧵 **HTML path rewriting** — relative asset links resolve correctly through the tunnel
- 🆓 **Free to self-host** — no paid infra required to run your own instance

## How it works

```
┌──────────────┐        WebSocket         ┌──────────────┐        HTTP        ┌──────────────┐
│  Helix CLI   │ ◄──────────────────────► │ Relay Server │ ◄─────────────────  │   Internet   │
│ (your laptop)│      persistent conn     │  (always on) │     public URL      │  (anyone)    │
└──────┬───────┘                          └──────────────┘                    └──────────────┘
       │
       ▼
┌──────────────┐
│  localhost:  │
│    3000      │
└──────────────┘
```

1. The CLI opens a persistent WebSocket connection from your machine to the relay server.
2. The relay hands you a public URL tied to your claimed tunnel name.
3. Requests to that URL are forwarded down the socket to your CLI, which proxies them to your local server and sends the response back up.

## Getting started

### Install

```bash
npm install -g helix-tunnel
```

### Login

```bash
helix login
```

Opens your browser to authenticate with GitHub. Your session is saved locally — you won't need to log in again.

### Start a tunnel

```bash
helix <name> <port>
```

```bash
helix myapp 3000
```

Your local server on port 3000 is now live at `https://helix.onrender.com/tunnel/myapp/`.

## Self-hosting

Helix is fully open-source and self-hostable.

```bash
git clone https://github.com/thatcreativetayo/helix.git
cd helix

# relay server
cd relay
pnpm install
cp .env.example .env   # add your GitHub OAuth + Appwrite credentials
pnpm dev

# cli client
cd ../client
pnpm install
pnpm dev <name> <port>
```

### Environment variables

| Variable | Description |
|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `APPWRITE_ENDPOINT` | Your Appwrite instance URL |
| `APPWRITE_PROJECT_ID` | Appwrite project ID |
| `APPWRITE_API_KEY` | Appwrite API key |
| `APPWRITE_DB_ID` | Appwrite database ID |

## Tech stack

- **Relay server** — Node.js, TypeScript, Express, `ws`
- **CLI client** — Node.js, TypeScript
- **Database** — Appwrite
- **Auth** — GitHub OAuth
- **Hosting** — Render (free tier)
- **Package manager** — pnpm

## Roadmap

- [ ] Request inspector dashboard (live traffic log + replay)
- [ ] Custom domains
- [ ] Team/org support
- [ ] TCP/UDP tunnels, not just HTTP

## License

MIT

## Contributing

Issues and PRs welcome. This is a small, actively-developed project — if something's broken or missing, open an issue.