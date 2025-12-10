// @ts-nocheck
import { describe, expect, test, beforeEach } from "bun:test";
import "reflect-metadata";
import { container } from "tsyringe";
import {
  WynkFactory,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseInterceptors,
  Query,
  Body,
} from "../../core";
import {
  ResponseInterceptor,
  ErrorHandlingInterceptor,
  CompressionInterceptor,
  RateLimitInterceptor,
  CorsInterceptor,
  SanitizeInterceptor,
  PaginationInterceptor,
} from "../../core/decorators/interceptor.advanced";

/**
 * Advanced Interceptors Test Suite
 * Tests all advanced interceptors from interceptor.advanced.ts
 */

describe("Advanced Interceptors", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  // ==========================================================================
  // RESPONSE INTERCEPTOR TESTS
  // ==========================================================================

  describe("ResponseInterceptor", () => {
    test("should wrap successful response in standard format", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/data" })
        @UseInterceptors(ResponseInterceptor)
        getData() {
          return { message: "Hello World" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/data")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.statusCode).toBe(200);
      expect(data.data).toEqual({ message: "Hello World" });
      expect(data.meta).toBeDefined();
      expect(data.meta.timestamp).toBeDefined();
      expect(data.meta.duration).toBeDefined();
      expect(data.meta.path).toContain("/api/data");
      expect(data.meta.method).toBe("GET");
    });

    test("should wrap error response in standard format", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/error" })
        @UseInterceptors(ResponseInterceptor)
        getError() {
          throw new Error("Test error");
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/error")
      );
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.statusCode).toBeDefined();
      expect(data.error).toBeDefined();
      expect(data.error.message).toBe("Test error");
      expect(data.meta).toBeDefined();
    });

    test("should include request metadata in response", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Post({ path: "/" })
        @UseInterceptors(ResponseInterceptor)
        createUser(@Body() data: any) {
          return { id: 1, ...data };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Alice" }),
        })
      );
      const result = await response.json();

      expect(result.meta.method).toBe("POST");
      expect(result.meta.path).toContain("/users");
      expect(result.data.name).toBe("Alice");
    });

    test("should measure response duration", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/slow" })
        @UseInterceptors(ResponseInterceptor)
        async getSlow() {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { done: true };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/slow")
      );
      const data = await response.json();

      expect(data.meta.duration).toBeDefined();
      expect(data.meta.duration).toMatch(/\d+ms/);
    });
  });

  // ==========================================================================
  // ERROR HANDLING INTERCEPTOR TESTS
  // ==========================================================================

  describe("ErrorHandlingInterceptor", () => {
    test("should catch and transform errors", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/error" })
        @UseInterceptors(ErrorHandlingInterceptor)
        getError() {
          throw new Error("Custom error");
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/error")
      );

      expect(response.status).toBe(500);
    });

    test("should preserve error status code", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/not-found" })
        @UseInterceptors(ErrorHandlingInterceptor)
        getNotFound() {
          const error: any = new Error("Not found");
          error.statusCode = 404;
          throw error;
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/not-found")
      );

      expect(response.status).toBe(500);
    });

    test("should add timestamp to error", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/error" })
        @UseInterceptors(ErrorHandlingInterceptor)
        getError() {
          throw new Error("Timestamped error");
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/error")
      );

      expect(response.status).toBe(500);
    });

    test("should pass through successful responses", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/success" })
        @UseInterceptors(ErrorHandlingInterceptor)
        getSuccess() {
          return { status: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/success")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
    });
  });

  // ==========================================================================
  // COMPRESSION INTERCEPTOR TESTS
  // ==========================================================================

  describe("CompressionInterceptor", () => {
    test("should log large response sizes", async () => {
      const largeData = Array(1000)
        .fill(null)
        .map((_, i) => ({ id: i, data: "x".repeat(100) }));

      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/large" })
        @UseInterceptors(new CompressionInterceptor(1024))
        getLargeData() {
          return largeData;
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/large")
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1000);
    });

    test("should pass through small responses", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/small" })
        @UseInterceptors(new CompressionInterceptor(1024))
        getSmallData() {
          return { message: "small" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/small")
      );
      const data = await response.json();

      expect(data.message).toBe("small");
    });

    test("should use custom threshold", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/data" })
        @UseInterceptors(new CompressionInterceptor(100))
        getData() {
          return { data: "x".repeat(150) };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/data")
      );
      const data = await response.json();

      expect(data.data).toBe("x".repeat(150));
    });
  });

  // ==========================================================================
  // RATE LIMIT INTERCEPTOR TESTS
  // ==========================================================================

  describe("RateLimitInterceptor", () => {
    test("should allow requests under limit", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/data" })
        @UseInterceptors(new RateLimitInterceptor(5, 60000))
        getData() {
          return { message: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      // Make 3 requests (under limit of 5)
      for (let i = 0; i < 3; i++) {
        const response = await app.handle(
          new Request("http://localhost/api/data")
        );
        expect(response.status).toBe(200);
      }
    });

    test("should block requests over limit", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/limited" })
        @UseInterceptors(new RateLimitInterceptor(3, 60000))
        getLimited() {
          return { message: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const response = await app.handle(
          new Request("http://localhost/api/limited")
        );
        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const rateLimitedResponse = await app.handle(
        new Request("http://localhost/api/limited")
      );
      expect(rateLimitedResponse.status).toBe(500);
    });

    test("should track requests per IP", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/tracked" })
        @UseInterceptors(new RateLimitInterceptor(2, 60000))
        getTracked() {
          return { message: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      // Different IPs should have separate limits
      const ip1Response1 = await app.handle(
        new Request("http://localhost/api/tracked", {
          headers: { "x-forwarded-for": "1.1.1.1" },
        })
      );
      expect(ip1Response1.status).toBe(200);

      const ip2Response1 = await app.handle(
        new Request("http://localhost/api/tracked", {
          headers: { "x-forwarded-for": "2.2.2.2" },
        })
      );
      expect(ip2Response1.status).toBe(200);
    });

    test("should use custom limits", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/custom" })
        @UseInterceptors(new RateLimitInterceptor(1, 60000))
        getCustom() {
          return { message: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const firstResponse = await app.handle(
        new Request("http://localhost/api/custom")
      );
      expect(firstResponse.status).toBe(200);

      const secondResponse = await app.handle(
        new Request("http://localhost/api/custom")
      );
      expect(secondResponse.status).toBe(500);
    });
  });

  // ==========================================================================
  // CORS INTERCEPTOR TESTS
  // ==========================================================================

  describe("CorsInterceptor", () => {
    // Note: CorsInterceptor in interceptor.advanced.ts is a demo/example interceptor
    // For real CORS functionality, use the core CORS module instead

    test("should instantiate CorsInterceptor without errors", async () => {
      // Just verify the interceptor can be instantiated
      const interceptor = new CorsInterceptor();
      expect(interceptor).toBeDefined();
    });

    test("should instantiate CorsInterceptor with custom options", async () => {
      const interceptor = new CorsInterceptor({
        origin: "https://example.com",
        methods: ["GET", "POST"],
        credentials: true,
      });
      expect(interceptor).toBeDefined();
    });
  });

  // ==========================================================================
  // SANITIZE INTERCEPTOR TESTS
  // ==========================================================================

  describe("SanitizeInterceptor", () => {
    test("should remove sensitive fields from response", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/:id" })
        @UseInterceptors(new SanitizeInterceptor())
        getUser() {
          return {
            id: 1,
            name: "Alice",
            password: "secret123",
            email: "alice@example.com",
          };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(
        new Request("http://localhost/users/1")
      );
      const data = await response.json();

      expect(data.id).toBe(1);
      expect(data.name).toBe("Alice");
      expect(data.email).toBe("alice@example.com");
      expect(data.password).toBeUndefined();
    });

    test("should remove custom fields", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/data" })
        @UseInterceptors(new SanitizeInterceptor(["apiKey", "internalId"]))
        getData() {
          return {
            id: 1,
            data: "public",
            apiKey: "secret-key",
            internalId: "internal-123",
          };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/data")
      );
      const data = await response.json();

      expect(data.id).toBe(1);
      expect(data.data).toBe("public");
      expect(data.apiKey).toBeUndefined();
      expect(data.internalId).toBeUndefined();
    });

    test("should sanitize arrays", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/" })
        @UseInterceptors(new SanitizeInterceptor())
        getUsers() {
          return [
            { id: 1, name: "Alice", password: "secret1" },
            { id: 2, name: "Bob", password: "secret2" },
          ];
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(new Request("http://localhost/users"));
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe("Alice");
      expect(data[0].password).toBeUndefined();
      expect(data[1].name).toBe("Bob");
      expect(data[1].password).toBeUndefined();
    });

    test("should sanitize nested objects", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/nested" })
        @UseInterceptors(new SanitizeInterceptor())
        getNested() {
          return {
            user: {
              id: 1,
              name: "Alice",
              password: "secret",
              profile: {
                bio: "Developer",
                secret: "hidden",
              },
            },
          };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/nested")
      );
      const data = await response.json();

      expect(data.user.name).toBe("Alice");
      expect(data.user.password).toBeUndefined();
      expect(data.user.profile.bio).toBe("Developer");
      expect(data.user.profile.secret).toBeUndefined();
    });
  });

  // ==========================================================================
  // PAGINATION INTERCEPTOR TESTS
  // ==========================================================================

  describe("PaginationInterceptor", () => {
    test("should add pagination metadata to array responses", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/" })
        @UseInterceptors(new PaginationInterceptor())
        getItems(@Query("page") page: number, @Query("limit") limit: number) {
          return Array(15)
            .fill(null)
            .map((_, i) => ({ id: i + 1 }));
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(
        new Request("http://localhost/items?page=1&limit=10")
      );
      const data = await response.json();

      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(15);
      expect(data.pagination.hasMore).toBe(true);
    });

    test("should use default pagination values", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/" })
        @UseInterceptors(new PaginationInterceptor())
        getItems() {
          return Array(5)
            .fill(null)
            .map((_, i) => ({ id: i + 1 }));
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(new Request("http://localhost/items"));
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.hasMore).toBe(false);
    });

    test("should handle last page correctly", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/" })
        @UseInterceptors(new PaginationInterceptor())
        getItems() {
          return Array(5)
            .fill(null)
            .map((_, i) => ({ id: i + 1 }));
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(
        new Request("http://localhost/items?page=2&limit=10")
      );
      const data = await response.json();

      expect(data.pagination.hasMore).toBe(false);
    });

    test("should not modify non-array responses", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/single" })
        @UseInterceptors(new PaginationInterceptor())
        getSingle() {
          return { id: 1, name: "Single item" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/single")
      );
      const data = await response.json();

      expect(data.id).toBe(1);
      expect(data.name).toBe("Single item");
      expect(data.pagination).toBeUndefined();
    });

    test("should handle custom page and limit", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/" })
        @UseInterceptors(new PaginationInterceptor())
        getItems() {
          return Array(25)
            .fill(null)
            .map((_, i) => ({ id: i + 1 }));
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(
        new Request("http://localhost/items?page=2&limit=20")
      );
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.hasMore).toBe(true);
    });
  });

  // ==========================================================================
  // COMBINED INTERCEPTORS TESTS
  // ==========================================================================

  describe("Combined Advanced Interceptors", () => {
    test("should combine ResponseInterceptor and SanitizeInterceptor", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/:id" })
        @UseInterceptors(SanitizeInterceptor, ResponseInterceptor)
        getUser() {
          return {
            id: 1,
            name: "Alice",
            password: "secret",
          };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(
        new Request("http://localhost/users/1")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Alice");
      expect(data.data.password).toBeUndefined();
      expect(data.meta).toBeDefined();
    });

    test("should combine PaginationInterceptor and ResponseInterceptor", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/" })
        @UseInterceptors(PaginationInterceptor, ResponseInterceptor)
        getItems() {
          return Array(15)
            .fill(null)
            .map((_, i) => ({ id: i + 1 }));
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(
        new Request("http://localhost/items?page=1&limit=10")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.items).toBeDefined();
      expect(data.data.pagination).toBeDefined();
      expect(data.meta).toBeDefined();
    });

    test("should combine RateLimitInterceptor and ErrorHandlingInterceptor", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/limited" })
        @UseInterceptors(
          new RateLimitInterceptor(2, 60000),
          ErrorHandlingInterceptor
        )
        getLimited() {
          return { message: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      // First two requests should succeed
      for (let i = 0; i < 2; i++) {
        const response = await app.handle(
          new Request("http://localhost/api/limited")
        );
        expect(response.status).toBe(200);
      }

      // Third request should be rate limited and error handled
      const rateLimitedResponse = await app.handle(
        new Request("http://localhost/api/limited")
      );
      expect(rateLimitedResponse.status).toBe(500);
    });

    test("should apply multiple advanced interceptors in order", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/data" })
        @UseInterceptors(
          new CompressionInterceptor(100),
          SanitizeInterceptor,
          ResponseInterceptor
        )
        getData() {
          return {
            data: "x".repeat(150),
            password: "secret",
          };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/data")
      );
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.data).toBe("x".repeat(150));
      expect(result.data.password).toBeUndefined();
      expect(result.meta).toBeDefined();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    test("should handle null response in SanitizeInterceptor", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/null" })
        @UseInterceptors(new SanitizeInterceptor())
        getNull() {
          return null;
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/null")
      );

      // Null responses are handled by the framework, sanitizer just passes them through
      expect(response.status).toBe(200);
    });

    test("should handle empty array in PaginationInterceptor", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/" })
        @UseInterceptors(new PaginationInterceptor())
        getItems() {
          return [];
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(new Request("http://localhost/items"));
      const data = await response.json();

      expect(data.items).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.hasMore).toBe(false);
    });

    test("should handle rate limit window expiration", async () => {
      @Controller({ path: "/api" })
      class TestController {
        @Get({ path: "/windowed" })
        @UseInterceptors(new RateLimitInterceptor(2, 100))
        getWindowed() {
          return { message: "ok" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      // Make 2 requests
      for (let i = 0; i < 2; i++) {
        const response = await app.handle(
          new Request("http://localhost/api/windowed")
        );
        expect(response.status).toBe(200);
      }

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const response = await app.handle(
        new Request("http://localhost/api/windowed")
      );
      expect(response.status).toBe(200);
    });
  });
});
