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
  Injectable,
  Body,
  Param,
} from "../../core";
import { HttpException } from "../../core/decorators/exception.decorators";

// ============================================================================
// MOCK EXCEPTION FILTERS
// ============================================================================

@Injectable()
class HttpExceptionFilter {
  catch(exception: HttpException, context: any) {
    return {
      statusCode: exception.status,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: context.path,
    };
  }
}

@Injectable()
class ValidationExceptionFilter {
  catch(exception: any, context: any) {
    if (exception.message.includes("validation")) {
      return {
        statusCode: 400,
        message: "Validation failed",
        errors: [exception.message],
        timestamp: new Date().toISOString(),
      };
    }
    throw exception;
  }
}

@Injectable()
class NotFoundExceptionFilter {
  catch(exception: any, context: any) {
    if (exception.status === 404 || exception.message.includes("not found")) {
      return {
        statusCode: 404,
        message: "Resource not found",
        path: context.path,
        timestamp: new Date().toISOString(),
      };
    }
    throw exception;
  }
}

@Injectable()
class DatabaseExceptionFilter {
  catch(exception: any, context: any) {
    const message = exception.message.toLowerCase();
    if (message.includes("database") || message.includes("db")) {
      return {
        statusCode: 503,
        message: "Database connection error",
        error: "ServiceUnavailable",
        retryAfter: 5,
      };
    }
    throw exception;
  }
}

@Injectable()
class LoggingExceptionFilter {
  private logs: any[] = [];

  catch(exception: any, context: any) {
    this.logs.push({
      exception: exception.message,
      path: context.path,
      method: context.method,
      timestamp: Date.now(),
    });

    // Re-throw to allow other filters to handle
    throw exception;
  }

  getLogs() {
    return this.logs;
  }
}

@Injectable()
class TransformExceptionFilter {
  catch(exception: any, context: any) {
    // Transform all exceptions to standard format
    return {
      success: false,
      error: {
        code: exception.status || 500,
        message: exception.message || "Internal server error",
        type: exception.constructor.name,
      },
      meta: {
        timestamp: Date.now(),
        path: context.path,
      },
    };
  }
}

@Injectable()
class RateLimitExceptionFilter {
  catch(exception: any, context: any) {
    if (exception.message.includes("rate limit")) {
      return {
        statusCode: 429,
        message: "Too many requests",
        retryAfter: 60,
        error: "RateLimitExceeded",
      };
    }
    throw exception;
  }
}

@Injectable()
class AuthExceptionFilter {
  catch(exception: any, context: any) {
    if (
      exception.status === 401 ||
      exception.message.includes("unauthorized")
    ) {
      return {
        statusCode: 401,
        message: "Authentication required",
        error: "Unauthorized",
        authUrl: "/login",
      };
    }
    throw exception;
  }
}

@Injectable()
class FallbackExceptionFilter {
  catch(exception: any, context: any) {
    // Catch all exceptions
    return {
      statusCode: 500,
      message: "An unexpected error occurred",
      error: "InternalServerError",
      debug:
        process.env.NODE_ENV === "development" ? exception.message : undefined,
    };
  }
}

// Custom exception classes
class NotFoundException extends HttpException {
  constructor(message: string = "Not found") {
    super(message, 404);
    this.name = "NotFoundException";
  }
}

class BadRequestException extends HttpException {
  constructor(message: string = "Bad request") {
    super(message, 400);
    this.name = "BadRequestException";
  }
}

class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedException";
  }
}

class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenException";
  }
}

class ConflictException extends HttpException {
  constructor(message: string = "Conflict") {
    super(message, 409);
    this.name = "ConflictException";
  }
}

// ============================================================================
// EXCEPTION FILTER TESTS
// ============================================================================

