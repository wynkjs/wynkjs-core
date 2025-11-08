// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, test, expect } from "bun:test";
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  WynkFactory,
} from "../../core";

// Mock Interceptor implementations
class LoggingInterceptor {
  async intercept(context: any, next: any) {
    return next.handle();
  }
}

class TransformInterceptor {
  async intercept(context: any, next: any) {
    return next.handle();
  }
}

class CacheInterceptor {
  async intercept(context: any, next: any) {
    return next.handle();
  }
}

describe("@UseInterceptors Decorator", () => {
  describe("Single Interceptor", () => {
    test("should apply single interceptor to method", async () => {
      @Controller("/users")
      class UserController {
        @Get({ path: "/" })
        @UseInterceptors(LoggingInterceptor)
        async getUsers() {
          return { users: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [UserController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const interceptors = Reflect.getMetadata(
        "interceptors",
        UserController.prototype,
        "getUsers"
      );
      expect(interceptors).toBeDefined();
      expect(interceptors.length).toBe(1);
      expect(interceptors).toContain(LoggingInterceptor);
    });

    test("should apply interceptor to POST method", async () => {
      @Controller("/data")
      class DataController {
        @Post({ path: "/" })
        @UseInterceptors(TransformInterceptor)
        async createData() {
          return { created: true };
        }
      }

      const app = WynkFactory.create({ controllers: [DataController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const interceptors = Reflect.getMetadata(
        "interceptors",
        DataController.prototype,
        "createData"
      );
      expect(interceptors).toContain(TransformInterceptor);
    });
  });

  describe("Multiple Interceptors", () => {
    test("should apply multiple interceptors to method", async () => {
      @Controller("/api")
      class ApiController {
        @Get({ path: "/data" })
        @UseInterceptors(LoggingInterceptor, TransformInterceptor)
        async getData() {
          return { data: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [ApiController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const interceptors = Reflect.getMetadata(
        "interceptors",
        ApiController.prototype,
        "getData"
      );
      expect(interceptors).toBeDefined();
      expect(interceptors.length).toBe(2);
      expect(interceptors).toContain(LoggingInterceptor);
      expect(interceptors).toContain(TransformInterceptor);
    });

    test("should preserve interceptor order", async () => {
      @Controller("/secure")
      class SecureController {
        @Post({ path: "/action" })
        @UseInterceptors(
          LoggingInterceptor,
          CacheInterceptor,
          TransformInterceptor
        )
        async secureAction() {
          return { success: true };
        }
      }

      const app = WynkFactory.create({ controllers: [SecureController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const interceptors = Reflect.getMetadata(
        "interceptors",
        SecureController.prototype,
        "secureAction"
      );
      expect(interceptors.length).toBe(3);
      expect(interceptors[0]).toBe(LoggingInterceptor);
      expect(interceptors[1]).toBe(CacheInterceptor);
      expect(interceptors[2]).toBe(TransformInterceptor);
    });
  });

  describe("Controller-Level Interceptors", () => {
    test("should apply interceptor to all routes in controller", async () => {
      @Controller("/protected")
      @UseInterceptors(LoggingInterceptor)
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

      const interceptors = Reflect.getMetadata(
        "interceptors",
        ProtectedController
      );
      expect(interceptors).toBeDefined();
      expect(interceptors).toContain(LoggingInterceptor);
    });

    test("should combine controller and method interceptors", async () => {
      @Controller("/admin")
      @UseInterceptors(LoggingInterceptor)
      class AdminController {
        @Get({ path: "/dashboard" })
        @UseInterceptors(TransformInterceptor)
        async getDashboard() {
          return { dashboard: "data" };
        }
      }

      const app = WynkFactory.create({ controllers: [AdminController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const controllerInterceptors = Reflect.getMetadata(
        "interceptors",
        AdminController
      );
      expect(controllerInterceptors).toBeDefined();
      expect(controllerInterceptors).toContain(LoggingInterceptor);

      const methodInterceptors = Reflect.getMetadata(
        "interceptors",
        AdminController.prototype,
        "getDashboard"
      );
      expect(methodInterceptors).toBeDefined();
      expect(methodInterceptors).toContain(TransformInterceptor);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty interceptors array", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UseInterceptors()
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const interceptors = Reflect.getMetadata(
        "interceptors",
        TestController.prototype,
        "test"
      );
      expect(interceptors).toBeDefined();
      expect(interceptors.length).toBe(0);
    });

    test("should handle undefined interceptors", async () => {
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

      const interceptors = Reflect.getMetadata(
        "interceptors",
        TestController.prototype,
        "test"
      );
      expect(interceptors).toBeUndefined();
    });

    test("should handle duplicate interceptors", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UseInterceptors(LoggingInterceptor, LoggingInterceptor)
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const interceptors = Reflect.getMetadata(
        "interceptors",
        TestController.prototype,
        "test"
      );
      expect(interceptors.length).toBe(2);
    });
  });
});
