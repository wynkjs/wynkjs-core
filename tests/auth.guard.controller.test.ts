import { spawn } from "child_process";
import fetch from "node-fetch";
import path from "path";

// This test script starts the example app, performs requests, and exits.
// It's a lightweight integration test — run with `node tests/auth.guard.controller.test.js` or add an npm script.

const APP_START_TIMEOUT = 5000;

async function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const exampleIndex = path.join(projectRoot, "example", "src", "index.ts");

  console.log("Starting example app (dev mode)...");
  const proc = spawn("node", ["-r", "ts-node/register", exampleIndex], {
    env: { ...process.env, NODE_ENV: "test", PORT: "4001" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdout?.on("data", (d) => process.stdout.write(d));
  proc.stderr?.on("data", (d) => process.stderr.write(d));

  // Wait for server to be up
  await wait(APP_START_TIMEOUT);

  const base = "http://localhost:4001";

  // 1) Register a test user
  const registerRes = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test+ci@example.com",
      password: "password123",
      firstName: "CI",
      lastName: "Runner",
      username: "ci-runner",
    }),
  });
  const registerJson = await registerRes.json();
  if (!registerRes.ok) {
    console.error("Register failed:", registerJson);
    proc.kill();
    process.exit(1);
  }
  const token = registerJson.accessToken;
  if (!token) {
    console.error("No token returned from register");
    proc.kill();
    process.exit(1);
  }

  // 2) Call /whoami with Authorization header
  const whoami = await fetch(`${base}/auth/whoami`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const whoamiJson = await whoami.json();
  if (!whoami.ok || !whoamiJson.user) {
    console.error("whoami failed", whoami.status, whoamiJson);
    proc.kill();
    process.exit(1);
  }
  console.log("whoami OK ->", whoamiJson.user.email);

  // 3) Call /auth/me with cookie
  const me = await fetch(`${base}/auth/me`, {
    method: "GET",
    headers: { Cookie: `accessToken=${token}` },
  });
  const meJson = await me.json();
  if (!me.ok || !meJson.user) {
    console.error("/me failed", me.status, meJson);
    proc.kill();
    process.exit(1);
  }
  console.log("/me OK ->", meJson.user.email);

  // 4) Verify via /auth/verify with body token
  const verify = await fetch(`${base}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const verifyJson = await verify.json();
  if (!verify.ok || !verifyJson.valid) {
    console.error("/verify failed", verify.status, verifyJson);
    proc.kill();
    process.exit(1);
  }
  console.log("/verify OK ->", verifyJson.user.email);

  console.log("All auth integration checks passed.");

  proc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
