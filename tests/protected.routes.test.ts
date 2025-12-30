import "reflect-metadata";
// @ts-nocheck
import { describe, it, expect } from "bun:test";
import { WynkFactory } from "../core/factory";
import { ProtectedRoutesController } from "../example/src/modules/protected/protected-routes.controller";
import { AuthController } from "../example/src/modules/auth/auth.controller";
import { AuthGuard } from "../example/src/modules/auth/auth.guard";
import { container } from "tsyringe";
import { AuthService as RealAuthService } from "../example/src/modules/auth/auth.service";

// Mock AuthService with role control
class MockAuthService2 {
  users: Record<string, any> = {};

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
      roles: ["user"],
    };
    return user;
  }

  async createAdmin(email: string) {
    const id = (Object.keys(this.users).length + 1).toString();
    const user = {
      id,
      email,
      firstName: "Admin",
      lastName: "User",
      username: "admin",
    };
    this.users[email] = {
      ...user,
      password: Buffer.from("password").toString("base64"),
      isActive: true,
      roles: ["admin"],
    };
    return this.users[email];
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

describe("Protected routes and RBAC", () => {
  it("enforces auth and roles correctly", async () => {
    // map real AuthService to mock
    container.register(RealAuthService, { useClass: MockAuthService2 });
    const mock = container.resolve(RealAuthService) as any;

    const app = WynkFactory.create({
      controllers: [AuthController, ProtectedRoutesController],
      providers: [RealAuthService, AuthGuard],
    });

    const port = 4100 + Math.floor(Math.random() * 1000);
    await app.listen(port);
    const base = `http://localhost:${port}`;

    // Register normal user via endpoint
    const reg = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password",
        firstName: "User",
        lastName: "Test",
        username: "user1",
      }),
    });
    expect(reg.status).toBe(200);
    const regJson = await reg.json();
    const userToken = regJson.accessToken;

    // Create admin directly in mock and generate token
    const adminRec = await mock.createAdmin("admin@example.com");
    const adminToken = mock.createToken(
      { id: adminRec.id, email: adminRec.email, roles: adminRec.roles },
      "test",
      3600
    );

    // 1) Access dashboard without token => 401
    const noAuth = await fetch(`${base}/protected/dashboard`);
    expect(noAuth.status).toBe(401);

    // 2) Access dashboard with user token => 200
    const dashUser = await fetch(`${base}/protected/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(dashUser.status).toBe(200);

    // 3) Access admin with user token => 403
    const adminWithUser = await fetch(`${base}/protected/admin`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(adminWithUser.status).toBe(403);

    // 4) Access admin with admin token => 200
    const adminOk = await fetch(`${base}/protected/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminOk.status).toBe(200);

    await app.getApp().stop();
  });
});
