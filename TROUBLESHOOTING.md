# Troubleshooting Guide

Common issues and solutions when working with WynkJS.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Decorator Issues](#decorator-issues)
- [Dependency Injection Issues](#dependency-injection-issues)
- [Validation Issues](#validation-issues)
- [CORS Issues](#cors-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Build and TypeScript Issues](#build-and-typescript-issues)
- [Testing Issues](#testing-issues)
- [Deployment Issues](#deployment-issues)

---

## Installation Issues

### Issue: Bun not found

**Error:**
```bash
command not found: bun
```

**Solution:**

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Restart terminal or source profile
source ~/.bashrc  # or ~/.zshrc
```

### Issue: Package installation fails

**Error:**
```bash
error: failed to download package
```

**Solution:**

```bash
# Clear Bun cache
rm -rf ~/.bun/install/cache

# Reinstall
bun install
```

### Issue: `reflect-metadata` errors

**Error:**
```typescript
TypeError: Reflect.getMetadata is not a function
```

**Solution:**

WynkJS >= 1.0.1 auto-loads `reflect-metadata`. If you're on an older version:

```bash
# Update to latest version
bun update wynkjs

# Or manually import in older versions
import "reflect-metadata";  // Add at top of index.ts
```

---

## Decorator Issues

### Issue: Decorators not working

**Error:**
```typescript
Decorators are not valid here
```

**Solution:**

Ensure `tsconfig.json` has experimental decorators enabled:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2021",
    "module": "ESNext"
  }
}
```

### Issue: @Injectable not recognized

**Error:**
```typescript
Cannot find name 'Injectable'
```

**Solution:**

```typescript
// ✅ Correct import
import { Injectable } from "wynkjs";

// ❌ Wrong import
import { Injectable } from "@wynkjs/core";  // Don't import from @wynkjs/core
```

### Issue: Controller routes not registered

**Problem:** Routes not responding, 404 errors

**Solution:**

```typescript
// 1. Ensure controller is registered
const app = WynkFactory.create({
  controllers: [UserController],  // ✅ Add here
});

// 2. Ensure @Controller decorator has correct path
@Controller("/users")  // ✅ With leading slash
export class UserController {}

// 3. Ensure methods have route decorators
@Get("/")  // ✅ Don't forget this
async findAll() {}
```

---

## Dependency Injection Issues

### Issue: Service not injected

**Error:**
```typescript
TypeError: Cannot read property 'findAll' of undefined
```

**Solution:**

```typescript
// Ensure service has @Injectable decorator
@Injectable()  // ✅ Required
export class UserService {
  findAll() {
    return [];
  }
}

// Ensure controller has @Injectable decorator
@Injectable()  // ✅ Required for DI
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}  // ✅ Will be injected
}
```

### Issue: Circular dependency

**Error:**
```typescript
Error: Circular dependency detected
```

**Solution:**

```typescript
// Use forward references
import type { UserService } from "./user.service";  // ✅ Use type import

@Injectable()
export class EmailService {
  constructor(@Inject("UserService") private userService: any) {}
}

// Or restructure to remove circular dependency
```

### Issue: Provider not initialized

**Error:**
```typescript
TypeError: db is undefined
```

**Solution:**

```typescript
// 1. Register provider
const app = WynkFactory.create({
  providers: [DatabaseService],  // ✅ Register here
  controllers: [UserController],
});

// 2. Use lifecycle hook
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleInit() {  // ✅ Initialize here
    this.db = await connectDatabase();
  }
}
```

---

## Validation Issues

### Issue: Validation not working

**Problem:** Invalid data accepted

**Solution:**

```typescript
// Ensure DTO is passed to decorator
@Post({ path: "/", body: CreateUserDTO })  // ✅ Pass DTO schema
async create(@Body() body: CreateUserType) {}

// Not just:
@Post("/")  // ❌ No validation
async create(@Body() body: any) {}
```

### Issue: Custom error messages not showing

**Solution:**

```typescript
// Use 'error' property in DTO
export const CreateUserDTO = DTO.Strict({
  email: CommonDTO.Email({
    error: "Please provide a valid email",  // ✅ Add custom message
  }),
});
```

### Issue: Validation error format not as expected

**Solution:**

```typescript
// Use validation formatter
const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter(),  // ✅ Choose formatter
});
```

---

## CORS Issues

### Issue: CORS error in browser

**Error:**
```
Access to fetch at 'http://localhost:3000/api' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Solution:**

```typescript
import { WynkFactory, CorsOptions } from "wynkjs";

const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",  // ✅ Add your frontend URL
  credentials: true,
};

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,  // ✅ Enable CORS
});
```

### Issue: Preflight request failing

**Error:**
```
Response to preflight request doesn't pass access control check
```

**Solution:**

```typescript
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  // ✅ Include OPTIONS
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
```

### Issue: Credentials not working

**Solution:**

```typescript
// 1. Backend: Enable credentials with specific origin
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",  // ✅ Specific origin (not *)
  credentials: true,
};

// 2. Frontend: Include credentials in fetch
fetch("http://localhost:3000/api", {
  credentials: "include",  // ✅ Include cookies
});
```

See [CORS Guide](./CORS.md) for detailed information.

---

## Database Issues

### Issue: Database connection fails

**Error:**
```typescript
Error: Connection refused
```

**Solution:**

```typescript
// 1. Check DATABASE_URL
console.log(process.env.DATABASE_URL);

// 2. Add connection retry logic
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.connect();
        break;
      } catch (error) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}
