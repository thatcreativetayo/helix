import http from "http";
import { exec } from "child_process";

const CLIENT_ID = "Ov23liEonC5diAqFoF71";
const CALLBACK_PORT = 51234;

export function login(): Promise<{ token: string; username: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "", `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get("code");
      if (!code) return;

      res.end("Logged in! You can close this tab.");
      server.close();

      const result = await fetch(
        `http://localhost:4000/auth/github/exchange?code=${code}`,
      );
      const raw = await result.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("[client] relay did not return JSON:", raw.slice(0, 300));
        return reject(new Error("auth exchange failed"));
      }
      resolve(data);
    });

    server.listen(CALLBACK_PORT, () => {
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:${CALLBACK_PORT}/callback&scope=read:user`;
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
