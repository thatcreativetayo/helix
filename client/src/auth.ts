import http from "http";
import { exec } from "child_process";
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.helix');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const CLIENT_ID = "Ov23liEonC5diAqFoF71";
const CALLBACK_PORT = 51234;

function saveConfig(data: { token: string; username: string }) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

export function loadConfig(): { token: string; username: string } | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

export function login(): Promise<{ token: string; username: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "", `http://localhost:${CALLBACK_PORT}`);
      const token = url.searchParams.get("token");
      const username = url.searchParams.get("username");
      if (!token) return;

      res.end("Logged in! You can close this tab.");
      server.close();

      const data = { token, username: username ?? "" };
      saveConfig(data);
      resolve(data);
    });

    server.listen(CALLBACK_PORT, () => {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:4000/auth/github/callback&scope=read:user&state=cli`;
      const opener =
        process.platform === "win32"
          ? 'start ""'
          : process.platform === "darwin"
          ? "open"
          : "xdg-open";
      exec(`${opener} "${authUrl}"`);
      console.log("Opening browser to log in with GitHub...");
    });
  });
}