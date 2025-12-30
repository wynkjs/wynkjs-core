// @ts-nocheck
import { describe, it, expect } from "bun:test";
import { WynkFactory } from "../core/factory";
import { AuthController } from "../example/src/modules/auth/auth.controller";
import { AuthGuard } from "../example/src/modules/auth/auth.guard";
import { container } from "tsyringe";
import { AuthService as RealAuthService } from "../example/src/modules/auth/auth.service";

// Lightweight mock AuthService to avoid DB dependency in tests
class MockAuthService {
  private users: Record<string, any> = {};
  async registerUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    username?: string
  ) {
    const id = (Object.keys(this.users).length + 1).toString();
    const user = { id, email, firstName, lastName, username };
    this.users[email] = {
      ...user,
      password: Buffer.from(password).toString("base64"),
      isActive: true,
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
      roles: ["user"],
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
      roles: ["user"],
    };
  }

  createToken(payload: any, secret: string, expiresIn: number = 3600) {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64");
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      })
    ).toString("base64");
    const signature = Buffer.from(secret || "test-secret").toString("base64");
    return `${header}.${body}.${signature}`;
  }
}

describe("Auth Guard + Controller Integration", () => {
  it("registers user, whoami, me (cookie), and verify", async () => {
    const port = 4010 + Math.floor(Math.random() * 1000);

    // Register the MockAuthService for RealAuthService token
    container.register(RealAuthService, { useClass: MockAuthService });

    const app = WynkFactory.create({
      controllers: [AuthController],
      providers: [RealAuthService, AuthGuard],
    });

    // Start server
    await app.listen(port);

    const base = `http://localhost:${port}`;

    // Register user
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

    expect(registerRes.status).toBe(200);
    const regJson = await registerRes.json();
    expect(regJson.accessToken).toBeTruthy();
    const token = regJson.accessToken;

    // whoami with Authorization header
    const who = await fetch(`${base}/auth/whoami`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(who.status).toBe(200);
    const whoJson = await who.json();
    expect(whoJson.user).toBeTruthy();
    expect(whoJson.user.email).toBe("test+ci@example.com");

    // /me with cookie
    const me = await fetch(`${base}/auth/me`, {
      headers: { Cookie: `accessToken=${token}` },
    });
    expect(me.status).toBe(200);
    const meJson = await me.json();
    expect(meJson.user).toBeTruthy();
    expect(meJson.user.email).toBe("test+ci@example.com");

    // /verify with body
    const verify = await fetch(`${base}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    expect(verify.status).toBe(200);
    const verifyJson = await verify.json();
    expect(verifyJson.valid).toBe(true);
    expect(verifyJson.user).toBeTruthy();
    expect(verifyJson.user.email).toBe("test+ci@example.com");

    // Stop server and cleanup
    await app.getApp().stop();
  });
});
