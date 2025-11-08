// @ts-nocheck
import { describe, expect, test, beforeEach } from "bun:test";
import "reflect-metadata";
import { container } from "tsyringe";
import {
  WynkFactory,
  Controller,
  Get,
  Post,
  UseGuards,
  Injectable,
} from "../../core";
import type { GuardContext } from "../../core/interfaces/guard.interface";

// ============================================================================
// MOCK GUARDS
// ============================================================================

@Injectable()
class AuthGuard {
  async canActivate(context: GuardContext): Promise<boolean> {
    const authHeader = context.headers?.["authorization"];
    return authHeader === "Bearer valid-token";
  }
}

@Injectable()
class RoleGuard {
  private allowedRoles: string[];

  constructor(allowedRoles: string[] = ["admin"]) {
    this.allowedRoles = allowedRoles;
  }

  async canActivate(context: GuardContext): Promise<boolean> {
    const userRole = context.headers?.["x-user-role"];
    return this.allowedRoles.includes(userRole);
  }
}

@Injectable()
class ThrottleGuard {
  private requests = new Map<string, number[]>();

  async canActivate(context: GuardContext): Promise<boolean> {
    const ip = context.request.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    const userRequests = this.requests.get(ip) || [];

    // Allow max 5 requests per minute
    const recentRequests = userRequests.filter((time) => now - time < 60000);

    if (recentRequests.length >= 5) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    return true;
  }
}

@Injectable()
class OwnershipGuard {
  async canActivate(context: GuardContext): Promise<boolean> {
    const userId = context.params?.userId;
    const authenticatedUserId = context.headers?.["x-user-id"];
    return userId === authenticatedUserId;
  }
}

@Injectable()
class ApiKeyGuard {
  async canActivate(context: GuardContext): Promise<boolean> {
    const apiKey = context.query?.apiKey || context.headers?.["x-api-key"];
    return apiKey === "valid-api-key-12345";
  }
}

@Injectable()
class MaintenanceGuard {
  async canActivate(context: GuardContext): Promise<boolean> {
    // Always allow access (no maintenance)
    return true;
  }
}

@Injectable()
class FailingGuard {
  async canActivate(context: GuardContext): Promise<boolean> {
    throw new Error("Guard execution failed");
  }
}

@Injectable()
class SyncGuard {
  canActivate(context: GuardContext): boolean {
    return context.method === "GET";
  }
}

// ============================================================================
// GUARD DECORATOR TESTS
// ============================================================================