describe("Exception Filters", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  // ==========================================================================
  // HTTP EXCEPTIONS
  // ==========================================================================

  describe("HTTP Exceptions", () => {
    test("should handle 404 NotFoundException", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/:id" })
        getUser(@Param("id") id: string) {
          throw new NotFoundException("User not found");
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(
        new Request("http://localhost/users/123")
      );

      expect(response.status).toBe(404);
    });

    test("should handle 400 BadRequestException", async () => {
      @Controller({ path: "/data" })
      class DataController {
        @Post({ path: "/" })
        createData(@Body() data: any) {
          throw new BadRequestException("Invalid data format");
        }
      }

      const app = WynkFactory.create({
        controllers: [DataController],
      });

      const response = await app.handle(
        new Request("http://localhost/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(400);
    });

    test("should handle 401 UnauthorizedException", async () => {
      @Controller({ path: "/protected" })
      class ProtectedController {
        @Get({ path: "/resource" })
        getResource() {
          throw new UnauthorizedException("Please log in");
        }
      }

      const app = WynkFactory.create({
        controllers: [ProtectedController],
      });

      const response = await app.handle(
        new Request("http://localhost/protected/resource")
      );

      expect(response.status).toBe(401);
    });

    test("should handle 403 ForbiddenException", async () => {
      @Controller({ path: "/admin" })
      class AdminController {
        @Get({ path: "/dashboard" })
        getDashboard() {
          throw new ForbiddenException("Admin access required");
        }
      }

      const app = WynkFactory.create({
        controllers: [AdminController],
      });

      const response = await app.handle(
        new Request("http://localhost/admin/dashboard")
      );

      expect(response.status).toBe(403);
    });

    test("should handle 409 ConflictException", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Post({ path: "/" })
        createUser(@Body() data: any) {
          throw new ConflictException("Email already exists");
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );

      expect(response.status).toBe(409);
    });

    test("should handle custom HttpException with status code", async () => {
      @Controller({ path: "/custom" })
      class CustomController {
        @Get({ path: "/" })
        getCustom() {
          throw new HttpException("Custom error", 418); // I'm a teapot
        }
      }

      const app = WynkFactory.create({
        controllers: [CustomController],
      });

      const response = await app.handle(new Request("http://localhost/custom"));

      expect(response.status).toBe(418);
    });
  });

  // ==========================================================================
  // CUSTOM EXCEPTION FILTERS
  // ==========================================================================

  describe("Custom Exception Filters", () => {
    test("should format exception with HttpExceptionFilter", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/:id" })
        getUser(@Param("id") id: string) {
          throw new NotFoundException("User not found");
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      app.useGlobalFilters(HttpExceptionFilter);
      await app.build();

      const response = await app.handle(
        new Request("http://localhost/users/123")
      );
      const data = await response.json();

      expect(data.statusCode).toBe(404);
      expect(data.message).toBe("User not found");
      expect(data.error).toBe("NotFoundException");
      expect(data.timestamp).toBeDefined();
      expect(data.path).toBeDefined();
    });

    test("should handle validation errors with ValidationExceptionFilter", async () => {
      @Controller({ path: "/data" })
      class DataController {
        @Post({ path: "/" })
        createData(@Body() data: any) {
          throw new Error("Email validation failed");
        }
      }

      const app = WynkFactory.create({
        controllers: [DataController],
      });

      app.useGlobalFilters(ValidationExceptionFilter);
      await app.build();

      const response = await app.handle(
        new Request("http://localhost/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      const data = await response.json();

      expect(data.statusCode).toBe(400);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toContain("Email validation failed");
    });

    test("should transform exceptions with TransformExceptionFilter", async () => {
      @Controller({ path: "/error" })
      class ErrorController {
        @Get({ path: "/" })
        throwError() {
          throw new NotFoundException("Resource not found");
        }
      }

      const app = WynkFactory.create({
        controllers: [ErrorController],
      });

      app.useGlobalFilters(TransformExceptionFilter);
      await app.build();

      const response = await app.handle(new Request("http://localhost/error"));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error.code).toBe(404);
      expect(data.error.message).toBe("Resource not found");
      expect(data.error.type).toBe("NotFoundException");
      expect(data.meta.timestamp).toBeDefined();
    });

    test("should handle database errors with DatabaseExceptionFilter", async () => {
      @Controller({ path: "/db" })
      class DbController {
        @Get({ path: "/data" })
        getData() {
          throw new Error("Database connection timeout");
        }
      }

      const app = WynkFactory.create({
        controllers: [DbController],
      });

      app.useGlobalFilters(DatabaseExceptionFilter);
      await app.build();

      const response = await app.handle(
        new Request("http://localhost/db/data")
      );
      const data = await response.json();

      expect(data.statusCode).toBe(503);
      expect(data.message).toBe("Database connection error");
      expect(data.error).toBe("ServiceUnavailable");
      expect(data.retryAfter).toBe(5);
    });
  });

  // ==========================================================================
  // MULTIPLE FILTERS
  // ==========================================================================

  describe("Multiple Filters", () => {
    test("should apply filters in order", async () => {
      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/not-found" })
        notFound() {
          throw new NotFoundException("Item not found");
        }

        @Get({ path: "/validation" })
        validation() {
          throw new Error("validation error");
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      // NotFoundExceptionFilter first, then ValidationExceptionFilter
      app.useGlobalFilters(NotFoundExceptionFilter, ValidationExceptionFilter);
      await app.build();

      // NotFound should be caught by first filter
      const notFoundResponse = await app.handle(
        new Request("http://localhost/test/not-found")
      );
      const notFoundData = await notFoundResponse.json();
      expect(notFoundData.statusCode).toBe(404);
      expect(notFoundData.message).toBe("Resource not found");

      // Validation should be caught by second filter
      const validationResponse = await app.handle(
        new Request("http://localhost/test/validation")
      );
      const validationData = await validationResponse.json();
      expect(validationData.statusCode).toBe(400);
      expect(validationData.message).toBe("Validation failed");
    });

    test("should cascade through filters", async () => {
      @Injectable()
      class FirstFilter {
        catch(exception: any, context: any) {
          if (exception.message === "first") {
            return { handled: "first" };
          }
          throw exception; // Pass to next filter
        }
      }

      @Injectable()
      class SecondFilter {
        catch(exception: any, context: any) {
          if (exception.message === "second") {
            return { handled: "second" };
          }
          throw exception;
        }
      }

      @Injectable()
      class ThirdFilter {
        catch(exception: any, context: any) {
          return { handled: "third", message: exception.message };
        }
      }

      @Controller({ path: "/cascade" })
      class CascadeController {
        @Get({ path: "/first" })
        first() {
          throw new Error("first");
        }

        @Get({ path: "/second" })
        second() {
          throw new Error("second");
        }

        @Get({ path: "/third" })
        third() {
          throw new Error("other");
        }
      }

      const app = WynkFactory.create({
        controllers: [CascadeController],
      });

      app.useGlobalFilters(FirstFilter, SecondFilter, ThirdFilter);
      await app.build();

      // First filter catches "first"
      const firstResponse = await app.handle(
        new Request("http://localhost/cascade/first")
      );
      const firstData = await firstResponse.json();
      expect(firstData.handled).toBe("first");

      // Second filter catches "second"
      const secondResponse = await app.handle(
        new Request("http://localhost/cascade/second")
      );
      const secondData = await secondResponse.json();
      expect(secondData.handled).toBe("second");

      // Third filter catches everything else
      const thirdResponse = await app.handle(
        new Request("http://localhost/cascade/third")
      );
      const thirdData = await thirdResponse.json();
      expect(thirdData.handled).toBe("third");
      expect(thirdData.message).toBe("other");
    });

    test("should combine specialized and fallback filters", async () => {
      @Controller({ path: "/errors" })
      class ErrorController {
        @Get({ path: "/auth" })
        authError() {
          throw new UnauthorizedException("Not authenticated");
        }

        @Get({ path: "/rate-limit" })
        rateLimitError() {
          throw new Error("Too many requests - rate limit exceeded");
        }

        @Get({ path: "/unknown" })
        unknownError() {
          throw new Error("Something went wrong");
        }
      }

      const app = WynkFactory.create({
        controllers: [ErrorController],
      });

      app.useGlobalFilters(
        AuthExceptionFilter,
        RateLimitExceptionFilter,
        FallbackExceptionFilter
      );
      await app.build();

      // Auth error
      const authResponse = await app.handle(
        new Request("http://localhost/errors/auth")
      );
      const authData = await authResponse.json();
      expect(authData.statusCode).toBe(401);
      expect(authData.authUrl).toBe("/login");

      // Rate limit error
      const rateLimitResponse = await app.handle(
        new Request("http://localhost/errors/rate-limit")
      );
      const rateLimitData = await rateLimitResponse.json();
      expect(rateLimitData.statusCode).toBe(429);
      expect(rateLimitData.retryAfter).toBe(60);

      // Unknown error (caught by fallback)
      const unknownResponse = await app.handle(
        new Request("http://localhost/errors/unknown")
      );
      const unknownData = await unknownResponse.json();
      expect(unknownData.statusCode).toBe(500);
      expect(unknownData.error).toBe("InternalServerError");
    });
  });

  // ==========================================================================
  // FILTER CONTEXT
  // ==========================================================================

  describe("Filter Context", () => {
    test("should access request context in filter", async () => {
      @Injectable()
      class ContextFilter {
        catch(exception: any, context: any) {
          return {
            error: exception.message,
            context: {
              method: context.method,
              path: context.path,
              params: context.params,
              query: context.query,
            },
          };
        }
      }

      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/:id" })
        getItem(@Param("id") id: string) {
          throw new Error("Item error");
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      app.useGlobalFilters(ContextFilter);
      await app.build();

      const response = await app.handle(
        new Request("http://localhost/items/123?sort=asc")
      );
      const data = await response.json();

      expect(data.context.method).toBe("GET");
      expect(data.context.path).toBe("/:id");
      expect(data.context.params.id).toBe("123");
    });

    test("should add metadata in filter", async () => {
      @Injectable()
      class MetadataFilter {
        catch(exception: any, context: any) {
          return {
            error: exception.message,
            metadata: {
              timestamp: new Date().toISOString(),
              requestId: Math.random().toString(36).substring(7),
              userAgent: context.request.headers.get("user-agent"),
              ip: context.request.headers.get("x-forwarded-for") || "unknown",
            },
          };
        }
      }

      @Controller({ path: "/error" })
      class ErrorController {
        @Get({ path: "/" })
        throwError() {
          throw new Error("Test error");
        }
      }

      const app = WynkFactory.create({
        controllers: [ErrorController],
      });

      app.useGlobalFilters(MetadataFilter);
      await app.build();

      const response = await app.handle(
        new Request("http://localhost/error", {
          headers: { "User-Agent": "TestAgent/1.0" },
        })
      );
      const data = await response.json();

      expect(data.metadata.timestamp).toBeDefined();
      expect(data.metadata.requestId).toBeDefined();
      expect(data.metadata.userAgent).toBe("TestAgent/1.0");
    });
  });

  // ==========================================================================
  // ERROR TYPES
  // ==========================================================================

  describe("Different Error Types", () => {
    test("should handle native Error", async () => {
      @Controller({ path: "/native" })
      class NativeController {
        @Get({ path: "/" })
        throwNative() {
          throw new Error("Native error");
        }
      }

      const app = WynkFactory.create({
        controllers: [NativeController],
      });

      app.useGlobalFilters(TransformExceptionFilter);
      await app.build();

      const response = await app.handle(new Request("http://localhost/native"));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Native error");
    });

    test("should handle TypeError", async () => {
      @Controller({ path: "/type" })
      class TypeController {
        @Get({ path: "/" })
        throwType() {
          const obj: any = null;
          obj.property; // TypeError
        }
      }

      const app = WynkFactory.create({
        controllers: [TypeController],
      });

      app.useGlobalFilters(FallbackExceptionFilter);
      await app.build();

      const response = await app.handle(new Request("http://localhost/type"));
      const data = await response.json();

      expect(data.statusCode).toBe(500);
      expect(data.error).toBe("InternalServerError");
    });

    test("should handle ReferenceError", async () => {
      @Controller({ path: "/reference" })
      class ReferenceController {
        @Get({ path: "/" })
        throwReference() {
          // @ts-ignore
          undefinedVariable; // ReferenceError
        }
      }

      const app = WynkFactory.create({
        controllers: [ReferenceController],
      });

      app.useGlobalFilters(FallbackExceptionFilter);
      await app.build();

      const response = await app.handle(
        new Request("http://localhost/reference")
      );

      expect(response.status).toBe(500);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    test("should handle filter throwing error", async () => {
      @Injectable()
      class FailingFilter {
        catch(exception: any, context: any) {
          throw new Error("Filter failed");
        }
      }

      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        throwError() {
          throw new Error("Original error");
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      app.useGlobalFilters(FailingFilter);
      await app.build();

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(500);
    });

    test("should handle filter returning non-object", async () => {
      @Injectable()
      class StringFilter {
        catch(exception: any, context: any) {
          return "Error occurred";
        }
      }

      @Controller({ path: "/string" })
      class StringController {
        @Get({ path: "/" })
        throwError() {
          throw new Error("Test");
        }
      }

      const app = WynkFactory.create({
        controllers: [StringController],
      });

      app.useGlobalFilters(StringFilter);
      await app.build();

      const response = await app.handle(new Request("http://localhost/string"));
      const text = await response.text();

      expect(text).toBe("Error occurred");
    });

    test("should handle empty filter array", async () => {
      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        throwError() {
          throw new NotFoundException("Not found");
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(404);
    });

    test("should handle async filter", async () => {
      @Injectable()
      class AsyncFilter {
        async catch(exception: any, context: any) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            async: true,
            error: exception.message,
          };
        }
      }

      @Controller({ path: "/async" })
      class AsyncController {
        @Get({ path: "/" })
        throwError() {
          throw new Error("Async error");
        }
      }

      const app = WynkFactory.create({
        controllers: [AsyncController],
      });

      app.useGlobalFilters(AsyncFilter);
      await app.build();

      const response = await app.handle(new Request("http://localhost/async"));
      const data = await response.json();

      expect(data.async).toBe(true);
      expect(data.error).toBe("Async error");
    });
  });
});
