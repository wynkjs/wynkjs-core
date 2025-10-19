# 🚀 WynkJS

<div align="center">

**A high-performance TypeScript framework built on Elysia with NestJS-style decorators**

[![npm version](https://img.shields.io/npm/v/wynkjs.svg)](https://www.npmjs.com/package/wynkjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

_20x faster than Express, easier than NestJS_ ⚡

[Documentation](#documentation) • [Quick Start](#quick-start) • [Examples](#examples) • [Features](#features)

</div>

---

## About

WynkJS is a modern, TypeScript-first web framework that brings NestJS-style decorators to the blazing-fast Elysia runtime. It’s a lightweight NestJS alternative with familiar concepts—controllers, dependency injection, guards, pipes, interceptors, and exception filters—designed for building high‑performance REST APIs and backends on Node.js or Bun. WynkJS embraces ESM, ships first-class types, and keeps things simple so you can move fast without the bloat.

Keywords: NestJS alternative, Elysia framework, TypeScript decorators, dependency injection (DI), guards, pipes, interceptors, exception filters, fast web framework, REST API, backend, Bun, Node.js.

---

## ✨ Why WynkJS?

WynkJS combines the **speed of Elysia** with the **elegant decorator syntax of NestJS**, giving you the best of both worlds:

- 🚀 **20x Faster** - Built on Elysia, one of the fastest web frameworks
- 🎨 **Decorator-Based** - Familiar NestJS-style decorators
- 💉 **Dependency Injection** - Built-in DI with tsyringe
- 🔒 **Type-Safe** - Full TypeScript support
- 🎯 **Simple & Clean** - Easy to learn, powerful to use
- 🔌 **Middleware Support** - Guards, interceptors, pipes, filters
- ⚡ **Hot Reload** - Fast development with Bun

---

## 📦 Installation

```bash
npm install wynkjs elysia reflect-metadata
```

Or with Bun:

```bash
bun add wynkjs elysia reflect-metadata
```

---

## 🚀 Quick Start

### 1. Create Your First Controller

```typescript
import { Controller, Get, Post, Body } from "wynkjs";
import { injectable } from "tsyringe";

@injectable()
@Controller("/users")
export class UserController {
  @Get("/")
  async list() {
    return { users: ["Alice", "Bob", "Charlie"] };
  }

  @Post("/")
  async create(@Body() body: any) {
    return { message: "User created", data: body };
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    return { user: { id, name: "Alice" } };
  }
}
```

### 2. Create Your Application

```typescript
import "reflect-metadata";
import { WynkFramework } from "wynkjs";
import { UserController } from "./controllers/user.controller";

const app = await WynkFramework.create({
  controllers: [UserController],
});

await app.listen(3000);

console.log("🚀 Server running on http://localhost:3000");
```

### 3. Run Your Server

```bash
bun run index.ts
```

That's it! 🎉

---

## 📚 Core Decorators

### HTTP Methods

```typescript
@Get(path?: string)        // GET request
@Post(path?: string)       // POST request
@Put(path?: string)        // PUT request
@Patch(path?: string)      // PATCH request
@Delete(path?: string)     // DELETE request
@Options(path?: string)    // OPTIONS request
@Head(path?: string)       // HEAD request
```

### Parameter Decorators

```typescript
@Param(key?: string)       // Route parameters
@Body()                    // Request body
@Query(key?: string)       // Query parameters
@Headers(key?: string)     // Request headers
@Req()                     // Full request object
@Res()                     // Full response object
```

### Route Options

```typescript
@HttpCode(statusCode)      // Set HTTP status code
@Header(name, value)       // Set response header
@Redirect(url, code?)      // Redirect response
```

### Middleware

```typescript
@Use(...middlewares)       // Apply middleware
@UseGuards(...guards)      // Apply guards
@UseInterceptors(...)      // Apply interceptors
@UsePipes(...pipes)        // Apply pipes
@UseFilters(...filters)    // Apply exception filters
```

---

## 🎯 Features & Examples

### 🔒 Authentication with Guards

```typescript
import { Controller, Get, Use } from "wynkjs";

// Create a simple JWT guard
const jwtGuard = async (ctx: any, next: Function) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    ctx.set.status = 401;
    return { error: "Unauthorized" };
  }

  // Verify token and attach user
  ctx.user = await verifyToken(token);
  return next();
};

@Controller("/protected")
export class ProtectedController {
  @Get("/")
  @Use(jwtGuard)
  async getProtectedData() {
    return { message: "This is protected!" };
  }
}
```

### 🎭 Role-Based Access Control

```typescript
const rolesGuard = (allowedRoles: string[]) => {
  return async (ctx: any, next: Function) => {
    const userRole = ctx.user?.role;

    if (!allowedRoles.includes(userRole)) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    return next();
  };
};

@Controller("/admin")
@Use(jwtGuard, rolesGuard(["admin"]))
export class AdminController {
  @Get("/users")
  async getAllUsers() {
    return { users: [] };
  }
}
```

### 💉 Dependency Injection

```typescript
import { injectable, inject } from "tsyringe";

@injectable()
export class UserService {
  async findAll() {
    return [{ id: 1, name: "Alice" }];
  }
}

@injectable()
@Controller("/users")
export class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  @Get("/")
  async list() {
    const users = await this.userService.findAll();
    return { users };
  }
}
```

### 🗃️ Database Integration (Drizzle ORM)

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { InjectTable, registerTables } from "wynkjs";

// Define your table
const userTable = pgTable("users", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
});

// Register tables
registerTables({ userTable });

@injectable()
export class UserService {
  private db = drizzle(process.env.DATABASE_URL);

  constructor(@InjectTable(userTable) private table: typeof userTable) {}

  async findAll() {
    return this.db.select().from(this.table);
  }
}
```

### 📝 Request Validation

```typescript
import { Post, Body, UsePipes } from "wynkjs";
import { t } from "elysia";

const CreateUserDTO = t.Object({
  name: t.String({ minLength: 2 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

@Controller("/users")
export class UserController {
  @Post({
    path: "/",
    body: CreateUserDTO,
  })
  async create(@Body() body: any) {
    // Body is automatically validated!
    return { message: "User created", data: body };
  }
}
```

### 🔄 Multiple Middleware

```typescript
const logger = async (ctx: any, next: Function) => {
  console.log(`${ctx.request.method} ${ctx.path}`);
  return next();
};

const cors = async (ctx: any, next: Function) => {
  ctx.set.headers["Access-Control-Allow-Origin"] = "*";
  return next();
};

@Controller("/api")
@Use(logger, cors)
export class ApiController {
  @Get("/data")
  @Use(cacheMiddleware)
  async getData() {
    return { data: [] };
  }
}
```

---

## 🏗️ Project Structure

```
my-wynk-app/
├── src/
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   └── auth.controller.ts
│   ├── services/
│   │   ├── user.service.ts
│   │   └── auth.service.ts
│   ├── middleware/
│   │   ├── jwt.guard.ts
│   │   └── roles.guard.ts
│   ├── dto/
│   │   └── user.dto.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## 🎨 Complete Example

```typescript
// index.ts
import "reflect-metadata";
import { WynkFramework } from "wynkjs";
import { UserController } from "./controllers/user.controller";
import { AuthController } from "./controllers/auth.controller";

const app = await WynkFramework.create({
  controllers: [UserController, AuthController],
  globalGuards: [],
  globalInterceptors: [],
});

await app.listen(3000);
console.log("🚀 Server running on http://localhost:3000");
```

```typescript
// controllers/user.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Use } from "wynkjs";
import { injectable, inject } from "tsyringe";
import { UserService } from "../services/user.service";
import { jwtGuard } from "../middleware/jwt.guard";

@injectable()
@Controller("/users")
@Use(jwtGuard)
export class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  @Get("/")
  async list() {
    const users = await this.userService.findAll();
    return { users };
  }

  @Get("/:id")
  async findOne(@Param("id") id: string) {
    const user = await this.userService.findById(id);
    return { user };
  }

  @Post("/")
  async create(@Body() body: any) {
    const user = await this.userService.create(body);
    return { message: "User created", user };
  }

  @Put("/:id")
  async update(@Param("id") id: string, @Body() body: any) {
    const user = await this.userService.update(id, body);
    return { message: "User updated", user };
  }

  @Delete("/:id")
  @HttpCode(204)
  async delete(@Param("id") id: string) {
    await this.userService.delete(id);
  }
}
```

```typescript
// services/user.service.ts
import { injectable } from "tsyringe";

@injectable()
export class UserService {
  private users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
  ];

  async findAll() {
    return this.users;
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  async create(data: any) {
    const user = { id: Date.now().toString(), ...data };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: any) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...data };
      return this.users[index];
    }
    return null;
  }

  async delete(id: string) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}
```

---

## 🔧 API Reference

### WynkFramework.create(options)

Create a new WynkJS application.

**Options:**

- `controllers: Array<Class>` - Array of controller classes
- `globalGuards?: Array<Guard>` - Global guards (optional)
- `globalInterceptors?: Array<Interceptor>` - Global interceptors (optional)
- `globalPipes?: Array<Pipe>` - Global pipes (optional)
- `globalFilters?: Array<Filter>` - Global exception filters (optional)

**Returns:** Promise<WynkFramework>

### app.listen(port, callback?)

Start the server on the specified port.

---

## 🎯 Performance

WynkJS is built on Elysia, which is **20x faster than Express**:

| Framework  | Requests/sec | Latency (avg) |
| ---------- | ------------ | ------------- |
| **WynkJS** | **~250,000** | **~0.4ms**    |
| Elysia     | ~250,000     | ~0.4ms        |
| Fastify    | ~45,000      | ~2.2ms        |
| Express    | ~12,000      | ~8.3ms        |

_Benchmarks may vary based on hardware and configuration_

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT © Alam Jamal

---

## 🔗 Links

- [GitHub Repository](https://github.com/alamjamal/wynkjs)
- [Issue Tracker](https://github.com/alamjamal/wynkjs/issues)
- [Elysia Documentation](https://elysiajs.com/)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)

---

## 💖 Acknowledgments

Built with:

- [Elysia](https://elysiajs.com/) - The fast web framework
- [tsyringe](https://github.com/microsoft/tsyringe) - Dependency injection
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

<div align="center">

**[⬆ back to top](#-wynkjs)**

Made with ❤️ by [Alam Jamal](https://github.com/alamjamal)

</div>
