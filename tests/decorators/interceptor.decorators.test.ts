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
  UseInterceptors,
  Injectable,
} from "../../core";
import type { InterceptorContext } from "../../core/interfaces/interceptor.interface";

// ============================================================================
// MOCK INTERCEPTORS
// ============================================================================

@Injectable()
class LoggingInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;

    return {
      ...result,
      meta: {
        ...(result.meta || {}),
        duration,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

@Injectable()
class TransformInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const result = await next();

    // Wrap response in standard format
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  }
}

@Injectable()
class CacheInterceptor {
  private cache = new Map<string, any>();

  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const cacheKey = `${context.method}:${context.path}`;

    if (this.cache.has(cacheKey)) {
      return {
        ...this.cache.get(cacheKey),
        cached: true,
      };
    }

    const result = await next();
    this.cache.set(cacheKey, result);

    return {
      ...result,
      cached: false,
    };
  }
}

@Injectable()
class ErrorHandlingInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    try {
      return await next();
    } catch (error) {
      return {
        error: true,
        message: error.message,
        path: context.path,
      };
    }
  }
}

@Injectable()
class TimeoutInterceptor {
  private timeout: number;

  constructor(timeout: number = 5000) {
    this.timeout = timeout;
  }

  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), this.timeout)
    );

    return Promise.race([next(), timeoutPromise]);
  }
}

@Injectable()
class AuthHeaderInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const result = await next();

    // Add auth info to response
    const token = context.headers?.["authorization"];
    if (token) {
      return {
        ...result,
        authenticated: true,
      };
    }

    return result;
  }
}

@Injectable()
class UppercaseInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const result = await next();

    // Transform string responses to uppercase
    if (typeof result === "string") {
      return result.toUpperCase();
    }

    if (result && typeof result === "object" && result.message) {
      return {
        ...result,
        message: result.message.toUpperCase(),
      };
    }

    return result;
  }
}

@Injectable()
class ValidationInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    // Validate before calling handler
    if (context.method === "POST" && !context.body) {
      throw new Error("Body is required for POST requests");
    }

    const result = await next();

    // Validate result
    if (result === null || result === undefined) {
      throw new Error("Handler returned null or undefined");
    }

    return result;
  }
}

@Injectable()
class RateLimitInterceptor {
  private requests = new Map<string, number[]>();

  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    const ip = context.request.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    const userRequests = this.requests.get(ip) || [];

    const recentRequests = userRequests.filter((time) => now - time < 60000);

    if (recentRequests.length >= 10) {
      throw new Error("Rate limit exceeded");
    }

    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    return await next();
  }
}

@Injectable()
class ModifyRequestInterceptor {
  async intercept(context: InterceptorContext, next: Function): Promise<any> {
    // Modify context before handler
    if (context.body && typeof context.body === "object") {
      context.body = {
        ...context.body,
        modified: true,
        timestamp: Date.now(),
      };
    }

    return await next();
  }
}

// ============================================================================
// INTERCEPTOR DECORATOR TESTS
// ============================================================================

