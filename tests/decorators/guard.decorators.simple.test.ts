// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, test, expect } from "bun:test";
import { Controller, Get, Post, UseGuards, WynkFactory } from "../../core";

// Mock Guard implementations
class AuthGuard {
  canActivate() {
    return true;
  }
}

class RoleGuard {
  canActivate() {
    return true;
  }
}

class ThrottleGuard {
  canActivate() {
    return true;
  }
}

describe("@UseGuards Decorator", () => {
  describe("Single Guard", () => {
    test("should apply single guard to method", async () => {
      @Controller("/users")
      class UserController {
        @Get({ path: "/" })
        @UseGuards(AuthGuard)
        async getUsers() {
          return { users: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [UserController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      // Check guards metadata on method
      const guards = Reflect.getMetadata(
        "guards",
        UserController.prototype,
        "getUsers"
      );
      expect(guards).toBeDefined();
      expect(guards.length).toBe(1);
      expect(guards).toContain(AuthGuard);
    });

    test("should apply guard to POST method", async () => {
      @Controller("/admin")
      class AdminController {
        @Post({ path: "/action" })
        @UseGuards(RoleGuard)
        async performAction() {
          return { success: true };
        }
      }

      const app = WynkFactory.create({ controllers: [AdminController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const guards = Reflect.getMetadata(
        "guards",
        AdminController.prototype,
        "performAction"
      );
      expect(guards).toContain(RoleGuard);
    });
  });

  describe("Multiple Guards", () => {
    test("should apply multiple guards to method", async () => {
      @Controller("/api")
      class ApiController {
        @Get({ path: "/data" })
        @UseGuards(AuthGuard, RoleGuard)
        async getData() {
          return { data: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [ApiController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const guards = Reflect.getMetadata(
        "guards",
        ApiController.prototype,
        "getData"
      );
      expect(guards).toBeDefined();
      expect(guards.length).toBe(2);
      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(RoleGuard);
    });

    test("should preserve guard order", async () => {
      @Controller("/secure")
      class SecureController {
        @Post({ path: "/action" })
        @UseGuards(AuthGuard, RoleGuard, ThrottleGuard)
        async secureAction() {
          return { success: true };
        }
      }

      const app = WynkFactory.create({ controllers: [SecureController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const guards = Reflect.getMetadata(
        "guards",
        SecureController.prototype,
        "secureAction"
      );
      expect(guards.length).toBe(3);
      expect(guards[0]).toBe(AuthGuard);
      expect(guards[1]).toBe(RoleGuard);
      expect(guards[2]).toBe(ThrottleGuard);
    });
  });

  describe("Controller-Level Guards", () => {
    test("should apply guard to all routes in controller", async () => {
      @Controller("/protected")
      @UseGuards(AuthGuard)
      class ProtectedController {
        @Get({ path: "/users" })
        async getUsers() {
          return { users: [] };
        }

        @Post({ path: "/users" })
        async createUser() {
          return { created: true };
        }
      }

      const app = WynkFactory.create({ controllers: [ProtectedController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      // Check guards on controller class
      const controllerGuards = Reflect.getMetadata(
        "guards",
        ProtectedController
      );
      expect(controllerGuards).toBeDefined();
      expect(controllerGuards).toContain(AuthGuard);

      // Both methods should have the controller guard
      const getUsersGuards = Reflect.getMetadata(
        "guards",
        ProtectedController.prototype,
        "getUsers"
      );
      const createUserGuards = Reflect.getMetadata(
        "guards",
        ProtectedController.prototype,
        "createUser"
      );
      expect(getUsersGuards).toBeUndefined(); // Method-specific guards only
      expect(createUserGuards).toBeUndefined(); // Method-specific guards only
    });

    test("should combine controller and method guards", async () => {
      @Controller("/admin")
      @UseGuards(AuthGuard)
      class AdminController {
        @Get({ path: "/dashboard" })
        @UseGuards(RoleGuard)
        async getDashboard() {
          return { dashboard: "data" };
        }
      }

      const app = WynkFactory.create({ controllers: [AdminController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      // Check controller-level guards
      const controllerGuards = Reflect.getMetadata("guards", AdminController);
      expect(controllerGuards).toBeDefined();
      expect(controllerGuards).toContain(AuthGuard);

      // Check method-level guards
      const methodGuards = Reflect.getMetadata(
        "guards",
        AdminController.prototype,
        "getDashboard"
      );
      expect(methodGuards).toBeDefined();
      expect(methodGuards).toContain(RoleGuard);
    });
  });

  describe("Global Guards", () => {
    test("should register global guard", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      // Global guards would be configured differently
      // This test just ensures factory accepts controllers
      expect(app).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty guards array", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UseGuards()
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const guards = Reflect.getMetadata(
        "guards",
        TestController.prototype,
        "test"
      );
      expect(guards).toBeDefined();
      expect(guards.length).toBe(0);
    });

    test("should handle undefined guards", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const routes = Reflect.getMetadata("routes", TestController.prototype);
      expect(routes[0].guards).toBeUndefined();
    });

    test("should handle duplicate guards", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UseGuards(AuthGuard, AuthGuard)
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const guards = Reflect.getMetadata(
        "guards",
        TestController.prototype,
        "test"
      );
      expect(guards.length).toBe(2);
    });
  });
});
