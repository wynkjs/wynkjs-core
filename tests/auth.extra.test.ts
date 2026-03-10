import "reflect-metadata";
// @ts-nocheck
import { describe, it, expect } from "bun:test";
import { WynkFactory } from "../core/factory";
import { AuthController } from "../example/src/modules/auth/auth.controller";
import { AuthGuard } from "../example/src/modules/auth/auth.guard";
import { container } from "tsyringe";
import { AuthService as RealAuthService } from "../example/src/modules/auth/auth.service";

// Mock with simple token creation and expiry control
class MockAuthService3 {
  users: Record<string, any> = {};

  async registerUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    username?: string,
  ) {
    const id = (Object.keys(this.users).length + 1).toString();
    const user = { id, email, firstName, lastName, username };
    this.users[email] = {
      ...user,
      password: Buffer.from(password).toString("base64"),
      isActive: true,
      roles: ["user"],
    };
    return user;
  }

  async validateUser(email: string, password: string) {
    const record = this.users[email];
    if (!record) return null;
    const hashed = Buffer.from(password).toString("base64");
    if (record.password !== hashed) return null;
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      firstName: record.firstName,
      lastName: record.lastName,
      roles: record.roles,
    };
  }

  async getUserWithRoles(userId: string) {
    const found = Object.values(this.users).find((u: any) => u.id === userId);
    if (!found) return null;
    return {
      id: found.id,
      email: found.email,
      username: found.username,
      firstName: found.firstName,
      lastName: found.lastName,
      roles: found.roles,
    };
  }

  createToken(payload: any, secret: string, expiresIn: number = 3600) {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      }),
    ).toString("base64url");
    const hasher = new Bun.CryptoHasher("sha256", secret || "test-secret");
    hasher.update(`${header}.${body}`);
    const signature = hasher.digest("base64url");
    return `${header}.${body}.${signature}`;
  }

  verifyToken(token: string, secret: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, body, sig] = parts;
      const hasher = new Bun.CryptoHasher("sha256", secret);
      hasher.update(`${header}.${body}`);
      const expected = hasher.digest("base64url");
      if (sig !== expected) return null;
      const decoded = Buffer.from(body, "base64url").toString("utf-8");
      const payload = JSON.parse(decoded);
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp)
        return null;
      return payload;
    } catch {
      return null;
    }
  }
}

describe("Auth extra cases: login failures, cookie header, token expiry", () => {
  it("login failure and cookie header presence", async () => {
    container.register(RealAuthService, { useClass: MockAuthService3 });
    const app = WynkFactory.create({
      controllers: [AuthController],
      providers: [RealAuthService, AuthGuard],
    });
    const port = 4200 + Math.floor(Math.random() * 1000);
    await app.listen(port);
    const base = `http://localhost:${port}`;

    // Register user
    const reg = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "x@example.com",
        password: "pass",
        firstName: "X",
        lastName: "Tester",
        username: "xt",
      }),
    });
    expect(reg.status).toBe(200);
    const regJson = await reg.json();

    // Check Set-Cookie header exists and contains accessToken
    const setCookie =
      reg.headers.get("set-cookie") || reg.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("accessToken=");

    // Login with wrong password
    const loginFail = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@example.com", password: "wrong" }),
    });
    expect(loginFail.status).toBe(400);

    await app.getApp().stop();
  });

  it("token expiry is enforced by verify", async () => {
    container.register(RealAuthService, { useClass: MockAuthService3 });
    const app = WynkFactory.create({
      controllers: [AuthController],
      providers: [RealAuthService, AuthGuard],
    });
    const port = 4300 + Math.floor(Math.random() * 1000);
    await app.listen(port);
    const base = `http://localhost:${port}`;

    // Register user and get token with short expiry (1 second)
    const reg = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "y@example.com",
        password: "pass",
        firstName: "Y",
        lastName: "Tester",
        username: "yt",
      }),
    });
    expect(reg.status).toBe(200);
    const regJson = await reg.json();
    const tokenShort = regJson.accessToken;

    // Verify immediately => valid
    const v1 = await fetch(`${base}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenShort }),
    });
    const v1j = await v1.json();
    expect(v1j.valid).toBe(true);

    // Create a token that's already expired by using mock directly
    const mock = container.resolve(RealAuthService) as any;
    const expired = mock.createToken(
      { id: "1", email: "y@example.com" },
      "test",
      -10,
    );

    const v2 = await fetch(`${base}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: expired }),
    });
    const v2j = await v2.json();
    expect(v2j.valid).toBe(false);

    await app.getApp().stop();
  });
});
