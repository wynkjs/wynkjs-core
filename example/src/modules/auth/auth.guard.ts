import type { UserRole, AuthUser } from "./auth.types";
import { type WynkRequest, type WynkResponse, Container } from "wynkjs";
import { AuthService } from "./auth.service";

/** Shared JWT secret — must match the secret used in AuthController */
const JWT_SECRET = "wynkjs-demo-secret";

/**
 * JWT Guard and RBAC Implementation - Middleware Pattern with Request/Response
 * Provides middleware guards for authentication and role-based access control
 * Compatible with WynkJS @Use decorator pattern
 * Now supports cookies for JWT tokens
 */

export interface AuthContext {
  user?: AuthUser;
  token?: string;
}

/**
 * JWT Verification Middleware
 * Extracts and verifies JWT token from Authorization header OR cookie
 * Attaches user to context if valid token
 */
export const jwtGuard = async (ctx: any, next: Function) => {
  const request = ctx.request as WynkRequest;
  const response = ctx.response as WynkResponse;

  // Try to get token from Authorization header first
  let token = request.getBearerToken();

  // If not in header, try to get from cookie
  if (!token) {
    token = request.getCookie("accessToken");
  }

  if (!token) {
    response.status(401);
    return { error: "Unauthorized", message: "Authentication required" };
  }

  const payload = Container.resolve(AuthService).verifyToken(token, JWT_SECRET);
  if (!payload) {
    response.status(401);
    return { error: "Unauthorized", message: "Invalid token" };
  }

  const user: AuthUser = {
    id: payload.id,
    email: payload.email,
    roles: payload.roles || ["guest"],
    username: payload.username,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };

  ctx.user = user;
  ctx.token = token;
  request.user = user;
  request.set("token", token);

  return next();
};

/**
 * Role-Based Access Control Middleware Factory
 * Returns middleware that checks if user has one of the allowed roles
 * Uses Request/Response architecture
 *
 * Usage:
 * @Use(jwtGuard, rolesGuard(["admin"]))
 * @Controller("/admin")
 * export class AdminController { ... }
 */
export const rolesGuard = (allowedRoles: UserRole[]) => {
  return async (ctx: any, next: Function) => {
    const request = ctx.request as WynkRequest;
    const response = ctx.response as WynkResponse;
    const user = request.user as AuthUser | undefined;

    if (!user) {
      response.status(401);
      return { error: "Unauthorized", message: "Authentication required" };
    }

    const hasRole = allowedRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      response.status(403);
      return {
        error: "Forbidden",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      };
    }

    return next();
  };
};

/**
 * Utility class for token verification and role checking
 * Can be used in services or non-middleware contexts
 */
export class AuthGuard {
  // Guard-compatible instance method so @UseGuards(AuthGuard) works
  async canActivate(context: any): Promise<boolean> {
    const request =
      (context.getRequest && context.getRequest()) ||
      context.request ||
      context;
    const response =
      (context.getResponse && context.getResponse()) ||
      context.response ||
      context;

    // Try header first, then cookie
    let token: string | undefined;
    if (typeof request.getBearerToken === "function") {
      token = request.getBearerToken();
    }
    if (!token && typeof request.getCookie === "function") {
      token = request.getCookie("accessToken");
    }

    if (!token) {
      if (response && typeof response.status === "function") {
        response.status(401);
      }
      return false;
    }

    const payload = Container.resolve(AuthService).verifyToken(token, JWT_SECRET);
    if (!payload) {
      if (response && typeof response.status === "function") {
        response.status(401);
      }
      return false;
    }

    const user: AuthUser = {
      id: payload.id,
      email: payload.email,
      roles: payload.roles || ["guest"],
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };

    if (context) {
      try {
        const ctx = context.getContext ? context.getContext() : context;
        if (ctx) {
          ctx.user = user;
          ctx.token = token;
        }
      } catch {}
    }

    try {
      request.user = user;
      if (typeof request.set === "function") request.set("token", token);
    } catch {}

    return true;
  }
  /**
   * Verify JWT token from Authorization header
   * Expected format: "Bearer <token>"
   */
  static verifyToken(authHeader: string | undefined): AuthUser | null {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    const payload = Container.resolve(AuthService).verifyToken(parts[1], JWT_SECRET);
    if (!payload) return null;

    return {
      id: payload.id,
      email: payload.email,
      roles: payload.roles || ["guest"],
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
    if (!user) {
      return false;
    }

    if (!Array.isArray(user.roles)) {
      return false;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }

  /**
   * Check if user has all required roles
   */
  static hasAllRoles(
    user: AuthUser | null,
    requiredRoles: UserRole[]
  ): boolean {
    if (!user) {
      return false;
    }

    if (!Array.isArray(user.roles)) {
      return false;
    }

    return requiredRoles.every((role) => user.roles.includes(role));
  }
}