describe("Guard Decorators", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  // ==========================================================================
  // SINGLE GUARD TESTS
  // ==========================================================================

  describe("Single Guard", () => {
    test("should apply guard to method and allow access", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/" })
        @UseGuards(AuthGuard)
        getUsers() {
          return { users: ["Alice", "Bob"] };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });
      const wynkApp = await app.build();

      // With valid token
      const validResponse = await wynkApp.handle(
        new Request("http://localhost/users", {
          headers: { authorization: "Bearer valid-token" },
        })
      );
      expect(validResponse.status).toBe(200);
      const validData = await validResponse.json();
      expect(validData).toEqual({ users: ["Alice", "Bob"] });
    });

    test("should apply guard to method and deny access", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/" })
        @UseGuards(AuthGuard)
        getUsers() {
          return { users: ["Alice", "Bob"] };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      // Without token
      const wynkApp = await app.build();
      const invalidResponse = await wynkApp.handle(
        new Request("http://localhost/users")
      );
      expect(invalidResponse.status).toBe(403);
    });

    test("should apply role guard to method", async () => {
      @Controller({ path: "/admin" })
      class AdminController {
        @Get({ path: "/dashboard" })
        @UseGuards(RoleGuard)
        getDashboard() {
          return { message: "Admin dashboard" };
        }
      }

      const app = WynkFactory.create({
        controllers: [AdminController],
      });

      // With admin role
      const wynkApp = await app.build();
      const adminResponse = await wynkApp.handle(
        new Request("http://localhost/admin/dashboard", {
          headers: { "x-user-role": "admin" },
        })
      );
      expect(adminResponse.status).toBe(200);

      // With user role
      const userResponse = await wynkApp.handle(
        new Request("http://localhost/admin/dashboard", {
          headers: { "x-user-role": "user" },
        })
      );
      expect(userResponse.status).toBe(403);
    });

    test("should apply throttle guard", async () => {
      @Controller({ path: "/api" })
      class ApiController {
        @Get({ path: "/data" })
        @UseGuards(ThrottleGuard)
        getData() {
          return { data: "success" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      const wynkApp = await app.build();

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await wynkApp.handle(
          new Request("http://localhost/api/data")
        );
        expect(response.status).toBe(200);
      }

      // 6th request should be throttled
      const throttledResponse = await wynkApp.handle(
        new Request("http://localhost/api/data")
      );
      expect(throttledResponse.status).toBe(403);
    });
  });

  // ==========================================================================
  // MULTIPLE GUARDS TESTS
  // ==========================================================================

  describe("Multiple Guards", () => {
    test("should apply multiple guards to method (all pass)", async () => {
      @Controller({ path: "/secure" })
      class SecureController {
        @Get({ path: "/resource" })
        @UseGuards(AuthGuard, ApiKeyGuard)
        getResource() {
          return { message: "Secure resource" };
        }
      }

      const app = WynkFactory.create({
        controllers: [SecureController],
      });

      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/secure/resource", {
          headers: {
            authorization: "Bearer valid-token",
            "x-api-key": "valid-api-key-12345",
          },
        })
      );

      expect(response.status).toBe(200);
    });

    test("should apply multiple guards to method (first fails)", async () => {
      @Controller({ path: "/secure" })
      class SecureController {
        @Get({ path: "/resource" })
        @UseGuards(AuthGuard, ApiKeyGuard)
        getResource() {
          return { message: "Secure resource" };
        }
      }

      const app = WynkFactory.create({
        controllers: [SecureController],
      });

      // Missing auth token, has API key
      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/secure/resource", {
          headers: {
            "x-api-key": "valid-api-key-12345",
          },
        })
      );

      expect(response.status).toBe(403);
    });

    test("should apply multiple guards to method (second fails)", async () => {
      @Controller({ path: "/secure" })
      class SecureController {
        @Get({ path: "/resource" })
        @UseGuards(AuthGuard, ApiKeyGuard)
        getResource() {
          return { message: "Secure resource" };
        }
      }

      const app = WynkFactory.create({
        controllers: [SecureController],
      });

      // Has auth token, missing API key
      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/secure/resource", {
          headers: {
            authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(403);
    });

    test("should execute guards in order", async () => {
      const executionOrder: string[] = [];

      @Injectable()
      class Guard1 {
        async canActivate(context: GuardContext): Promise<boolean> {
          executionOrder.push("guard1");
          return true;
        }
      }

      @Injectable()
      class Guard2 {
        async canActivate(context: GuardContext): Promise<boolean> {
          executionOrder.push("guard2");
          return true;
        }
      }

      @Injectable()
      class Guard3 {
        async canActivate(context: GuardContext): Promise<boolean> {
          executionOrder.push("guard3");
          return true;
        }
      }

      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        @UseGuards(Guard1, Guard2, Guard3)
        getData() {
          return { success: true };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const wynkApp = await app.build();
      await wynkApp.handle(new Request("http://localhost/test"));

      expect(executionOrder).toEqual(["guard1", "guard2", "guard3"]);
    });
  });

  // ==========================================================================
  // CONTROLLER-LEVEL GUARDS
  // ==========================================================================

  describe("Controller-Level Guards", () => {
    test("should apply guard to all controller methods", async () => {
      @Controller({ path: "/protected" })
      @UseGuards(AuthGuard)
      class ProtectedController {
        @Get({ path: "/resource1" })
        getResource1() {
          return { resource: 1 };
        }

        @Get({ path: "/resource2" })
        getResource2() {
          return { resource: 2 };
        }

        @Post({ path: "/resource3" })
        createResource() {
          return { resource: 3 };
        }
      }

      const app = WynkFactory.create({
        controllers: [ProtectedController],
      });

      // All routes should require auth
      const routes = ["/resource1", "/resource2"];
      for (const route of routes) {
        const wynkApp = await app.build();
        const response = await wynkApp.handle(
          new Request(`http://localhost/protected${route}`)
        );
        expect(response.status).toBe(403);

        const authorizedResponse = await wynkApp.handle(
          new Request(`http://localhost/protected${route}`, {
            headers: { authorization: "Bearer valid-token" },
          })
        );
        expect(authorizedResponse.status).toBe(200);
      }
    });

    test("should combine controller and method guards", async () => {
      @Controller({ path: "/admin" })
      @UseGuards(AuthGuard)
      class AdminController {
        @Get({ path: "/users" })
        getUsers() {
          return { users: [] };
        }

        @Get({ path: "/settings" })
        @UseGuards(RoleGuard)
        getSettings() {
          return { settings: {} };
        }
      }

      const app = WynkFactory.create({
        controllers: [AdminController],
      });

      // /users requires only auth
      const wynkApp = await app.build();
      const usersResponse = await wynkApp.handle(
        new Request("http://localhost/admin/users", {
          headers: { authorization: "Bearer valid-token" },
        })
      );
      expect(usersResponse.status).toBe(200);

      // /settings requires auth + admin role
      const settingsResponse = await wynkApp.handle(
        new Request("http://localhost/admin/settings", {
          headers: {
            authorization: "Bearer valid-token",
            "x-user-role": "user", // Not admin
          },
        })
      );
      expect(settingsResponse.status).toBe(403);

      // /settings with admin role
      const adminSettingsResponse = await wynkApp.handle(
        new Request("http://localhost/admin/settings", {
          headers: {
            authorization: "Bearer valid-token",
            "x-user-role": "admin",
          },
        })
      );
      expect(adminSettingsResponse.status).toBe(200);
    });
  });

  // ==========================================================================
  // GUARD WITH CONTEXT ACCESS
  // ==========================================================================

  describe("Guard with Context Access", () => {
    test("should access params in guard", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/:userId/profile" })
        @UseGuards(OwnershipGuard)
        getProfile() {
          return { profile: "User profile" };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      // Matching user ID
      const wynkApp = await app.build();
      const ownResponse = await wynkApp.handle(
        new Request("http://localhost/users/123/profile", {
          headers: { "x-user-id": "123" },
        })
      );
      expect(ownResponse.status).toBe(200);

      // Different user ID
      const otherResponse = await wynkApp.handle(
        new Request("http://localhost/users/123/profile", {
          headers: { "x-user-id": "456" },
        })
      );
      expect(otherResponse.status).toBe(403);
    });

    test("should access query params in guard", async () => {
      @Controller({ path: "/api" })
      class ApiController {
        @Get({ path: "/data" })
        @UseGuards(ApiKeyGuard)
        getData() {
          return { data: "success" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      // API key in query
      const wynkApp = await app.build();
      const queryResponse = await wynkApp.handle(
        new Request("http://localhost/api/data?apiKey=valid-api-key-12345")
      );
      expect(queryResponse.status).toBe(200);

      // API key in header
      const headerResponse = await wynkApp.handle(
        new Request("http://localhost/api/data", {
          headers: { "x-api-key": "valid-api-key-12345" },
        })
      );
      expect(headerResponse.status).toBe(200);
    });

    test("should access request method in guard", async () => {
      @Controller({ path: "/readonly" })
      class ReadOnlyController {
        @Get({ path: "/" })
        @UseGuards(SyncGuard)
        getData() {
          return { data: "readonly" };
        }

        @Post({ path: "/" })
        @UseGuards(SyncGuard)
        createData() {
          return { data: "created" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ReadOnlyController],
      });

      // GET allowed
      const wynkApp = await app.build();
      const getResponse = await wynkApp.handle(
        new Request("http://localhost/readonly")
      );
      expect(getResponse.status).toBe(200);

      // POST denied
      const postResponse = await wynkApp.handle(
        new Request("http://localhost/readonly", { method: "POST" })
      );
      expect(postResponse.status).toBe(403);
    });
  });

  // ==========================================================================
  // GLOBAL GUARDS
  // ==========================================================================

  describe("Global Guards", () => {
    test("should apply global guard to all routes", async () => {
      @Controller({ path: "/public" })
      class PublicController {
        @Get({ path: "/info" })
        getInfo() {
          return { info: "public" };
        }
      }

      @Controller({ path: "/data" })
      class DataController {
        @Get({ path: "/items" })
        getItems() {
          return { items: [] };
        }
      }

      const app = WynkFactory.create({
        controllers: [PublicController, DataController],
      });

      app.useGlobalGuards(MaintenanceGuard);

      await app.build();

      // Both routes should pass maintenance guard
      const wynkApp = await app.build();
      const info = await wynkApp.handle(
        new Request("http://localhost/public/info")
      );
      expect(info.status).toBe(200);

      const items = await wynkApp.handle(
        new Request("http://localhost/data/items")
      );
      expect(items.status).toBe(200);
    });

    test("should combine global and method guards", async () => {
      @Controller({ path: "/api" })
      class ApiController {
        @Get({ path: "/public" })
        getPublic() {
          return { data: "public" };
        }

        @Get({ path: "/private" })
        @UseGuards(AuthGuard)
        getPrivate() {
          return { data: "private" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      app.useGlobalGuards(MaintenanceGuard);

      await app.build();

      // Public route: only maintenance guard
      const wynkApp = await app.build();
      const publicResponse = await wynkApp.handle(
        new Request("http://localhost/api/public")
      );
      expect(publicResponse.status).toBe(200);

      // Private route: maintenance + auth guard
      const privateNoAuth = await wynkApp.handle(
        new Request("http://localhost/api/private")
      );
      expect(privateNoAuth.status).toBe(403);

      const privateWithAuth = await wynkApp.handle(
        new Request("http://localhost/api/private", {
          headers: { authorization: "Bearer valid-token" },
        })
      );
      expect(privateWithAuth.status).toBe(200);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    test("should handle guard throwing error", async () => {
      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        @UseGuards(FailingGuard)
        getData() {
          return { data: "success" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/test")
      );

      // Should return error response
      expect(response.status).toBe(500);
    });

    test("should stop execution if guard fails", async () => {
      let handlerCalled = false;

      @Controller({ path: "/protected" })
      class ProtectedController {
        @Get({ path: "/" })
        @UseGuards(AuthGuard)
        getData() {
          handlerCalled = true;
          return { data: "success" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ProtectedController],
      });

      // No auth token - guard fails
      const wynkApp = await app.build();
      await wynkApp.handle(new Request("http://localhost/protected"));

      expect(handlerCalled).toBe(false);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    test("should handle empty guard array", async () => {
      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        @UseGuards()
        getData() {
          return { data: "success" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/test")
      );
      expect(response.status).toBe(200);
    });

    test("should handle guard returning false explicitly", async () => {
      @Injectable()
      class AlwaysDenyGuard {
        async canActivate(): Promise<boolean> {
          return false;
        }
      }

      @Controller({ path: "/denied" })
      class DeniedController {
        @Get({ path: "/" })
        @UseGuards(AlwaysDenyGuard)
        getData() {
          return { data: "never reached" };
        }
      }

      const app = WynkFactory.create({
        controllers: [DeniedController],
      });

      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/denied")
      );
      expect(response.status).toBe(403);
    });

    test("should handle synchronous guard", async () => {
      @Injectable()
      class SyncGuardTest {
        canActivate(): boolean {
          return true;
        }
      }

      @Controller({ path: "/sync" })
      class SyncController {
        @Get({ path: "/" })
        @UseGuards(SyncGuardTest)
        getData() {
          return { data: "sync" };
        }
      }

      const app = WynkFactory.create({
        controllers: [SyncController],
      });

      const wynkApp = await app.build();
      const response = await wynkApp.handle(
        new Request("http://localhost/sync")
      );
      expect(response.status).toBe(200);
    });
  });
});