describe("Interceptor Decorators", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  // ==========================================================================
  // SINGLE INTERCEPTOR TESTS
  // ==========================================================================

  describe("Single Interceptor", () => {
    test("should apply logging interceptor to method", async () => {
      @Controller({ path: "/api" })
      class ApiController {
        @Get({ path: "/data" })
        @UseInterceptors(LoggingInterceptor)
        getData() {
          return { message: "Hello" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      const response = await app.handle(
        new Request("http://localhost/api/data")
      );
      const data = await response.json();

      expect(data.message).toBe("Hello");
      expect(data.meta).toBeDefined();
      expect(data.meta.duration).toBeGreaterThanOrEqual(0);
      expect(data.meta.timestamp).toBeDefined();
    });

    test("should apply transform interceptor to method", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/" })
        @UseInterceptors(TransformInterceptor)
        getUsers() {
          return ["Alice", "Bob"];
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(new Request("http://localhost/users"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(["Alice", "Bob"]);
      expect(data.timestamp).toBeDefined();
    });

    test("should apply cache interceptor to method", async () => {
      @Controller({ path: "/products" })
      class ProductController {
        @Get({ path: "/" })
        @UseInterceptors(CacheInterceptor)
        getProducts() {
          return { products: ["Product 1", "Product 2"] };
        }
      }

      const app = WynkFactory.create({
        controllers: [ProductController],
      });

      // First request - not cached
      const firstResponse = await app.handle(
        new Request("http://localhost/products")
      );
      const firstData = await firstResponse.json();
      expect(firstData.cached).toBe(false);

      // Second request - cached
      const secondResponse = await app.handle(
        new Request("http://localhost/products")
      );
      const secondData = await secondResponse.json();
      expect(secondData.cached).toBe(true);
    });

    test("should apply error handling interceptor", async () => {
      @Controller({ path: "/error" })
      class ErrorController {
        @Get({ path: "/throw" })
        @UseInterceptors(ErrorHandlingInterceptor)
        throwError() {
          throw new Error("Something went wrong");
        }
      }

      const app = WynkFactory.create({
        controllers: [ErrorController],
      });

      const response = await app.handle(
        new Request("http://localhost/error/throw")
      );
      const data = await response.json();

      expect(data.error).toBe(true);
      expect(data.message).toBe("Something went wrong");
      expect(data.path).toBe("/throw");
    });

    test("should apply uppercase transform interceptor", async () => {
      @Controller({ path: "/text" })
      class TextController {
        @Get({ path: "/" })
        @UseInterceptors(UppercaseInterceptor)
        getText() {
          return { message: "hello world" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TextController],
      });

      const response = await app.handle(new Request("http://localhost/text"));
      const data = await response.json();

      expect(data.message).toBe("HELLO WORLD");
    });
  });

  // ==========================================================================
  // MULTIPLE INTERCEPTORS
  // ==========================================================================

  describe("Multiple Interceptors", () => {
    test("should apply multiple interceptors in order", async () => {
      const executionOrder: string[] = [];

      @Injectable()
      class Interceptor1 {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          executionOrder.push("before1");
          const result = await next();
          executionOrder.push("after1");
          return result;
        }
      }

      @Injectable()
      class Interceptor2 {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          executionOrder.push("before2");
          const result = await next();
          executionOrder.push("after2");
          return result;
        }
      }

      @Injectable()
      class Interceptor3 {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          executionOrder.push("before3");
          const result = await next();
          executionOrder.push("after3");
          return result;
        }
      }

      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        @UseInterceptors(Interceptor1, Interceptor2, Interceptor3)
        getData() {
          executionOrder.push("handler");
          return { success: true };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      await app.handle(new Request("http://localhost/test"));

      // With forward iteration: last interceptor in array executes first (outermost)
      // First interceptor in array is closest to handler (innermost)
      expect(executionOrder).toEqual([
        "before3",
        "before2",
        "before1",
        "handler",
        "after1",
        "after2",
        "after3",
      ]);
    });

    test("should chain transformations from multiple interceptors", async () => {
      @Injectable()
      class WrapperInterceptor {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          const result = await next();
          return { wrapped: result };
        }
      }

      @Injectable()
      class MetadataInterceptor {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          const result = await next();
          return { ...result, version: "1.0" };
        }
      }

      @Controller({ path: "/chain" })
      class ChainController {
        @Get({ path: "/" })
        @UseInterceptors(WrapperInterceptor, MetadataInterceptor)
        getData() {
          return { message: "original" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ChainController],
      });

      const response = await app.handle(new Request("http://localhost/chain"));
      const data = await response.json();

      // WrapperInterceptor wraps, then MetadataInterceptor adds version
      expect(data).toEqual({
        wrapped: { message: "original" },
        version: "1.0",
      });
    });

    test("should combine logging and transform interceptors", async () => {
      @Controller({ path: "/combined" })
      class CombinedController {
        @Get({ path: "/data" })
        @UseInterceptors(LoggingInterceptor, TransformInterceptor)
        getData() {
          return { value: 42 };
        }
      }

      const app = WynkFactory.create({
        controllers: [CombinedController],
      });

      const response = await app.handle(
        new Request("http://localhost/combined/data")
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.value).toBe(42);
      expect(data.data.meta).toBeDefined();
      expect(data.data.meta.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // CONTROLLER-LEVEL INTERCEPTORS
  // ==========================================================================

  describe("Controller-Level Interceptors", () => {
    test("should apply interceptor to all controller methods", async () => {
      @Controller({ path: "/api" })
      @UseInterceptors(TransformInterceptor)
      class ApiController {
        @Get({ path: "/users" })
        getUsers() {
          return ["Alice", "Bob"];
        }

        @Get({ path: "/posts" })
        getPosts() {
          return ["Post 1", "Post 2"];
        }

        @Post({ path: "/comment" })
        createComment() {
          return { id: 1 };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      // All routes should have transformed response
      const usersResponse = await app.handle(
        new Request("http://localhost/api/users")
      );
      const usersData = await usersResponse.json();
      expect(usersData.success).toBe(true);
      expect(usersData.data).toEqual(["Alice", "Bob"]);

      const postsResponse = await app.handle(
        new Request("http://localhost/api/posts")
      );
      const postsData = await postsResponse.json();
      expect(postsData.success).toBe(true);
      expect(postsData.data).toEqual(["Post 1", "Post 2"]);
    });

    test("should combine controller and method interceptors", async () => {
      @Controller({ path: "/data" })
      @UseInterceptors(TransformInterceptor)
      class DataController {
        @Get({ path: "/public" })
        getPublic() {
          return { message: "public data" };
        }

        @Get({ path: "/private" })
        @UseInterceptors(LoggingInterceptor)
        getPrivate() {
          return { message: "private data" };
        }
      }

      const app = WynkFactory.create({
        controllers: [DataController],
      });

      // Public: only transform
      const publicResponse = await app.handle(
        new Request("http://localhost/data/public")
      );
      const publicData = await publicResponse.json();
      expect(publicData.success).toBe(true);
      expect(publicData.data.message).toBe("public data");
      expect(publicData.data.meta).toBeUndefined();

      // Private: transform + logging
      const privateResponse = await app.handle(
        new Request("http://localhost/data/private")
      );
      const privateData = await privateResponse.json();
      expect(privateData.success).toBe(true);
      expect(privateData.data.message).toBe("private data");
      expect(privateData.data.meta).toBeDefined();
    });
  });

  // ==========================================================================
  // GLOBAL INTERCEPTORS
  // ==========================================================================

  describe("Global Interceptors", () => {
    test("should apply global interceptor to all routes", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Get({ path: "/" })
        getUsers() {
          return ["Alice"];
        }
      }

      @Controller({ path: "/posts" })
      class PostController {
        @Get({ path: "/" })
        getPosts() {
          return ["Post 1"];
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController, PostController],
      });

      app.useGlobalInterceptors(TransformInterceptor);

      await app.build();

      // Both routes should have transformed response
      const usersResponse = await app.handle(
        new Request("http://localhost/users")
      );
      const usersData = await usersResponse.json();
      expect(usersData.success).toBe(true);

      const postsResponse = await app.handle(
        new Request("http://localhost/posts")
      );
      const postsData = await postsResponse.json();
      expect(postsData.success).toBe(true);
    });

    test("should combine global and method interceptors", async () => {
      @Controller({ path: "/api" })
      class ApiController {
        @Get({ path: "/standard" })
        getStandard() {
          return { data: "standard" };
        }

        @Get({ path: "/enhanced" })
        @UseInterceptors(LoggingInterceptor)
        getEnhanced() {
          return { data: "enhanced" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      app.useGlobalInterceptors(TransformInterceptor);

      await app.build();

      // Standard: only global transform
      const standardResponse = await app.handle(
        new Request("http://localhost/api/standard")
      );
      const standardData = await standardResponse.json();
      expect(standardData.success).toBe(true);
      expect(standardData.data.data).toBe("standard");
      expect(standardData.data.meta).toBeUndefined();

      // Enhanced: global transform + method logging
      const enhancedResponse = await app.handle(
        new Request("http://localhost/api/enhanced")
      );
      const enhancedData = await enhancedResponse.json();
      expect(enhancedData.success).toBe(true);
      expect(enhancedData.data.data).toBe("enhanced");
      expect(enhancedData.data.meta).toBeDefined();
    });
  });

  // ==========================================================================
  // CONTEXT ACCESS
  // ==========================================================================

  describe("Context Access", () => {
    test("should access request headers in interceptor", async () => {
      @Controller({ path: "/auth" })
      class AuthController {
        @Get({ path: "/profile" })
        @UseInterceptors(AuthHeaderInterceptor)
        getProfile() {
          return { profile: "user data" };
        }
      }

      const app = WynkFactory.create({
        controllers: [AuthController],
      });

      // With auth header
      const authResponse = await app.handle(
        new Request("http://localhost/auth/profile", {
          headers: { authorization: "Bearer token" },
        })
      );
      const authData = await authResponse.json();
      expect(authData.authenticated).toBe(true);

      // Without auth header
      const noAuthResponse = await app.handle(
        new Request("http://localhost/auth/profile")
      );
      const noAuthData = await noAuthResponse.json();
      expect(noAuthData.authenticated).toBeUndefined();
    });

    test("should access and modify request body", async () => {
      @Controller({ path: "/data" })
      class DataController {
        @Post({ path: "/" })
        @UseInterceptors(ModifyRequestInterceptor)
        createData() {
          // In real scenario, would access modified body
          return { created: true };
        }
      }

      const app = WynkFactory.create({
        controllers: [DataController],
      });

      const response = await app.handle(
        new Request("http://localhost/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "test" }),
        })
      );

      expect(response.status).toBe(200);
    });

    test("should access route path in interceptor", async () => {
      @Injectable()
      class PathInterceptor {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          const result = await next();
          return {
            ...result,
            requestedPath: context.path,
            requestedMethod: context.method,
          };
        }
      }

      @Controller({ path: "/routes" })
      class RouteController {
        @Get({ path: "/test" })
        @UseInterceptors(PathInterceptor)
        getTest() {
          return { message: "test" };
        }
      }

      const app = WynkFactory.create({
        controllers: [RouteController],
      });

      const response = await app.handle(
        new Request("http://localhost/routes/test")
      );
      const data = await response.json();

      expect(data.requestedPath).toBe("/test");
      expect(data.requestedMethod).toBe("GET");
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    test("should catch errors in interceptor", async () => {
      @Controller({ path: "/safe" })
      class SafeController {
        @Get({ path: "/error" })
        @UseInterceptors(ErrorHandlingInterceptor)
        throwError() {
          throw new Error("Controller error");
        }
      }

      const app = WynkFactory.create({
        controllers: [SafeController],
      });

      const response = await app.handle(
        new Request("http://localhost/safe/error")
      );
      const data = await response.json();

      expect(data.error).toBe(true);
      expect(data.message).toBe("Controller error");
    });

    test("should handle validation errors in interceptor", async () => {
      @Controller({ path: "/validate" })
      class ValidateController {
        @Post({ path: "/data" })
        @UseInterceptors(ValidationInterceptor)
        createData() {
          return { created: true };
        }
      }

      const app = WynkFactory.create({
        controllers: [ValidateController],
      });

      // Without body - should throw
      const response = await app.handle(
        new Request("http://localhost/validate/data", {
          method: "POST",
        })
      );

      expect(response.status).toBe(500);
    });

    test("should propagate errors through interceptor chain", async () => {
      @Injectable()
      class ErrorPropagationInterceptor {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          try {
            return await next();
          } catch (error) {
            throw new Error(`Interceptor caught: ${error.message}`);
          }
        }
      }

      @Controller({ path: "/propagate" })
      class PropagateController {
        @Get({ path: "/" })
        @UseInterceptors(ErrorPropagationInterceptor)
        throwError() {
          throw new Error("Original error");
        }
      }

      const app = WynkFactory.create({
        controllers: [PropagateController],
      });

      const response = await app.handle(
        new Request("http://localhost/propagate")
      );

      expect(response.status).toBe(500);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    test("should handle empty interceptor array", async () => {
      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        @UseInterceptors()
        getData() {
          return { data: "test" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(new Request("http://localhost/test"));
      const data = await response.json();

      expect(data).toEqual({ data: "test" });
    });

    test("should handle interceptor returning different type", async () => {
      @Injectable()
      class TypeChangeInterceptor {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          await next();
          // Return completely different type
          return "Interceptor override";
        }
      }

      @Controller({ path: "/override" })
      class OverrideController {
        @Get({ path: "/" })
        @UseInterceptors(TypeChangeInterceptor)
        getData() {
          return { original: "data" };
        }
      }

      const app = WynkFactory.create({
        controllers: [OverrideController],
      });

      const response = await app.handle(
        new Request("http://localhost/override")
      );
      const data = await response.text();

      expect(data).toBe("Interceptor override");
    });

    test("should handle interceptor not calling next()", async () => {
      let handlerCalled = false;

      @Injectable()
      class ShortCircuitInterceptor {
        async intercept(
          context: InterceptorContext,
          next: Function
        ): Promise<any> {
          // Don't call next() - short circuit
          return { shortCircuited: true };
        }
      }

      @Controller({ path: "/short" })
      class ShortController {
        @Get({ path: "/" })
        @UseInterceptors(ShortCircuitInterceptor)
        getData() {
          handlerCalled = true;
          return { handler: "response" };
        }
      }

      const app = WynkFactory.create({
        controllers: [ShortController],
      });

      const response = await app.handle(new Request("http://localhost/short"));
      const data = await response.json();

      expect(data).toEqual({ shortCircuited: true });
      expect(handlerCalled).toBe(false);
    });
  });
});
