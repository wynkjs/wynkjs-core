# Frequently Asked Questions (FAQ)

Common questions and answers about WynkJS.

## Table of Contents

- [General Questions](#general-questions)
- [Getting Started](#getting-started)
- [Framework Comparison](#framework-comparison)
- [Architecture & Design](#architecture--design)
- [Performance](#performance)
- [Decorators & Syntax](#decorators--syntax)
- [Validation & DTOs](#validation--dtos)
- [Database & ORM](#database--orm)
- [Deployment & Production](#deployment--production)
- [Troubleshooting](#troubleshooting)

---

## General Questions

### What is WynkJS?

WynkJS is a modern, TypeScript-first web framework for Bun that combines the blazing-fast performance of Elysia with an elegant decorator-based architecture. It provides familiar concepts like controllers, dependency injection, guards, pipes, interceptors, and exception filters - similar to NestJS but optimized for Bun.

### Why WynkJS over NestJS or Express?

**Performance:**

- 10x faster than NestJS and Express
- Built on Elysia for Bun's native performance
- Significantly lower latency and higher throughput

**Developer Experience:**

- Simpler architecture than NestJS
- TypeScript-first with mandatory type safety
- Single import - everything from `wynkjs`
- No need to manually import `reflect-metadata`

**Modern:**

- Built exclusively for Bun (not Node.js compatibility layer)
- ESM-only, no CommonJS baggage
- Latest TypeScript decorators

### Can I use WynkJS in production?

Yes! WynkJS is production-ready. It's built on stable foundations (Elysia, Bun, TypeScript) and includes all features needed for production applications:

- Comprehensive error handling
- Built-in validation
- Dependency injection
- CORS support
- Security features
- Testing utilities

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guides.

### Is WynkJS compatible with Node.js?

No. WynkJS is built exclusively for Bun and takes full advantage of Bun's APIs and performance characteristics. It requires Bun 1.0 or higher.

If you need Node.js compatibility, consider:

- **NestJS** - Full-featured framework for Node.js
- **Express** - Minimalist framework for Node.js
- **Fastify** - Fast and low overhead framework for Node.js

---

## Getting Started

### How do I create a new WynkJS project?

The fastest way is using `create-wynkjs`:

```bash
bunx create-wynkjs
# or
npx create-wynkjs
```

This creates a complete project with:

- TypeScript configuration
- Example controllers and services
- Optional ESLint, Prettier, Husky
- Hot reload setup

See [Quick Start](./README.md#-quick-start) in the README.

### Do I need to install Bun separately?

Yes, WynkJS requires Bun 1.0 or higher. Install Bun first:

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

### Can I use WynkJS with JavaScript?

While WynkJS is technically compatible with JavaScript, **TypeScript is mandatory by design**. The framework relies heavily on TypeScript decorators and type system for:

- Dependency injection
- Validation
- Type safety
- IntelliSense support

Using JavaScript would lose most of WynkJS's benefits.

### What's the minimum TypeScript version?

WynkJS requires **TypeScript 5.0 or higher** for proper decorator support. Your `tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

---

## Framework Comparison

### WynkJS vs NestJS

| Feature                 | WynkJS                                | NestJS                          |
| ----------------------- | ------------------------------------- | ------------------------------- |
| **Runtime**             | Bun only                              | Node.js                         |
| **Performance**         | 10x faster                            | Standard Node.js performance    |
| **Architecture**        | Simplified decorator-based            | Complex modular architecture    |
| **Learning Curve**      | Easy - simpler than NestJS            | Steep - many concepts           |
| **Imports**             | Single import from `wynkjs`           | Multiple package imports        |
| **DI Setup**            | Zero setup (auto-configured)          | Manual module configuration     |
| **Module System**       | Optional (controller-based)           | Required (module-based)         |
| **TypeScript**          | Mandatory                             | Optional                        |
| **Ecosystem**           | Growing                               | Mature with many packages       |
| **Best For**            | New Bun projects, high-performance    | Enterprise Node.js applications |
| **reflect-metadata**    | Auto-imported (no manual setup)       | Manual import required          |
| **Package Management**  | Bun native                            | npm/yarn/pnpm                   |
| **Production Ready**    | Yes                                   | Yes                             |
| **Community**           | Growing                               | Large and established           |
| **Documentation**       | Comprehensive                         | Extensive                       |
| **Migration from Nest** | Easy - similar concepts               | N/A                             |

### WynkJS vs Express

| Feature                | WynkJS                        | Express                     |
| ---------------------- | ----------------------------- | --------------------------- |
| **Performance**        | 10x faster                    | Standard                    |
| **Architecture**       | Decorator-based, structured   | Minimal, callback-based     |
| **TypeScript Support** | First-class, mandatory        | Third-party types needed    |
| **Validation**         | Built-in with DTOs            | Manual or middleware        |
| **DI**                 | Built-in                      | None (DIY)                  |
| **Learning Curve**     | Moderate                      | Easy                        |
| **Boilerplate**        | Low (decorators)              | High (manual setup)         |
| **Best For**           | Modern TypeScript APIs        | Simple Node.js apps         |
| **Middleware**         | Guards, interceptors, filters | Custom middleware functions |

### When should I use WynkJS?

**Choose WynkJS if you:**

✅ Want to build with Bun
✅ Need high performance and low latency
✅ Prefer TypeScript-first development
✅ Like decorator-based architecture
✅ Want NestJS-like structure without complexity
✅ Are building modern REST APIs
✅ Value developer experience

**Choose NestJS if you:**

- Need Node.js compatibility
- Require mature ecosystem and packages
- Building large enterprise applications
- Need extensive third-party integrations

**Choose Express if you:**

- Need maximum simplicity
- Building small Node.js projects
- Prefer minimal abstraction
- Have existing Express knowledge

---

## Architecture & Design

### Do I need to create modules like in NestJS?

No! WynkJS uses a **controller-based architecture** instead of NestJS's module system. Simply:

1. Create controllers
2. Register them in `WynkFactory.create()`

```typescript
const app = WynkFactory.create({
  controllers: [UserController, ProductController, AuthController],
});
```

You can organize files however you prefer - modules folder is optional but recommended for organization.

### How does dependency injection work?

WynkJS uses `tsyringe` for dependency injection. It's **zero-setup** - just use `@Injectable()`:

```typescript
@Injectable()
export class EmailService {
  sendEmail() {
    /* ... */
  }
}

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private emailService: EmailService) {}
  // EmailService is automatically injected!
}
```

No need to import `reflect-metadata` or configure DI containers manually.

### What's the difference between providers and services?

- **Services**: Regular injectable classes used anywhere in your app
- **Providers**: Special services with lifecycle hooks that initialize when the app starts

```typescript
// Service - regular injectable
@Injectable()
export class UserService {
  findAll() {
    /* ... */
  }
}

// Provider - initializes on app startup
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleInit() {
    // Called when app starts
    this.db = await connectToDatabase();
  }
}

// Register providers
const app = WynkFactory.create({
  providers: [DatabaseService], // Initialized first
  controllers: [UserController], // Can use DatabaseService
});
```

See [PROVIDERS.md](./docs-wynkjs/PROVIDERS.md) for details.

### Can I use middleware like in Express?

Yes! WynkJS supports middleware through `@Use()` decorator:

```typescript
const logger = async (ctx: any, next: Function) => {
  console.log(`${ctx.request.method} ${ctx.path}`);
  return next();
};

@Controller("/api")
@Use(logger) // Applied to all routes in controller
export class ApiController {
  @Get("/data")
  @Use(cacheMiddleware) // Applied only to this route
  getData() {
    /* ... */
  }
}
```

See [MIDDLEWARE_GUIDE.md](./MIDDLEWARE_GUIDE.md) for comprehensive guide.

---

## Performance

### How much faster is WynkJS compared to NestJS/Express?

Based on benchmarks, WynkJS is approximately **10x faster**:

- **Requests/sec**: 10x higher throughput
- **Latency**: Significantly lower response times
- **Memory**: More efficient memory usage

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed benchmarks.

### Why is WynkJS so fast?

1. **Bun Runtime**: Bun is 4x faster than Node.js
2. **Elysia Foundation**: Built on high-performance Elysia framework
3. **Native Speed**: No Node.js compatibility layer
4. **Optimized Code**: Minimal abstraction overhead
5. **Efficient DI**: Lightweight dependency injection

### Can I make WynkJS even faster?

Yes! Performance optimization tips:

1. **Enable production mode**: Set `NODE_ENV=production`
2. **Use connection pooling**: For database connections
3. **Implement caching**: Redis, in-memory caching
4. **Optimize queries**: Use indexes, limit data fetched
5. **Enable compression**: For response bodies
6. **Use CDN**: For static assets

See [PERFORMANCE.md](./PERFORMANCE.md) for optimization guide.

---

## Decorators & Syntax

### What decorators are available?

**HTTP Methods:**

- `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`, `@Options()`, `@Head()`

**Parameters:**

- `@Body()`, `@Param()`, `@Query()`, `@Headers()`, `@Req()`, `@Res()`

**Route Options:**

- `@HttpCode()`, `@Header()`, `@Redirect()`

**Middleware:**

- `@Use()`, `@UseGuards()`, `@UseInterceptors()`, `@UsePipes()`, `@UseFilters()`

**DI:**

- `@Injectable()`, `@Inject()`, `@Singleton()`, `@AutoInjectable()`

See [API Reference](./API_REFERENCE.md) for complete list.

### Can I use both string and object formats for route decorators?

Yes! All HTTP decorators support both:

```typescript
// String format
@Get("/users")
async findAll() { }

// Object format with validation
@Get({ path: "/users", query: UserQueryDTO })
async findAll(@Query() query: QueryType) { }

@Post({ path: "/users", body: CreateUserDTO })
async create(@Body() body: CreateUserType) { }
```

### How do I handle multiple route parameters?

Use the params option and `@Param()`:

```typescript
// DTO for params
export const MultiParamDto = DTO.Object({
  id1: DTO.String(),
  id2: DTO.String(),
});

// Controller
@Get({ path: "/:id1/:id2", params: MultiParamDto })
async findByIds(
  @Param("id1") id1: string,
  @Param("id2") id2: string
) {
  return { id1, id2 };
}

// Or get all params
@Get({ path: "/:id1/:id2", params: MultiParamDto })
async findByIds(@Param() params: { id1: string; id2: string }) {
  return params;
}
```

---

## Validation & DTOs

### What is DTO and why do I need it?

**DTO (Data Transfer Object)** defines the shape and validation rules for request data. It ensures:

- **Type Safety**: Compile-time type checking
- **Runtime Validation**: Automatic request validation
- **Documentation**: Self-documenting API
- **Security**: Reject invalid/malicious input

```typescript
// Define expected data structure
export const CreateUserDTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 50 }),
  email: CommonDTO.Email(),
  age: DTO.Number({ minimum: 18 }),
});

// Use in controller
@Post({ path: "/users", body: CreateUserDTO })
async create(@Body() body: CreateUserType) {
  // body is validated and typed automatically!
}
```

### How do I add custom error messages?

Use the `error` or `errorMessage` property in your DTO:

```typescript
export const CreateUserDTO = DTO.Strict({
  name: DTO.String({
    minLength: 2,
    maxLength: 50,
    error: "Name must be between 2 and 50 characters", // Custom message
  }),
  email: CommonDTO.Email({
    error: "Please provide a valid email address",
  }),
  age: DTO.Number({
    minimum: 18,
    error: "You must be at least 18 years old",
  }),
});
```

### What's the difference between DTO.Object and DTO.Strict?

- **`DTO.Object()`**: Allows additional properties
- **`DTO.Strict()`**: Strips unknown properties (recommended for security)

```typescript
// Allows extra fields
const FlexibleDTO = DTO.Object({
  name: DTO.String(),
});

// Removes extra fields
const StrictDTO = DTO.Strict({
  name: DTO.String(),
});
```

Always use `DTO.Strict()` for request validation to prevent injection attacks.

### How do I handle optional fields?

Use `DTO.Optional()`:

```typescript
export const UpdateUserDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2 })),
  email: DTO.Optional(CommonDTO.Email()),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});
