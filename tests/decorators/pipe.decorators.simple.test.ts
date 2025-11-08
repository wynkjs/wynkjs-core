// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, test, expect } from "bun:test";
import { Controller, Get, Post, UsePipes, WynkFactory } from "../../core";

// Mock Pipe implementations
class ValidationPipe {
  transform(value: any) {
    return value;
  }
}

class ParseIntPipe {
  transform(value: any) {
    return parseInt(value);
  }
}

class TrimPipe {
  transform(value: any) {
    return value?.trim?.() || value;
  }
}

describe("@UsePipes Decorator", () => {
  describe("Single Pipe", () => {
    test("should apply single pipe to method", async () => {
      @Controller("/users")
      class UserController {
        @Get({ path: "/" })
        @UsePipes(ValidationPipe)
        async getUsers() {
          return { users: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [UserController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const pipes = Reflect.getMetadata(
        "pipes",
        UserController.prototype,
        "getUsers"
      );
      expect(pipes).toBeDefined();
      expect(pipes.length).toBe(1);
      expect(pipes).toContain(ValidationPipe);
    });

    test("should apply pipe to POST method", async () => {
      @Controller("/data")
      class DataController {
        @Post({ path: "/" })
        @UsePipes(ParseIntPipe)
        async createData() {
          return { created: true };
        }
      }

      const app = WynkFactory.create({ controllers: [DataController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const pipes = Reflect.getMetadata(
        "pipes",
        DataController.prototype,
        "createData"
      );
      expect(pipes).toContain(ParseIntPipe);
    });
  });

  describe("Multiple Pipes", () => {
    test("should apply multiple pipes to method", async () => {
      @Controller("/api")
      class ApiController {
        @Get({ path: "/data" })
        @UsePipes(TrimPipe, ValidationPipe)
        async getData() {
          return { data: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [ApiController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const pipes = Reflect.getMetadata(
        "pipes",
        ApiController.prototype,
        "getData"
      );
      expect(pipes).toBeDefined();
      expect(pipes.length).toBe(2);
      expect(pipes).toContain(TrimPipe);
      expect(pipes).toContain(ValidationPipe);
    });

    test("should preserve pipe order", async () => {
      @Controller("/secure")
      class SecureController {
        @Post({ path: "/action" })
        @UsePipes(TrimPipe, ParseIntPipe, ValidationPipe)
        async secureAction() {
          return { success: true };
        }
      }

      const app = WynkFactory.create({ controllers: [SecureController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const pipes = Reflect.getMetadata(
        "pipes",
        SecureController.prototype,
        "secureAction"
      );
      expect(pipes.length).toBe(3);
      expect(pipes[0]).toBe(TrimPipe);
      expect(pipes[1]).toBe(ParseIntPipe);
      expect(pipes[2]).toBe(ValidationPipe);
    });
  });

  describe("Controller-Level Pipes", () => {
    test("should apply pipe to all routes in controller", async () => {
      @Controller("/protected")
      @UsePipes(ValidationPipe)
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

      const pipes = Reflect.getMetadata("pipes", ProtectedController);
      expect(pipes).toBeDefined();
      expect(pipes).toContain(ValidationPipe);
    });

    test("should combine controller and method pipes", async () => {
      @Controller("/admin")
      @UsePipes(TrimPipe)
      class AdminController {
        @Get({ path: "/dashboard" })
        @UsePipes(ValidationPipe)
        async getDashboard() {
          return { dashboard: "data" };
        }
      }

      const app = WynkFactory.create({ controllers: [AdminController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const controllerPipes = Reflect.getMetadata("pipes", AdminController);
      expect(controllerPipes).toBeDefined();
      expect(controllerPipes).toContain(TrimPipe);

      const methodPipes = Reflect.getMetadata(
        "pipes",
        AdminController.prototype,
        "getDashboard"
      );
      expect(methodPipes).toBeDefined();
      expect(methodPipes).toContain(ValidationPipe);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty pipes array", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UsePipes()
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const pipes = Reflect.getMetadata(
        "pipes",
        TestController.prototype,
        "test"
      );
      expect(pipes).toBeDefined();
      expect(pipes.length).toBe(0);
    });

    test("should handle undefined pipes", async () => {
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

      const pipes = Reflect.getMetadata(
        "pipes",
        TestController.prototype,
        "test"
      );
      expect(pipes).toBeUndefined();
    });

    test("should handle duplicate pipes", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UsePipes(ValidationPipe, ValidationPipe)
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const pipes = Reflect.getMetadata(
        "pipes",
        TestController.prototype,
        "test"
      );
      expect(pipes.length).toBe(2);
    });
  });
});
