# Security Best Practices

This guide covers security best practices when building applications with WynkJS.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Input Validation](#input-validation)
- [CORS Configuration](#cors-configuration)
- [Environment Variables](#environment-variables)
- [Database Security](#database-security)
- [File Uploads](#file-uploads)
- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [Error Handling](#error-handling)
- [Reporting Security Issues](#reporting-security-issues)

---

## Authentication & Authorization

### JWT Authentication

Implement JWT authentication using guards:

```typescript
import { Controller, Get, Use, UnauthorizedException } from "wynkjs";
import jwt from "jsonwebtoken";

// JWT Guard
const jwtAuthGuard = async (ctx: any, next: Function) => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    ctx.user = decoded; // Attach user to context
    return next();
  } catch (error) {
    throw new UnauthorizedException("Invalid or expired token");
  }
};

@Controller("/protected")
@Use(jwtAuthGuard)
export class ProtectedController {
  @Get("/profile")
  async getProfile(@Req() req: any) {
    return { user: req.user };
  }
}
```

**Best Practices:**

- ✅ Store JWT secret in environment variables
- ✅ Use strong, random secrets (at least 32 characters)
- ✅ Set reasonable token expiration times (15 minutes for access tokens)
- ✅ Implement refresh tokens for longer sessions
- ✅ Never store sensitive data in JWT payload (it's not encrypted)
- ✅ Use HTTPS in production to prevent token interception

### Role-Based Access Control (RBAC)

```typescript
import { ForbiddenException } from "wynkjs";

// Role guard factory
const requireRoles = (...allowedRoles: string[]) => {
  return async (ctx: any, next: Function) => {
    const userRole = ctx.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ForbiddenException(
        "You do not have permission to access this resource"
      );
    }

    return next();
  };
};

@Controller("/admin")
@Use(jwtAuthGuard, requireRoles("admin", "superadmin"))
export class AdminController {
  @Get("/users")
  async getAllUsers() {
    // Only admin and superadmin can access
    return { users: [] };
  }

  @Delete("/:id")
  @Use(requireRoles("superadmin")) // Additional restriction
  async deleteUser(@Param("id") id: string) {
    // Only superadmin can delete
    return { message: "User deleted" };
  }
}
```

### Password Security

```typescript
import { Injectable } from "wynkjs";

@Injectable()
export class PasswordService {
  // Use Bun's built-in password hashing
  async hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password, {
      algorithm: "argon2id", // Most secure
      memoryCost: 65536, // 64 MB
      timeCost: 3,
    });
  }

  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await Bun.password.verify(password, hashedPassword);
  }
}

// In your authentication controller
@Post("/register")
async register(
  @Body() body: { email: string; password: string },
  @Inject() passwordService: PasswordService
) {
  // Validate password strength
  if (body.password.length < 8) {
    throw new BadRequestException("Password must be at least 8 characters");
  }

  const hashedPassword = await passwordService.hashPassword(body.password);
  // Save user with hashed password
}
```

**Password Best Practices:**

- ✅ Use Bun's built-in `Bun.password.hash()` with argon2id
- ✅ Never store passwords in plain text
- ✅ Enforce minimum password length (8+ characters)
- ✅ Implement password complexity requirements
- ✅ Use account lockout after failed login attempts
- ❌ Never log passwords or include them in error messages

---

## Input Validation

### Comprehensive DTO Validation

Always validate input data using DTOs with custom error messages:

```typescript
import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  username: DTO.String({
    minLength: 3,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9_]+$", // Alphanumeric and underscore only
    error: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
  }),
  email: CommonDTO.Email({
    error: "Please provide a valid email address",
  }),
  password: DTO.String({
    minLength: 8,
    maxLength: 100,
    error: "Password must be between 8 and 100 characters",
  }),
  age: DTO.Optional(
    DTO.Number({
      minimum: 18,
      maximum: 120,
      error: "Age must be between 18 and 120",
    })
  ),
  website: DTO.Optional(
    DTO.String({
      format: "uri",
      error: "Please provide a valid URL",
    })
  ),
});

// Use strict validation to prevent additional properties
export const UpdateUserDTO = DTO.Strict({
  username: DTO.Optional(
    DTO.String({
      minLength: 3,
      maxLength: 20,
      pattern: "^[a-zA-Z0-9_]+$",
      error: "Username must be 3-20 characters",
    })
  ),
  email: DTO.Optional(CommonDTO.Email()),
});
```

**Validation Best Practices:**

- ✅ Use `DTO.Strict()` to strip unknown properties
- ✅ Validate all input: body, params, query, headers
- ✅ Use appropriate data types (String, Number, Boolean, etc.)
- ✅ Set reasonable min/max lengths to prevent DoS
- ✅ Use regex patterns to enforce format requirements
- ✅ Provide clear, user-friendly error messages
- ❌ Never trust client input without validation

### SQL Injection Prevention

When using database queries with user input:

```typescript
import { Injectable } from "wynkjs";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq, like } from "drizzle-orm";

@Injectable()
export class UserService {
  private db = drizzle(/* ... */);

  // ✅ SAFE: Using parameterized queries
  async findUserByEmail(email: string) {
    return await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email)); // Parameterized
  }

  // ✅ SAFE: Using ORM methods
  async searchUsers(searchTerm: string) {
    return await this.db
      .select()
      .from(userTable)
      .where(like(userTable.name, `%${searchTerm}%`)); // Safely escaped
  }

  // ❌ UNSAFE: Direct SQL string concatenation
  async unsafeSearch(term: string) {
    // NEVER DO THIS!
    const query = `SELECT * FROM users WHERE name LIKE '%${term}%'`;
    // This is vulnerable to SQL injection!
  }
}
```

**SQL Security Best Practices:**

- ✅ Always use parameterized queries or ORM methods
- ✅ Use ORMs like Drizzle, Prisma, or TypeORM
- ✅ Validate and sanitize all user input
- ✅ Apply principle of least privilege to database users
- ❌ Never concatenate user input directly into SQL queries

### XSS (Cross-Site Scripting) Prevention

```typescript
import { Injectable } from "wynkjs";

@Injectable()
export class ContentService {
  // Sanitize HTML content before storing/displaying
  sanitizeHtml(content: string): string {
    // Use a library like DOMPurify or create your own sanitizer
    return content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  @Post("/comments")
  async createComment(@Body() body: { content: string }) {
    // Sanitize user-generated content
    const sanitizedContent = this.sanitizeHtml(body.content);
    // Store sanitized content
    return { content: sanitizedContent };
  }
}
```

**XSS Prevention Best Practices:**

- ✅ Sanitize all user-generated content before rendering
- ✅ Use Content Security Policy (CSP) headers
- ✅ Encode output based on context (HTML, JavaScript, URL)
- ✅ Validate input format (reject unexpected HTML/scripts)
- ❌ Never render user input directly without sanitization

---

## CORS Configuration

Configure CORS securely for production:

```typescript
import { WynkFactory, CorsOptions } from "wynkjs";

// ❌ INSECURE: Don't use in production
const app = WynkFactory.create({
  controllers: [UserController],
  cors: true, // Allows all origins - only for development!
});

// ✅ SECURE: Whitelist specific origins
const corsOptions: CorsOptions = {
  origin: ["https://yourdomain.com", "https://app.yourdomain.com"],
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400, // 24 hours - cache preflight requests
};

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,
});

// ✅ SECURE: Dynamic origin validation
const corsOptions: CorsOptions = {
  origin: (origin: string) => {
    const allowedOrigins = [
      "https://yourdomain.com",
      "https://app.yourdomain.com",
    ];

    // For development, allow localhost
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000");
      allowedOrigins.push("http://localhost:5173"); // Vite default
    }

    return allowedOrigins.includes(origin);
  },
  credentials: true,
};
```

See [CORS.md](./CORS.md) for complete CORS documentation.

---

## Environment Variables

### Secure Configuration Management

```typescript
// .env.example (commit this to version control)
DATABASE_URL=postgresql://localhost:5432/mydb
JWT_SECRET=your-secret-key-here-at-least-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key
API_KEY=your-api-key
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000

// .env (NEVER commit this!)
DATABASE_URL=postgresql://prod-db:5432/mydb
JWT_SECRET=super-secret-production-key-32-chars-min
JWT_REFRESH_SECRET=another-super-secret-key-for-refresh
API_KEY=prod-api-key-value
REDIS_URL=redis://prod-redis:6379
NODE_ENV=production
PORT=3000
```

**Environment Variable Best Practices:**

- ✅ Use `.env` files for local development
- ✅ Provide `.env.example` with dummy values
- ✅ Add `.env` to `.gitignore` (never commit secrets!)
- ✅ Validate required environment variables on startup
- ✅ Use strong, random values for secrets (32+ characters)
- ✅ Use different secrets for development and production
- ✅ Use secret management services in production (AWS Secrets Manager, HashiCorp Vault)

```typescript
// src/config/env.ts - Environment validation
export function validateEnv() {
  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "API_KEY",
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  console.log("✅ Environment variables validated");
}

// In your main file
import { validateEnv } from "./config/env";

validateEnv(); // Validate before starting the app

const app = WynkFactory.create({
  /* ... */
});
```

---

## Database Security

### Secure Database Connections

```typescript
import { Injectable, singleton } from "wynkjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

@Injectable()
@singleton()
export class DatabaseService {
  public db: any;
  private sql: any;

  async onModuleInit() {
    // ✅ SECURE: Connection with SSL
    this.sql = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === "production" ? "require" : false,
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });

    this.db = drizzle(this.sql);

    console.log("✅ Database connected securely");
  }

  async onModuleDestroy() {
    await this.sql.end();
    console.log("Database connection closed");
  }
}
```

**Database Security Best Practices:**

- ✅ Use SSL/TLS for database connections in production
- ✅ Use connection pooling with reasonable limits
- ✅ Apply principle of least privilege for database users
- ✅ Use environment variables for connection strings
- ✅ Enable query logging only in development
- ✅ Regularly update database drivers and dependencies
- ❌ Never use root/admin accounts for application connections

### Prevent SQL Injection

Always use ORM query builders or parameterized queries:

```typescript
// ✅ SAFE: Drizzle ORM
await db.select().from(users).where(eq(users.email, email));

// ✅ SAFE: Parameterized query
await db.execute(sql`SELECT * FROM users WHERE email = ${email}`);

// ❌ UNSAFE: String concatenation
await db.execute(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## File Uploads

### Secure File Upload Handling

```typescript
import { Controller, Post, BadRequestException } from "wynkjs";

@Controller("/upload")
export class UploadController {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  private readonly ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

  @Post("/image")
  async uploadImage(@Req() req: any) {
    const file = req.body.file; // Assumes multipart/form-data

    // Validate file exists
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException("File size exceeds 5MB limit");
    }

    // Validate file type (MIME type)
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new BadRequestException(
        "Invalid file type. Only JPEG, PNG, and WebP are allowed"
      );
    }

    // Validate file extension
    const extension = file.name.substring(file.name.lastIndexOf("."));
    if (!this.ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
      throw new BadRequestException("Invalid file extension");
    }

    // Generate safe filename (prevent path traversal)
    const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
    const uploadPath = `./uploads/${safeFilename}`;

    // Save file
    await Bun.write(uploadPath, file);

    return { filename: safeFilename, url: `/uploads/${safeFilename}` };
  }
}
```

**File Upload Best Practices:**

- ✅ Validate file size (prevent DoS)
- ✅ Validate file type (MIME type)
- ✅ Validate file extension
- ✅ Generate random filenames (prevent overwrites)
- ✅ Store files outside the web root
- ✅ Use virus scanning for uploaded files
- ✅ Implement rate limiting on upload endpoints
- ❌ Never trust the client-provided filename
- ❌ Never execute uploaded files

---

## Rate Limiting

Protect your API from abuse with rate limiting:

```typescript
import { Controller, Get, BadRequestException } from "wynkjs";

// Simple in-memory rate limiter (use Redis for production)
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isRateLimited(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if rate limit exceeded
    if (timestamps.length >= maxRequests) {
      return true;
    }

    // Add current timestamp
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return false;
  }
}

const rateLimiter = new RateLimiter();

// Rate limiting middleware
const rateLimitMiddleware = (maxRequests = 100, windowMs = 60000) => {
  return async (ctx: any, next: Function) => {
    const identifier = ctx.ip || ctx.headers["x-forwarded-for"] || "unknown";

    if (rateLimiter.isRateLimited(identifier, maxRequests, windowMs)) {
      ctx.set.status = 429;
      return {
        error: "Too many requests",
        message: "Please try again later",
      };
    }

    return next();
  };
};

@Controller("/api")
@Use(rateLimitMiddleware(100, 60000)) // 100 requests per minute
export class ApiController {
  @Get("/data")
  async getData() {
    return { data: [] };
  }

  @Post("/login")
  @Use(rateLimitMiddleware(5, 60000)) // Stricter: 5 attempts per minute
  async login() {
    // Login logic
  }
}
```

**Rate Limiting Best Practices:**

- ✅ Use Redis for distributed rate limiting
- ✅ Implement per-IP rate limiting
- ✅ Use stricter limits for sensitive endpoints (login, register)
- ✅ Return 429 status code with retry information
- ✅ Consider using middleware like `@elysiajs/rate-limit`

---

## Security Headers

Add security headers to protect against common attacks:

```typescript
import { WynkFactory } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
});

// Security headers middleware
const securityHeaders = async (ctx: any, next: Function) => {
  // Prevent clickjacking
  ctx.set.headers["X-Frame-Options"] = "DENY";

  // Prevent MIME type sniffing
  ctx.set.headers["X-Content-Type-Options"] = "nosniff";

  // Enable XSS protection (legacy browsers)
  ctx.set.headers["X-XSS-Protection"] = "1; mode=block";

  // Referrer policy
  ctx.set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

  // Content Security Policy
  ctx.set.headers["Content-Security-Policy"] =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";

  // HTTPS only (in production)
  if (process.env.NODE_ENV === "production") {
    ctx.set.headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }

  // Permissions policy
  ctx.set.headers["Permissions-Policy"] =
    "geolocation=(), microphone=(), camera=()";

  return next();
};

// Apply globally
app.use(securityHeaders);
```

**Security Headers:**

- `X-Frame-Options`: Prevents clickjacking attacks
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-XSS-Protection`: Basic XSS protection for older browsers
- `Strict-Transport-Security`: Forces HTTPS connections
- `Content-Security-Policy`: Controls resource loading
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Controls browser features

---

## Error Handling

### Secure Error Responses

Never expose sensitive information in error messages:

```typescript
import {
  WynkFactory,
  GlobalExceptionFilter,
  ExecutionContext,
  WynkExceptionFilter,
  Catch,
} from "wynkjs";

// Custom secure error filter
@Catch()
export class SecureErrorFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const request = context.getRequest();

    // Log full error details (for developers)
    console.error("Error occurred:", {
      message: exception.message,
      stack: exception.stack,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

    // ✅ Production: Return sanitized error
    if (process.env.NODE_ENV === "production") {
      return {
        statusCode: exception.statusCode || 500,
        message:
          exception.statusCode < 500
            ? exception.message
            : "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      };
    }

    // Development: Return detailed error
    return {
      statusCode: exception.statusCode || 500,
      message: exception.message,
      stack: exception.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

const app = WynkFactory.create({
  controllers: [UserController],
});

app.useGlobalFilters(new SecureErrorFilter());
```

**Error Handling Best Practices:**

- ✅ Log detailed errors server-side
- ✅ Return generic errors to clients in production
- ✅ Never expose stack traces in production
- ✅ Never include sensitive data in error messages
- ✅ Use appropriate HTTP status codes
- ❌ Never expose database errors directly
- ❌ Never include file paths or internal details

---

## Security Checklist

Before deploying to production, verify:

### Authentication & Authorization

- [ ] JWT secrets are strong (32+ characters) and stored securely
- [ ] Token expiration times are reasonable
- [ ] Passwords are hashed with argon2id or bcrypt
- [ ] Role-based access control is implemented
- [ ] Failed login attempts are rate-limited

### Input Validation

- [ ] All endpoints use DTO validation
- [ ] `DTO.Strict()` is used to strip unknown properties
- [ ] SQL injection is prevented (using ORM/parameterized queries)
- [ ] XSS is prevented (sanitizing user content)
- [ ] File uploads are validated (type, size, extension)

### Configuration

- [ ] CORS is configured with specific allowed origins (not `*`)
- [ ] Environment variables are validated on startup
- [ ] `.env` files are in `.gitignore`
- [ ] Secrets are stored in secret management services

### Network & Transport

- [ ] HTTPS is enforced in production
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] Database connections use SSL/TLS

### Monitoring & Logging

- [ ] Errors are logged server-side
- [ ] Sensitive data is not logged
- [ ] Failed authentication attempts are logged
- [ ] Production errors don't expose internal details

---

## Reporting Security Issues

If you discover a security vulnerability in WynkJS, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: **alamjamal88@gmail.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Bun Security](https://bun.sh/docs/runtime/security)
- [WynkJS Documentation](./README.md)

---

**Stay secure! 🔒**