```

### Can I use Zod or other validation libraries?

WynkJS uses TypeBox (via Elysia) for validation. However, you can integrate other libraries:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
});

// Validate manually in controller
@Post("/users")
async create(@Body() body: any) {
  const validated = UserSchema.parse(body); // Throws if invalid
  // Use validated data
}
```

However, using TypeBox with WynkJS DTOs provides better integration and type inference.

---

## Database & ORM

### Which ORMs are supported?

WynkJS works with any ORM/ODM:

- **Drizzle ORM** - Recommended for TypeScript-first SQL
- **Prisma** - Full-featured ORM
- **TypeORM** - Mature ORM with decorators
- **Mongoose** - MongoDB ODM
- **Bun:sqlite** - Built-in SQLite
- **Raw SQL** - Direct database queries

Example with Drizzle:

```typescript
@Injectable()
@singleton()
export class DatabaseService {
  public db: any;

  async onModuleInit() {
    const sql = postgres(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }
}
```

See [docs-wynkjs/PROVIDERS.md](./docs-wynkjs/PROVIDERS.md) for database setup.

### How do I handle database connections?

Use a Provider with lifecycle hooks:

```typescript
@Injectable()
@singleton()
export class DatabaseService {
  public db: any;

  async onModuleInit() {
    // Connect on startup
    console.log("Connecting to database...");
    this.db = await connectToDatabase();
  }

  async onModuleDestroy() {
    // Cleanup on shutdown
    await this.db.close();
  }
}

// Register as provider
const app = WynkFactory.create({
  providers: [DatabaseService],
  controllers: [UserController],
});
```