```

### Issue: "Too many connections"

**Solution:**

```typescript
// Use connection pooling
export class DatabaseService {
  async onModuleInit() {
    this.db = drizzle(process.env.DATABASE_URL, {
      connection: {
        max: 10,  // ✅ Limit connections
        min: 2,
        idleTimeoutMillis: 30000,
      },
    });
  }
}
```

### Issue: Migrations not running

**Solution:**

```bash
# Run migrations separately before starting app
bun run migrate

# Or in code during provider initialization
async onModuleInit() {
  await this.db.migrate.latest();
}
```

---

## Performance Issues

### Issue: Slow response times

**Diagnosis:**

```typescript
// Add timing interceptor
const timingInterceptor = async (ctx, next) => {
  const start = Date.now();
  const result = await next();
  console.log(`Duration: ${Date.now() - start}ms`);
  return result;
};
```

**Solutions:**

1. **Database query optimization:**

```typescript
// Use indexes
// Use connection pooling
// Avoid N+1 queries
```

2. **Add caching:**

```typescript
const cache = new Map();

@UseInterceptors(cacheInterceptor(60000))  // Cache for 1 minute
@Get("/expensive")
async getData() {}
```

3. **Enable clustering:**

```bash
# Use PM2 in production
pm2 start dist/index.js -i max
```

### Issue: Memory leaks

**Solution:**

```typescript
// 1. Close database connections properly
async onModuleDestroy() {
  await this.db.close();
}

// 2. Clear caches periodically
setInterval(() => {
  cache.clear();
}, 3600000);  // Every hour

// 3. Monitor memory
console.log(process.memoryUsage());
```

---

## Build and TypeScript Issues

### Issue: Build fails

**Error:**
```
error TS2307: Cannot find module 'wynkjs'
```

**Solution:**

```bash
# Install dependencies
bun install

# Clear cache and rebuild
rm -rf node_modules dist
bun install
bun run build
```

### Issue: Type errors

**Error:**
```typescript
Type 'string' is not assignable to type 'number'
```

**Solution:**

```typescript
// Use proper types
@Param("id") id: string  // ✅ Correct type

// Define interfaces
export interface CreateUserType {
  name: string;
  email: string;
}

@Body() body: CreateUserType  // ✅ Use interface
```

### Issue: "Cannot use decorators in JavaScript"

**Solution:**

WynkJS requires TypeScript:

```bash
# Ensure you're using .ts files, not .js
# Check tsconfig.json has experimentalDecorators: true
```

---

## Testing Issues

### Issue: Tests not running

**Solution:**

```bash
# Ensure test files end with .test.ts
user.test.ts  # ✅
user.spec.ts  # ✅
user.ts       # ❌

# Run tests
bun test

# Run specific test
bun test user.test.ts
```

### Issue: Test module DI not working

**Solution:**

```typescript
import { Test } from "wynkjs";

beforeEach(async () => {
  const module = await Test.createTestingModule({
    controllers: [UserController],
    providers: [UserService],  // ✅ Include all dependencies
  }).compile();

  controller = module.get<UserController>(UserController);
});
```

### Issue: Async tests timing out

**Solution:**

```typescript
// Ensure you await async operations
it("should create user", async () => {  // ✅ async
  const result = await controller.create(data);  // ✅ await
  expect(result).toBeDefined();
});
```

---

## Deployment Issues

### Issue: Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 bun run start
```

### Issue: Environment variables not loaded

**Solution:**

```typescript
// 1. Load from .env file
import { config } from "dotenv";
config();

// 2. Check variable exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// 3. Use default values
const PORT = process.env.PORT || 3000;
```

### Issue: Build artifacts not deployed

**Solution:**

```bash
# Ensure dist/ folder is included
# Check .gitignore doesn't ignore dist/

# Build before deploying
bun run build

# Deploy dist/ folder, not src/
bun dist/index.js
```

### Issue: Module not found in production

**Solution:**

```bash
# Install production dependencies
bun install --production

# Or ensure all dependencies in package.json
bun add wynkjs  # Not bun add -D
```

---

## General Debugging Tips

### Enable Debug Logging

```typescript
// Add logging interceptor
const loggingInterceptor = async (ctx, next) => {
  console.log(`→ ${ctx.request.method} ${ctx.path}`);
  console.log("Headers:", ctx.headers);
  console.log("Body:", ctx.body);

  const result = await next();

  console.log("Response:", result);
  return result;
};

@UseInterceptors(loggingInterceptor)
@Controller("/api")
export class ApiController {}
```

### Check Request/Response

```bash
# Use curl with verbose output
curl -v http://localhost:3000/api/users

# Check response headers
curl -I http://localhost:3000/api/users
```

### Verify Controller Registration

```typescript
const app = WynkFactory.create({
  controllers: [UserController],
});

// Log registered controllers
console.log("Registered controllers:", app.getControllers());
```

---

## Still Having Issues?

1. **Check existing issues**: [GitHub Issues](https://github.com/wynkjs/wynkjs-core/issues)
2. **Search discussions**: [GitHub Discussions](https://github.com/wynkjs/wynkjs-core/discussions)
3. **Create new issue**: Provide:
   - WynkJS version
   - Bun version
   - Operating system
   - Minimal reproduction code
   - Error messages

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [CORS Guide](./CORS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Migration Guide](./MIGRATION.md)
- [Middleware Guide](./MIDDLEWARE_GUIDE.md)

---

**Built with ❤️ by the WynkJS Team**
