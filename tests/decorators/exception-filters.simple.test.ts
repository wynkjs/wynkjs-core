// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, test, expect } from "bun:test";
import { Controller, Get, Post, UseFilters, WynkFactory } from "../../core";

// Mock Exception Filter implementations
class HttpExceptionFilter {
  catch(exception: any, context: any) {
    return { error: "HTTP error" };
  }
}

class ValidationExceptionFilter {
  catch(exception: any, context: any) {
    return { error: "Validation error" };
  }
}

class GlobalExceptionFilter {
  catch(exception: any, context: any) {
    return { error: "Global error" };
  }
}

describe("@UseFilters Decorator", () => {
  describe("Single Filter", () => {
    test("should apply single filter to method", async () => {
      @Controller("/users")
      class UserController {
        @Get({ path: "/" })
        @UseFilters(HttpExceptionFilter)
        async getUsers() {
          return { users: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [UserController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const filters = Reflect.getMetadata(
        "filters",
        UserController.prototype,
        "getUsers"
      );
      expect(filters).toBeDefined();
      expect(filters.length).toBe(1);
      expect(filters).toContain(HttpExceptionFilter);
    });

    test("should apply filter to POST method", async () => {
      @Controller("/data")
      class DataController {
        @Post({ path: "/" })
        @UseFilters(ValidationExceptionFilter)
        async createData() {
          return { created: true };
        }
      }

      const app = WynkFactory.create({ controllers: [DataController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const filters = Reflect.getMetadata(
        "filters",
        DataController.prototype,
        "createData"
      );
      expect(filters).toContain(ValidationExceptionFilter);
    });
  });

  describe("Multiple Filters", () => {
    test("should apply multiple filters to method", async () => {
      @Controller("/api")
      class ApiController {
        @Get({ path: "/data" })
        @UseFilters(HttpExceptionFilter, ValidationExceptionFilter)
        async getData() {
          return { data: [] };
        }
      }

      const app = WynkFactory.create({ controllers: [ApiController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const filters = Reflect.getMetadata(
        "filters",
        ApiController.prototype,
        "getData"
      );
      expect(filters).toBeDefined();
      expect(filters.length).toBe(2);
      expect(filters).toContain(HttpExceptionFilter);
      expect(filters).toContain(ValidationExceptionFilter);
    });

    test("should preserve filter order", async () => {
      @Controller("/secure")
      class SecureController {
        @Post({ path: "/action" })
        @UseFilters(
          HttpExceptionFilter,
          ValidationExceptionFilter,
          GlobalExceptionFilter
        )
        async secureAction() {
          return { success: true };
        }
      }

      const app = WynkFactory.create({ controllers: [SecureController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const filters = Reflect.getMetadata(
        "filters",
        SecureController.prototype,
        "secureAction"
      );
      expect(filters.length).toBe(3);
      expect(filters[0]).toBe(HttpExceptionFilter);
      expect(filters[1]).toBe(ValidationExceptionFilter);
      expect(filters[2]).toBe(GlobalExceptionFilter);
    });
  });

  describe("Controller-Level Filters", () => {
    test("should apply filter to all routes in controller", async () => {
      @Controller("/protected")
      @UseFilters(HttpExceptionFilter)
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

      const filters = Reflect.getMetadata("filters", ProtectedController);
      expect(filters).toBeDefined();
      expect(filters).toContain(HttpExceptionFilter);
    });

    test("should combine controller and method filters", async () => {
      @Controller("/admin")
      @UseFilters(HttpExceptionFilter)
      class AdminController {
        @Get({ path: "/dashboard" })
        @UseFilters(ValidationExceptionFilter)
        async getDashboard() {
          return { dashboard: "data" };
        }
      }

      const app = WynkFactory.create({ controllers: [AdminController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const controllerFilters = Reflect.getMetadata("filters", AdminController);
      expect(controllerFilters).toBeDefined();
      expect(controllerFilters).toContain(HttpExceptionFilter);

      const methodFilters = Reflect.getMetadata(
        "filters",
        AdminController.prototype,
        "getDashboard"
      );
      expect(methodFilters).toBeDefined();
      expect(methodFilters).toContain(ValidationExceptionFilter);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty filters array", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UseFilters()
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const filters = Reflect.getMetadata(
        "filters",
        TestController.prototype,
        "test"
      );
      expect(filters).toBeDefined();
      expect(filters.length).toBe(0);
    });

    test("should handle undefined filters", async () => {
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

      const filters = Reflect.getMetadata(
        "filters",
        TestController.prototype,
        "test"
      );
      expect(filters).toBeUndefined();
    });

    test("should handle duplicate filters", async () => {
      @Controller("/test")
      class TestController {
        @Get({ path: "/" })
        @UseFilters(HttpExceptionFilter, HttpExceptionFilter)
        async test() {
          return { test: true };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const wynkApp = await app.build();
      expect(wynkApp).toBeDefined();

      const filters = Reflect.getMetadata(
        "filters",
        TestController.prototype,
        "test"
      );
      expect(filters.length).toBe(2);
    });
  });
});