### How do I run migrations?

Use your ORM's migration tools:

**Drizzle:**

```bash
bun drizzle-kit generate:sqlite
bun drizzle-kit migrate
```

**Prisma:**

```bash
bun prisma migrate dev
bun prisma migrate deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production migration strategies.

---

## Deployment & Production

### How do I deploy WynkJS to production?

WynkJS can be deployed to any platform that supports Bun:

**Docker:**

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
COPY . .
RUN bun run build
CMD ["bun", "run", "dist/index.js"]
```

**Fly.io**, **Railway**, **Render**, **DigitalOcean**, **AWS**, **GCP**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific guides.

### What environment variables do I need?

Essential variables for production:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-min-32-chars
```

Always validate environment variables on startup:

```typescript
function validateEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

validateEnv();
const app = WynkFactory.create({
  /* ... */
});
```

See [SECURITY.md](./SECURITY.md) for security best practices.

### How do I enable HTTPS?

**Development**: Use a reverse proxy (Caddy, nginx)

**Production**: Use:

- Cloud provider's load balancer (AWS ALB, GCP Load Balancer)
- Reverse proxy (nginx, Caddy)
- Platform's built-in HTTPS (Fly.io, Railway)

WynkJS runs HTTP; TLS termination happens at the proxy/load balancer level.

### How do I scale WynkJS?

**Horizontal Scaling:**

- Run multiple instances behind a load balancer
- Use PM2 or orchestration (Kubernetes, Docker Swarm)
- Cloud auto-scaling groups

**Vertical Scaling:**

- Increase CPU/memory resources
- Optimize database queries
- Implement caching (Redis)

**Performance:**

- Enable production mode (`NODE_ENV=production`)
- Use connection pooling
- Implement rate limiting
- Add CDN for static assets

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [PERFORMANCE.md](./PERFORMANCE.md).

---

## Troubleshooting

### Decorator errors: "Unable to resolve signature of class decorator"

**Cause**: Missing TypeScript configuration

**Solution**: Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2022"
  }
}
```

