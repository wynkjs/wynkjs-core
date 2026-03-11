# Middleware Guide

Complete guide to WynkJS middleware: Guards, Interceptors, Pipes, and Exception Filters.

## Table of Contents

- [Overview](#overview)
- [Request Pipeline](#request-pipeline)
- [Guards](#guards)
- [Interceptors](#interceptors)
- [Pipes](#pipes)
- [Exception Filters](#exception-filters)
- [Middleware](#middleware)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

WynkJS provides a powerful middleware system inspired by NestJS, allowing you to intercept and transform requests/responses at different stages.

### Middleware Types

| Type         | Purpose                          | Use Case                    |
| ------------ | -------------------------------- | --------------------------- |
| **Guards**   | Authorization/Authentication     | Protect routes              |
| **Pipes**    | Validation & Transformation      | Transform input data        |
| **Interceptors** | Request/Response modification  | Logging, caching            |
| **Filters**  | Exception handling               | Error formatting            |
| **Middleware** | General request processing     | CORS, compression, logging  |

---

## Request Pipeline

Request flow through middleware:

```
Incoming Request
      ↓
  Middleware
      ↓
    Guards  ─────→ Reject (401/403)
      ↓
 Interceptors (Before)
      ↓
    Pipes  ─────→ Reject (400)
      ↓
   Handler
      ↓
 Interceptors (After)
      ↓
    Response
      ↓
(If error occurs)
      ↓
  Exception Filters
      ↓
  Error Response
```

---

## Guards

Guards determine whether a request should be handled or rejected.

### Basic Guard

```typescript
import { Use } from "wynkjs";

// Simple authentication guard
const authGuard = async (ctx: any, next: Function) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    ctx.set.status = 401;
    return { error: "Unauthorized - No token provided" };
  }

  try {
    // Verify token (use your JWT library)
    const user = await verifyToken(token);
    ctx.user = user; // Attach user to context
    return next();
  } catch (error) {
    ctx.set.status = 401;
    return { error: "Unauthorized - Invalid token" };
  }
};

// Apply to controller
@Controller("/protected")
@Use(authGuard)
export class ProtectedController {
  @Get("/data")
  getData() {
    return { message: "This is protected!" };
  }
}
```

### Role-Based Guard

```typescript
// Role guard factory
const rolesGuard = (allowedRoles: string[]) => {
  return async (ctx: any, next: Function) => {
    const user = ctx.user; // From auth guard

    if (!user) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    if (!allowedRoles.includes(user.role)) {
      ctx.set.status = 403;
      return { error: "Forbidden - Insufficient permissions" };
    }

    return next();
  };
};

// Usage
@Controller("/admin")
@Use(authGuard, rolesGuard(["admin", "superadmin"]))
export class AdminController {
  @Get("/users")
  async getAllUsers() {
    return { users: [] };
  }
}
```

### API Key Guard

```typescript
const apiKeyGuard = async (ctx: any, next: Function) => {
  const apiKey = ctx.headers["x-api-key"];

  if (!apiKey) {
    ctx.set.status = 401;
    return { error: "API key required" };
  }

  const validKeys = process.env.VALID_API_KEYS?.split(",") || [];

  if (!validKeys.includes(apiKey)) {
    ctx.set.status = 403;
    return { error: "Invalid API key" };
  }

  return next();
};

// Usage
@Controller("/api")
@Use(apiKeyGuard)
export class ApiController {}
```

### Multiple Guards

```typescript
// Combine multiple guards
@Controller("/secure")
@Use(
  authGuard, // First: Check authentication
  rolesGuard(["admin"]), // Then: Check authorization
  rateLimitGuard // Finally: Check rate limit
)
export class SecureController {}
```

---

## Interceptors

Interceptors can transform requests/responses and add cross-cutting concerns.

### Logging Interceptor

```typescript
import { UseInterceptors } from "wynkjs";

const loggingInterceptor = async (ctx: any, next: Function) => {
  const start = Date.now();
  const { method, path } = ctx.request;

  console.log(`→ ${method} ${path}`);

  const result = await next(); // Execute handler

  const duration = Date.now() - start;
  console.log(`← ${method} ${path} - ${duration}ms`);

  return result;
};

// Apply to controller
@Controller("/users")
@UseInterceptors(loggingInterceptor)
export class UserController {}
```

### Transform Response Interceptor

```typescript
const transformInterceptor = async (ctx: any, next: Function) => {
  const result = await next();

  // Transform all responses to standard format
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: result,
  };
};

// Usage
@Controller("/api")
@UseInterceptors(transformInterceptor)
export class ApiController {
  @Get("/users")
  async getUsers() {
    return ["Alice", "Bob"]; // Will be wrapped in standard format
  }
}

// Response:
// {
//   "success": true,
//   "timestamp": "2025-01-15T10:30:00.000Z",
//   "data": ["Alice", "Bob"]
// }
```

### Caching Interceptor

```typescript
const cache = new Map();

const cacheInterceptor = (ttl: number = 60000) => {
  return async (ctx: any, next: Function) => {
    const cacheKey = `${ctx.request.method}:${ctx.path}`;

    // Check cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < ttl) {
        console.log("Cache hit:", cacheKey);
        return cached.data;
      }
    }

    // Execute handler
    const result = await next();

    // Store in cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  };
};

// Usage
@Controller("/data")
export class DataController {
  @Get("/expensive")
  @UseInterceptors(cacheInterceptor(30000)) // Cache for 30 seconds
  async getExpensiveData() {
    // Expensive computation
    return { data: "computed result" };
  }
}
```

### Timeout Interceptor

```typescript
const timeoutInterceptor = (ms: number) => {
  return async (ctx: any, next: Function) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), ms);
    });

    try {
      return await Promise.race([next(), timeoutPromise]);
    } catch (error) {
      if (error.message === "Request timeout") {
        ctx.set.status = 408;
        return { error: "Request timeout" };
      }
      throw error;
    }
  };
};

// Usage
@Controller("/api")
export class ApiController {
  @Get("/slow")
  @UseInterceptors(timeoutInterceptor(5000)) // 5 second timeout
  async slowOperation() {
    // Long-running operation
  }
}
```

---

## Pipes

Pipes transform and validate input data before it reaches the handler.

### Validation Pipe

```typescript
import { UsePipes } from "wynkjs";

const validationPipe = (schema: any) => {
  return async (ctx: any, next: Function) => {
    const body = ctx.body;

    try {
      // Validate using your preferred library
      const validated = await schema.parse(body);
      ctx.body = validated; // Replace with validated data
      return next();
    } catch (error) {
      ctx.set.status = 400;
      return { error: "Validation failed", details: error.errors };
    }
  };
};

// Usage (though WynkJS has built-in validation)
@Controller("/users")
export class UserController {
  @Post({ path: "/", body: CreateUserDTO }) // ✅ Prefer built-in validation
  async create(@Body() body: any) {
    // Body is already validated by decorator
  }
}
```

### Transform Pipe

```typescript
const parseIntPipe = async (ctx: any, next: Function) => {
  const { id } = ctx.params;

  // Transform string to number
  ctx.params.id = parseInt(id, 10);

  if (isNaN(ctx.params.id)) {
    ctx.set.status = 400;
    return { error: "Invalid ID format" };
  }

  return next();
};

// Usage
@Controller("/users")
export class UserController {
  @Get({ path: "/:id" })
  @UsePipes(parseIntPipe)
  async findOne(@Param("id") id: number) {
    // id is now a number, not string
    return { user: { id } };
  }
}
```

### Sanitization Pipe

```typescript
const sanitizePipe = async (ctx: any, next: Function) => {
  if (ctx.body) {
    // Remove sensitive fields
    const { password, ssn, ...sanitized } = ctx.body;

    // Trim strings
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "string") {
        sanitized[key] = sanitized[key].trim();
      }
    });

    ctx.body = sanitized;
  }

  return next();
};
```

---

## Exception Filters

Handle and format errors uniformly.

### Custom Exception Filter

```typescript
import { WynkExceptionFilter, ExecutionContext, Catch } from "wynkjs";

@Catch() // Catches all exceptions
export class HttpExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const request = context.getRequest();
    const statusCode = exception.statusCode || 500;

    return {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    };
  }
}

// Register globally
const app = WynkFactory.create({
  controllers: [UserController],
});

app.useGlobalFilters(new HttpExceptionFilter());
```

### Database Exception Filter

```typescript
@Catch()
export class DatabaseExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    // Handle database-specific errors
    if (exception.code === "23505") {
      // Unique constraint violation
      return {
        statusCode: 409,
        message: "Resource already exists",
        error: "Conflict",
      };
    }

    if (exception.code === "23503") {
      // Foreign key violation
      return {
        statusCode: 400,
        message: "Invalid reference",
        error: "Bad Request",
      };
    }

    // Re-throw other exceptions
    throw exception;
  }
}
```

### Route-Specific Filter

```typescript
import { UseFilters } from "wynkjs";

@UseFilters(DatabaseExceptionFilter)
@Controller("/users")
export class UserController {
  @Post({ path: "/" })
  async create(@Body() body: any) {
    // Database exceptions handled by filter
  }
}
```

---

## Middleware

General-purpose middleware for cross-cutting concerns.

### CORS Middleware

```typescript
const corsMiddleware = async (ctx: any, next: Function) => {
  ctx.set.headers["Access-Control-Allow-Origin"] = "*";
  ctx.set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE";
  ctx.set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

  if (ctx.request.method === "OPTIONS") {
    ctx.set.status = 204;
    return;
  }

  return next();
};

// Note: WynkJS has built-in CORS support - use that instead!
```

### Compression Middleware

```typescript
const compressionMiddleware = async (ctx: any, next: Function) => {
  const result = await next();
  const acceptEncoding = ctx.headers["accept-encoding"] || "";

  if (acceptEncoding.includes("gzip")) {
    // Compress response
    // Implementation depends on your compression library
  }

  return result;
};
```

### Request ID Middleware

```typescript
import { v4 as uuidv4 } from "uuid";

const requestIdMiddleware = async (ctx: any, next: Function) => {
  const requestId = ctx.headers["x-request-id"] || uuidv4();

  ctx.requestId = requestId;
  ctx.set.headers["x-request-id"] = requestId;

  return next();
};

// Usage
@Controller("/api")
@Use(requestIdMiddleware)
export class ApiController {}
```

---

## Best Practices

### 1. Order Matters

Apply middleware in logical order:

```typescript
@Controller("/api")
@Use(
  requestIdMiddleware, // 1. Generate request ID
  loggingMiddleware, // 2. Log request
  authGuard, // 3. Authenticate
  rolesGuard(["user"]), // 4. Authorize
  rateLimitGuard // 5. Rate limit
)
export class ApiController {}
```

### 2. Keep Middleware Focused

```typescript
// ✅ Good - Single responsibility
const authGuard = async (ctx, next) => {
  // Only handles authentication
};

const rolesGuard = (roles) => async (ctx, next) => {
  // Only handles authorization
};

// ❌ Bad - Does too much
const authAndRolesGuard = async (ctx, next) => {
  // Handles both authentication and authorization
};
```

### 3. Use Factories for Configurable Middleware

```typescript
// ✅ Good - Configurable
const rateLimitGuard = (maxRequests: number, windowMs: number) => {
  return async (ctx, next) => {
    // Implementation
  };
};

// Usage
@Use(rateLimitGuard(100, 60000)) // 100 requests per minute
```

### 4. Error Handling

```typescript
const safeMiddleware = async (ctx: any, next: Function) => {
  try {
    return await next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Re-throw to let exception filters handle it
    throw error;
  }
};
```

### 5. Async Operations

```typescript
// ✅ Good - Properly awaited
const asyncMiddleware = async (ctx, next) => {
  await someAsyncOperation();
  return await next();
};

// ❌ Bad - Not awaited
const badMiddleware = async (ctx, next) => {
  someAsyncOperation(); // Missing await
  return next(); // Missing await
};
```

---

## Examples

### Complete Authentication System

```typescript
// guards/auth.guard.ts
export const authGuard = async (ctx: any, next: Function) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    ctx.set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const user = await verifyJWT(token);
    ctx.user = user;
    return next();
  } catch (error) {
    ctx.set.status = 401;
    return { error: "Invalid token" };
  }
};

// guards/roles.guard.ts
export const rolesGuard = (roles: string[]) => {
  return async (ctx: any, next: Function) => {
    if (!ctx.user) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    if (!roles.includes(ctx.user.role)) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    return next();
  };
};

// controllers/admin.controller.ts
@Injectable()
@Controller("/admin")
@Use(authGuard, rolesGuard(["admin"]))
export class AdminController {
  @Get("/users")
  async getAllUsers() {
    return { users: [] };
  }

  @Delete({ path: "/users/:id" })
  @Use(rolesGuard(["superadmin"])) // Even stricter
  async deleteUser(@Param("id") id: string) {
    return { message: "User deleted" };
  }
}
```

### Request Logging System

```typescript
// interceptors/logging.interceptor.ts
export const loggingInterceptor = async (ctx: any, next: Function) => {
  const start = Date.now();
  const { method, path } = ctx.request;
  const requestId = ctx.requestId;

  console.log(
    JSON.stringify({
      type: "request",
      requestId,
      method,
      path,
      timestamp: new Date().toISOString(),
    })
  );

  try {
    const result = await next();

    console.log(
      JSON.stringify({
        type: "response",
        requestId,
        method,
        path,
        duration: Date.now() - start,
        status: ctx.set.status || 200,
      })
    );

    return result;
  } catch (error) {
    console.error(
      JSON.stringify({
        type: "error",
        requestId,
        method,
        path,
        duration: Date.now() - start,
        error: error.message,
      })
    );

    throw error;
  }
};
```

### Rate Limiting

```typescript
// guards/rate-limit.guard.ts
const requests = new Map();

export const rateLimitGuard = (maxRequests = 100, windowMs = 60000) => {
  return async (ctx: any, next: Function) => {
    const ip = ctx.headers["x-forwarded-for"] || ctx.ip;
    const now = Date.now();
    const key = `${ip}:${Math.floor(now / windowMs)}`;

    const current = requests.get(key) || 0;

    if (current >= maxRequests) {
      ctx.set.status = 429;
      return { error: "Too many requests" };
    }

    requests.set(key, current + 1);

    // Cleanup old entries
    if (requests.size > 10000) {
      const cutoff = Math.floor((now - windowMs) / windowMs);
      for (const [k] of requests) {
        if (parseInt(k.split(":")[1]) < cutoff) {
          requests.delete(k);
        }
      }
    }

    return next();
  };
};
```

---

## Summary

- **Guards**: Authentication & Authorization
- **Interceptors**: Transform requests/responses, logging, caching
- **Pipes**: Validation & data transformation
- **Filters**: Exception handling
- **Middleware**: General request processing

**Pipeline**: Middleware → Guards → Interceptors → Pipes → Handler → Interceptors → Filters

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [Exception Handling](./docs-wynkjs/CUSTOM_EXCEPTION_HANDLING.md)
- [Testing Guide](./docs-wynkjs/TESTING_GUIDE.md)

---

**Built with ❤️ by the WynkJS Team**
