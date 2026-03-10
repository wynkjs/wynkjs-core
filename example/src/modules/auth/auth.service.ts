import { Injectable, Singleton } from "wynkjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser, UserRole } from "./auth.types";

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roles: UserRole[];
  isActive: boolean;
}

@Injectable()
@Singleton()
export class AuthService {
  private users: Map<string, StoredUser> = new Map();
  private counter = 1;

  constructor() {
    this.seedUsers();
  }

  private seedUsers() {
    const adminId = "auth-user-1";
    this.users.set(adminId, {
      id: adminId,
      email: "admin@example.com",
      passwordHash: Buffer.from("password123").toString("base64"),
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      roles: ["admin", "user"],
      isActive: true,
    });
    const userId = "auth-user-2";
    this.users.set(userId, {
      id: userId,
      email: "user@example.com",
      passwordHash: Buffer.from("password123").toString("base64"),
      firstName: "Regular",
      lastName: "User",
      username: "regularuser",
      roles: ["user"],
      isActive: true,
    });
    this.counter = 3;
  }

  private hashPassword(password: string): string {
    return Buffer.from(password).toString("base64");
  }

  private comparePassword(plain: string, hashed: string): boolean {
    return Buffer.from(plain).toString("base64") === hashed;
  }

  async registerUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    username?: string
  ) {
    const existing = Array.from(this.users.values()).find(
      (u) => u.email === email
    );
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const id = `auth-user-${this.counter++}`;
    const stored: StoredUser = {
      id,
      email,
      passwordHash: this.hashPassword(password),
      firstName,
      lastName,
      username: username || email.split("@")[0],
      roles: ["user"],
      isActive: true,
    };
    this.users.set(id, stored);

    return { id: stored.id, email: stored.email, firstName, lastName };
  }

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const stored = Array.from(this.users.values()).find(
      (u) => u.email === email
    );
    if (!stored) return null;
    if (!this.comparePassword(password, stored.passwordHash)) return null;
    if (!stored.isActive) return null;

    return {
      id: stored.id,
      email: stored.email,
      username: stored.username,
      firstName: stored.firstName,
      lastName: stored.lastName,
      roles: stored.roles,
    };
  }

  async getUserWithRoles(userId: string): Promise<AuthUser | null> {
    const stored = this.users.get(userId);
    if (!stored) return null;
    return {
      id: stored.id,
      email: stored.email,
      username: stored.username,
      firstName: stored.firstName,
      lastName: stored.lastName,
      roles: stored.roles,
    };
  }

  verifyToken(token: string, secret: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, body, sig] = parts;
      const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
      const sigBuf = Buffer.from(sig);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
      const decoded = Buffer.from(body, "base64url").toString("utf-8");
      const payload = JSON.parse(decoded);
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  createToken(payload: any, secret: string, expiresIn: number = 3600): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      })
    ).toString("base64url");
    const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    return `${header}.${body}.${signature}`;
  }
}