### DI not working: "Cannot inject undefined"

**Causes**:

1. Missing `@Injectable()` decorator
2. Circular dependencies
3. Controller not registered

**Solutions**:

```typescript
// Add @Injectable() to both service and controller
@Injectable()
export class UserService {}

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}
}

// Register controller
const app = WynkFactory.create({
  controllers: [UserController], // Must register!
});
```

For circular dependencies, use `@Inject()` with forward references.

### Validation not working

**Causes**:

1. DTO not applied to decorator
2. Using `@Body()` without DTO in decorator
3. TypeBox schema error

**Solution**: Always add DTO to the decorator:

```typescript
// ❌ Wrong - No validation
@Post("/users")
async create(@Body() body: any) { }

// ✅ Correct - Validation applied
@Post({ path: "/users", body: CreateUserDTO })
async create(@Body() body: CreateUserType) { }
```

### Port already in use

**Error**: `EADDRINUSE: address already in use`

**Solutions**:

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
await app.listen(3001);
```

### Build errors with Bun

**Error**: Module not found or import errors

**Solutions**:

1. Clear Bun cache: `rm -rf node_modules bun.lock && bun install`
2. Update Bun: `bun upgrade`
3. Check imports use `.js` extension for ESM
4. Verify `package.json` has `"type": "module"`

For more issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Getting Help

### Where can I get help?

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/wynkjs/wynkjs-core/issues)
- **Documentation**: [Complete docs](./README.md)
- **Examples**: [Real-world examples](./EXAMPLES.md)
- **Discord**: (Coming soon) Community chat

### How do I report a bug?

1. Check [existing issues](https://github.com/wynkjs/wynkjs-core/issues)
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (Bun version, OS, WynkJS version)
   - Minimal code example

### How can I contribute?

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code contribution guidelines
- Development setup
- Testing requirements
- Pull request process

### Is there a roadmap?

Check the [GitHub issues](https://github.com/wynkjs/wynkjs-core/issues) and [project board](https://github.com/wynkjs/wynkjs-core/projects) for planned features and enhancements.

---

## Additional Resources

- [README.md](./README.md) - Getting started guide
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation
- [EXAMPLES.md](./EXAMPLES.md) - Real-world examples
- [TESTING.md](./TESTING.md) - Testing guide
- [SECURITY.md](./SECURITY.md) - Security best practices
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guides
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

**Still have questions? [Open an issue](https://github.com/wynkjs/wynkjs-core/issues)!**
