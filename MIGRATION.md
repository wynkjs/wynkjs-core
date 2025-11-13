# Migration Guide

This guide helps you migrate between WynkJS versions and upgrade from other frameworks.

## Table of Contents

- [Migrating Within WynkJS Versions](#migrating-within-wynkjs-versions)
  - [v1.0.5 → v1.0.6](#v105--v106)
  - [v1.0.4 → v1.0.5](#v104--v105)
  - [v1.0.3 → v1.0.4](#v103--v104)
  - [v1.0.2 → v1.0.3](#v102--v103)
  - [v1.0.1 → v1.0.2](#v101--v102)
  - [v1.0.0 → v1.0.1](#v100--v101)
- [Migrating from Other Frameworks](#migrating-from-other-frameworks)
  - [From NestJS](#from-nestjs)
  - [From Express](#from-express)
  - [From Fastify](#from-fastify)
  - [From Elysia (Raw)](#from-elysia-raw)

---

## Migrating Within WynkJS Versions

### v1.0.5 → v1.0.6

**No breaking changes** - This is a patch release with improvements.

**What's New:**
- Improved dependency management
- Updated package metadata

**Migration Steps:**

```bash
# Update WynkJS
bun update wynkjs

# No code changes required
```

---

### v1.0.4 → v1.0.5

**No breaking changes** - Major performance improvements and testing additions.

**What's New:**
- 🏆 Comprehensive performance benchmarks
- ⚡ Ultra-optimized handler (3-tier optimization)
- 🔄 Lifecycle hooks (`onModuleInit`, `onModuleDestroy`)
- ✅ Full test coverage (182 tests)

**Migration Steps:**

```bash
# Update WynkJS
bun update wynkjs
```

**Optional: Use Lifecycle Hooks**

If you have providers that need initialization:

```typescript
// Before (manual initialization)
@Injectable()
@singleton()
export class DatabaseService {
  constructor() {
    this.connect(); // ❌ Async in constructor
  }
}

// After (using lifecycle hooks)
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleInit() {
    // ✅ Async initialization
    await this.connect();
  }

  async onModuleDestroy() {
    // ✅ Cleanup
    await this.disconnect();
  }
}
```

---

### v1.0.3 → v1.0.4

**No breaking changes** - Architecture restructure for better organization.

**What Changed:**
- Exception handling files reorganized
- Better separation: formatters vs filters
- Smart `NotFoundExceptionFilter` with response checking

**Migration Steps:**

```bash
# Update WynkJS
bun update wynkjs

# All imports still work the same way
```

**Imports remain unchanged:**

```typescript
// All these still work
import {
  NotFoundException,
  BadRequestException,
  FormatErrorFormatter,
  DetailedErrorFormatter,
  GlobalExceptionFilter,
} from "wynkjs";
```

**Optional: Use New Smart NotFoundExceptionFilter**

```typescript
import { NotFoundExceptionFilter } from "wynkjs";

app.useGlobalFilters(
  new NotFoundExceptionFilter(), // ✅ Smart 404 handling
  new GlobalExceptionFilter()
);
```

---

### v1.0.2 → v1.0.3

**No breaking changes** - Testing module addition.

**What's New:**
- 🧪 Built-in testing utilities
- 🧪 Auto-generated test files from CLI
- `Test.createTestingModule()` for isolated DI testing
- `MockFactory` for creating mocks and spies

**Migration Steps:**

```bash
# Update WynkJS and CLI
bun update wynkjs
bun update -D wynkjs-cli

# No code changes required
```

**Optional: Add Tests**

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
```

---

### v1.0.1 → v1.0.2

**No breaking changes** - Developer experience improvements.

**What's New:**
- 🎉 `create-wynkjs` CLI tool
- 💡 Better IntelliSense for DTO
- 📝 Improved examples

**Migration Steps:**

```bash
# Update WynkJS
bun update wynkjs

# Try the new project scaffolding
bunx create-wynkjs
```

**DTO Changes (Better IntelliSense):**

```typescript
// Before and After - both work the same
import { DTO } from "wynkjs";

const UserDTO = DTO.Strict({
  name: DTO.String(), // ✅ Better autocomplete now
  age: DTO.Number(),
});
```

---

### v1.0.0 → v1.0.1

**Minor breaking changes** - DI decorator naming and `reflect-metadata` auto-loading.

**What Changed:**
- `reflect-metadata` now auto-loaded (no manual import needed)
- Capital-cased DI decorators added (recommended)
- Validation error formatters added

**Migration Steps:**

#### Step 1: Update Package

```bash
bun update wynkjs
```

#### Step 2: Remove Manual reflect-metadata Import

```typescript
// Before
import "reflect-metadata"; // ❌ Remove this
import { Injectable, Controller } from "wynkjs";

// After
import { Injectable, Controller } from "wynkjs"; // ✅ Just import what you need
```

#### Step 3: Optional - Update to Capital-Cased Decorators

```typescript
// Before (still works)
import { injectable } from "wynkjs";

@injectable()
export class UserService {}

// After (recommended)
import { Injectable } from "wynkjs";

@Injectable()
export class UserService {}
```

**Both conventions work** - choose what you prefer!

#### Step 4: Optional - Add Validation Error Formatter

```typescript
import { WynkFactory, DetailedErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter(), // ✅ New feature
});
```

---

## Migrating from Other Frameworks

### From NestJS

WynkJS is heavily inspired by NestJS but designed for Bun with better performance.

#### Key Differences

| Feature              | NestJS                               | WynkJS                          |
| -------------------- | ------------------------------------ | ------------------------------- |
| **Runtime**          | Node.js                              | Bun only                        |
| **Performance**      | ~15K req/s (Express), ~49K (Fastify) | ~65K req/s                      |
| **DI Library**       | Custom                               | tsyringe                        |
| **Validation**       | class-validator                      | TypeBox (via Elysia)            |
| **HTTP Server**      | Express/Fastify                      | Elysia                          |
| **Module System**    | @Module decorators                   | Simple controller registration  |
| **reflect-metadata** | Manual import required               | Auto-loaded                     |
| **Decorators**       | Same syntax                          | Same syntax (nearly identical!) |

#### Migration Steps

##### 1. Install WynkJS

```bash
# Remove NestJS dependencies
bun remove @nestjs/core @nestjs/common @nestjs/platform-express

# Install WynkJS
bun add wynkjs
```

##### 2. Update Controllers

```typescript
// NestJS
import { Controller, Get, Post, Body } from "@nestjs/common";

@Controller("users")
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() body: any) {
    return body;
  }
}

// WynkJS - Almost identical!
import { Controller, Get, Post, Body, Injectable } from "wynkjs";

@Injectable() // ✅ Add this
@Controller("/users") // ✅ Add leading slash
export class UserController {
  @Get("/") // ✅ Add path
  findAll() {
    return [];
  }

  @Post({ path: "/" }) // ✅ Object format for validation
  create(@Body() body: any) {
    return body;
  }
}
```

##### 3. Update DTOs

```typescript
// NestJS (class-validator)
import { IsString, IsEmail, IsNumber, Min } from "class-validator";

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @Min(18)
  age: number;
}

// WynkJS (TypeBox)
import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.String({ minLength: 1 }),
  email: CommonDTO.Email(),
  age: DTO.Number({ minimum: 18 }),
});

export interface CreateUserType {
  name: string;
  email: string;
  age: number;
}
```

##### 4. Update Services (DI)

```typescript
// NestJS
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserService {
  // Same code
}

// WynkJS
import { Injectable } from "wynkjs";

@Injectable() // ✅ Same decorator name!
export class UserService {
  // Same code
}
```

##### 5. Update Module to Factory

```typescript
// NestJS
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { UserController } from "./user.controller";

@Module({
  controllers: [UserController],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

// WynkJS
import { WynkFactory } from "wynkjs";
import { UserController } from "./user.controller";

async function bootstrap() {
  const app = WynkFactory.create({
    controllers: [UserController], // ✅ Direct registration
  });

  await app.listen(3000);
}
```

##### 6. Update Guards

```typescript
// NestJS
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

// WynkJS - Use middleware pattern
import { Use } from "wynkjs";

const authGuard = async (ctx: any, next: Function) => {
  if (!ctx.headers.authorization) {
    ctx.set.status = 401;
    return { error: "Unauthorized" };
  }
  return next();
};

// Use it:
@Controller("/users")
@Use(authGuard) // ✅ Apply to controller
export class UserController {}
```

---

### From Express

WynkJS provides a more structured approach with decorators.

#### Key Differences

| Feature           | Express               | WynkJS                      |
| ----------------- | --------------------- | --------------------------- |
| **Performance**   | ~15K req/s            | ~65K req/s (4.3x faster)    |
| **Style**         | Functional/Imperative | Declarative/Decorator-based |
| **TypeScript**    | Optional              | Required                    |
| **DI**            | Manual                | Built-in                    |
| **Validation**    | Manual (joi, etc.)    | Built-in (TypeBox)          |
| **Organization**  | Flexible              | Structured (MVC)            |
| **Bun-Optimized** | No                    | Yes                         |

#### Migration Example

```typescript
// Express
import express from "express";
const app = express();

app.get("/users", (req, res) => {
  res.json({ users: [] });
});

app.post("/users", (req, res) => {
  const { name, email } = req.body;
  // Manual validation
  if (!name || !email) {
    return res.status(400).json({ error: "Invalid input" });
  }
  res.json({ user: { name, email } });
});

app.listen(3000);

// WynkJS
import { WynkFactory, Controller, Get, Post, Body, Injectable } from "wynkjs";
import { CreateUserDTO } from "./user.dto";
import type { CreateUserType } from "./user.dto";

@Injectable()
@Controller("/users")
export class UserController {
  @Get("/")
  findAll() {
    return { users: [] };
  }

  @Post({ path: "/", body: CreateUserDTO }) // ✅ Auto-validation
  create(@Body() body: CreateUserType) {
    return { user: body };
  }
}

const app = WynkFactory.create({
  controllers: [UserController],
});

await app.listen(3000);
```

---

### From Fastify

Similar to Express but with better performance. WynkJS is still faster!

#### Key Differences

| Feature        | Fastify           | WynkJS              |
| -------------- | ----------------- | ------------------- |
| **Performance**| ~49K req/s        | ~65K req/s (1.3x)   |
| **Validation** | JSON Schema       | TypeBox             |
| **DI**         | Manual/Plugins    | Built-in            |
| **Decorators** | Via plugins       | Native              |
| **Runtime**    | Node.js           | Bun                 |

#### Migration Example

```typescript
// Fastify
import Fastify from "fastify";
const fastify = Fastify();

const getUsersSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        users: { type: "array" },
      },
    },
  },
};

fastify.get("/users", { schema: getUsersSchema }, async (request, reply) => {
  return { users: [] };
});

await fastify.listen({ port: 3000 });

// WynkJS
import { WynkFactory, Controller, Get, Injectable } from "wynkjs";

@Injectable()
@Controller("/users")
export class UserController {
  @Get("/")
  async findAll() {
    return { users: [] }; // ✅ TypeScript handles types
  }
}

const app = WynkFactory.create({
  controllers: [UserController],
});

await app.listen(3000);
```

---

### From Elysia (Raw)

You're already familiar with Elysia! WynkJS adds structure on top.

#### Key Differences

| Feature         | Raw Elysia        | WynkJS                    |
| --------------- | ----------------- | ------------------------- |
| **Performance** | ~103K req/s       | ~65K req/s (63% of raw)   |
| **Style**       | Functional        | Decorator-based           |
| **DI**          | Manual            | Built-in                  |
| **Organization**| Free-form         | Structured (Controllers)  |
| **Trade-off**   | Max speed         | Structure + Good speed    |

#### Migration Example

```typescript
// Raw Elysia
import { Elysia, t } from "elysia";

const app = new Elysia()
  .get("/users", () => ({ users: [] }))
  .post(
    "/users",
    ({ body }) => ({ user: body }),
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )
  .listen(3000);

// WynkJS - Add structure
import { WynkFactory, Controller, Get, Post, Body, Injectable, DTO } from "wynkjs";

const CreateUserDTO = DTO.Strict({
  name: DTO.String(),
  email: DTO.String(),
});

@Injectable()
@Controller("/users")
export class UserController {
  @Get("/")
  findAll() {
    return { users: [] };
  }

  @Post({ path: "/", body: CreateUserDTO })
  create(@Body() body: any) {
    return { user: body };
  }
}

const app = WynkFactory.create({
  controllers: [UserController],
});

await app.listen(3000);
```

**When to use Raw Elysia vs WynkJS:**

- **Raw Elysia**: Maximum performance, simple APIs, microservices
- **WynkJS**: Larger applications, team projects, structured architecture, DI needed

---

## Need Help?

- 📚 [Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/wynkjs/wynkjs-core/discussions)
- 🐛 [Report Issues](https://github.com/wynkjs/wynkjs-core/issues)

---

**Built with ❤️ by the WynkJS Team**
