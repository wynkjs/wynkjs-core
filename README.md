# 🚀 WynkJS

<div align="center">

**A high-performance TypeScript framework built on Elysia for Bun with NestJS-style decorators**

[![npm version](https://img.shields.io/npm/v/wynkjs.svg)](https://www.npmjs.com/package/wynkjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)

_20x faster than Express, easier than NestJS, built for Bun_ ⚡

[Quick Start](#-quick-start) • [CLI Tools](#️-cli-tools) • [Features](#-features--examples) • [Documentation](#-documentation)

</div>

---

## About

WynkJS is a modern, TypeScript-first web framework that brings NestJS-style decorators to the blazing-fast Elysia runtime built for **Bun**. It's a lightweight NestJS alternative with familiar concepts—controllers, dependency injection, guards, pipes, interceptors, and exception filters—designed for building high‑performance REST APIs and backends on **Bun**. WynkJS embraces ESM, ships first-class types, and keeps things simple so you can move fast without the bloat.

**🚀 Get Started in 30 Seconds:**

```bash
bunx create-wynkjs        # Create new project
cd my-wynkjs-app          # Navigate to project
bun run dev               # Start server with hot reload
```

Then generate your first API module:

```bash
wynkjs g m product        # Generate complete CRUD module
```

Keywords: NestJS alternative, Elysia framework, Bun framework, TypeScript decorators, dependency injection (DI), guards, pipes, interceptors, exception filters, fast web framework, REST API, backend.

---

## ✨ Why WynkJS?

WynkJS combines the **speed of Elysia** with the **elegant decorator syntax of NestJS**, giving you the best of both worlds:

- 🚀 **20x Faster** - Built on Elysia, one of the fastest web frameworks for Bun
- 🎨 **Decorator-Based** - Familiar NestJS-style decorators
- 💉 **Dependency Injection** - Built-in DI (no need to import reflect-metadata!)
- 🔒 **TypeScript First** - TypeScript is mandatory, not optional. Full type safety and IntelliSense support
- 🎯 **Simple & Clean** - Easy to learn, powerful to use
- 🔌 **Middleware Support** - Guards, interceptors, pipes, filters
- ⚡ **Bun Only** - Built exclusively for Bun runtime (not Node.js)
- 📦 **Single Import** - Everything from `wynkjs` (Injectable, Controller, Get, etc.)

---

## 📦 Installation

**Requirements:** Bun 1.0 or higher

### Quick Start (Recommended)

Create a new WynkJS project with all best practices:

```bash
bunx create-wynkjs
# or
npx create-wynkjs
```

This will scaffold a complete **TypeScript** project with:

- ✅ TypeScript (strict mode, decorators enabled)
- ✅ ESLint + Prettier (optional)
- ✅ Hot reload with `bun --watch`
- ✅ Example code (controllers, services, DTOs)
- ✅ Git hooks (optional)

### Manual Installation

Add to an existing project:

```bash
bun add wynkjs elysia
```

**Note**: WynkJS is built specifically for **Bun**. It leverages Elysia's performance optimizations that are designed for Bun runtime. ✨

---

## 🚀 Quick Start

### 1. Create Your DTOs (Data Transfer Objects)

```typescript
// user.dto.ts
import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 50 })),
  email: CommonDTO.Email({
    description: "User email address",
  }),
  mobile: DTO.Optional(
    DTO.String({
      pattern: "^[6-9]{1}[0-9]{9}$",
      errorMessage: "Invalid mobile number",
    })
  ),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface CreateUserType {
  name?: string;
  email?: string;
  mobile?: string;
  age?: number;
}

export const UserIdDto = DTO.Object({
  id: DTO.String({ minLength: 2, maxLength: 50 }),
});

export interface ParamIdType {
  id: string;
}
```

### 2. Create a Service with Dependency Injection

```typescript
// email.service.ts
import { Injectable } from "wynkjs";

@Injectable()
export class EmailService {
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    console.log(`📧 Sending welcome email to ${email}`);
    // Your email logic here
  }
}
```

### 3. Create Your Controller

```typescript
// user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { CreateUserDTO, UserIdDto } from "./user.dto";
import type { CreateUserType, ParamIdType } from "./user.dto";
import { EmailService } from "./email.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private emailService: EmailService) {}

  @Get("/")
  async list() {
    return { users: ["Alice", "Bob", "Charlie"] };
  }

  @Post({
    path: "/",
    body: CreateUserDTO,
  })
  async create(@Body() body: CreateUserType) {
    // Send welcome email using injected service
    if (body.email && body.name) {
      await this.emailService.sendWelcomeEmail(body.email, body.name);
    }

    return { message: "User created", data: body };
  }

  @Get({ path: "/:id", params: UserIdDto })
  async findOne(@Param("id") id: string) {
    return { user: { id, name: "Alice" } };
  }

  @Patch({
    path: "/:id",
    params: UserIdDto,
  })
  async update(@Param("id") id: string, @Body() body: any) {
    if (id === "nonexistent") {
      throw new NotFoundException("User not found");
    }

    return { message: "User updated", id, data: body };
  }
}
```

### 4. Bootstrap Your Application

```typescript
// index.ts
import { WynkFactory } from "wynkjs";
import { UserController } from "./user.controller";

const app = WynkFactory.create({
  controllers: [UserController],
});

await app.listen(3000);

console.log("🚀 Server running on http://localhost:3000");
```

### 5. Run Your Server

```bash
bun run index.ts
# or with --watch for hot reload
bun --watch index.ts
```

### 6. Test Your API

```bash
# List users
curl http://localhost:3000/users

# Create user (with validation)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":25}'

# Get user by ID
curl http://localhost:3000/users/123

# Update user
curl -X PATCH http://localhost:3000/users/123 \
  -H "Content-Type: application/json" \
  -d '{"email":"newemail@example.com"}'
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

## 🛠️ CLI Tools

WynkJS provides powerful CLI tools to speed up your development workflow:

### 📦 create-wynkjs - Project Scaffolding

Quickly scaffold a new WynkJS project with best practices:

```bash
# Create a new project
bunx create-wynkjs
# or
npx create-wynkjs
```

**What you get:**

- ✅ **TypeScript** - Strict mode with decorators enabled (mandatory)
- ✅ **ESLint** - Code linting with TypeScript rules (optional)
- ✅ **Prettier** - Code formatting (optional)
- ✅ **Husky** - Git hooks for pre-commit checks (optional)
- ✅ **Hot Reload** - `bun --watch` for instant feedback
- ✅ **Working Example** - Complete CRUD controller, service, and DTOs

**Example:**

```bash
bunx create-wynkjs
# Choose project name: my-api
# Add ESLint? Yes
# Add Prettier? Yes
# Add Husky? No

cd my-api
bun run dev
# 🚀 Server running on http://localhost:3000
```

### ⚡ wynkjs-cli - Code Generator

Generate modules, controllers, services, and DTOs instantly:

```bash
# Install globally (recommended)
bun add -g wynkjs-cli

# Or install in project
bun add -D wynkjs-cli
```

**Commands:**

```bash
# Generate complete CRUD module (controller + service + DTO)
wynkjs generate module product
# or short: wynkjs g m product

# Generate controller only (all HTTP methods)
wynkjs generate controller user
# or short: wynkjs g c user

# Generate service only (all CRUD methods)
wynkjs generate service order
# or short: wynkjs g s order

# Generate DTO only (Create, Update, ID DTOs)
wynkjs generate dto payment
# or short: wynkjs g d payment
```

**What it generates:**

```bash
wynkjs g m product
# Creates:
# src/modules/product/
#   ├── controllers/
#   │   └── product.controller.ts   # Full CRUD controller
#   ├── services/
#   │   └── product.service.ts      # All CRUD methods
#   └── dto/
#       └── product.dto.ts           # Validation schemas
```

**Auto-imports:** Controllers are automatically imported and added to `src/index.ts`!

**Generated Code Example:**

```typescript
// product.controller.ts - Ready to use!
@Injectable()
@Controller("/product")
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get("/")
  async findAll() {
    /* ... */
  }

  @Post({ path: "/", body: CreateProductDTO })
  async create(@Body() body: CreateProductType) {
    /* ... */
  }

  @Get({ path: "/:id", params: ProductIdDto })
  async findOne(@Param("id") id: string) {
    /* ... */
  }

  @Put({ path: "/:id", params: ProductIdDto, body: UpdateProductDTO })
  async update(@Param("id") id: string, @Body() body: UpdateProductType) {
    /* ... */
  }

  @Delete({ path: "/:id", params: ProductIdDto })
  async remove(@Param("id") id: string) {
    /* ... */
  }
}
```

**Full Workflow:**

```bash
# 1. Create new project
bunx create-wynkjs
cd my-api

# 2. Generate your first module
wynkjs g m product

# 3. Start developing
bun run dev

# 4. Your API is ready!
curl http://localhost:3000/product
# {"data":[]}
```

**Custom Configuration** (optional):

Create `wynkjs.config.json` in your project root:

```json
{
  "srcDir": "src",
  "controllersDir": "src/controllers",
  "servicesDir": "src/services",
  "dtoDir": "src/dto",
  "modulesDir": "src/modules"
}
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

WynkJS includes powerful dependency injection with **zero setup required**:

```typescript
// email.service.ts
import { Injectable } from "wynkjs";

@Injectable()
export class EmailService {
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    console.log(`📧 Sending welcome email to ${email}`);
    // Your email sending logic
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    console.log(`🔐 Sending password reset to ${email}`);
    // Your reset email logic
  }
}

// user.controller.ts
import { Controller, Post, Body, Injectable } from "wynkjs";
import { EmailService } from "./email.service";

@Injectable()
@Controller("/users")
export class UserController {
  // ✨ EmailService is automatically injected!
  constructor(private emailService: EmailService) {}

  @Post("/")
  async create(@Body() body: { name: string; email: string }) {
    // Use the injected service
    await this.emailService.sendWelcomeEmail(body.email, body.name);
    return { message: "User created and email sent!" };
  }

  @Post("/send-reset-email")
  async sendPasswordReset(@Body() body: { email: string }) {
    await this.emailService.sendPasswordResetEmail(
      body.email,
      "reset-token-123"
    );
    return { message: "Password reset email sent" };
  }
}
```

**Available DI decorators**:

- Capital: `Injectable`, `Inject`, `Singleton`, `AutoInjectable`, `Container`

### 🗃️ Database Integration (Drizzle ORM)

```typescript
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { InjectTable, registerTables } from "wynkjs";

// Define your table
const userTable = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// Register tables
registerTables({ userTable });

@Injectable()
export class UserService {
  private db = drizzle(process.env.DATABASE_URL);

  constructor(@InjectTable(userTable) private table: typeof userTable) {}

  async findAll() {
    return this.db.select().from(this.table);
  }
}
```

### 📝 Request Validation

WynkJS provides automatic request validation with **full IntelliSense support** and customizable error formats:

> 💡 **New in v1.0.2**: Type `DTO.` and get full autocomplete! See [INTELLISENSE_GUIDE.md](./docs/INTELLISENSE_GUIDE.md)

```typescript
// user.dto.ts
import { DTO, CommonDTO } from "wynkjs";

// ✨ Full IntelliSense when typing DTO.String(), DTO.Number(), etc!
export const CreateUserDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 50 })),
  email: CommonDTO.Email({
    description: "User email address",
  }),
  mobile: DTO.Optional(
    DTO.String({
      pattern: "^[6-9]{1}[0-9]{9}$",
      errorMessage: "Invalid mobile number",
    })
  ),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface CreateUserType {
  name?: string;
  email?: string;
  mobile?: string;
  age?: number;
}

export const UserUpdateDTO = DTO.Strict({
  email: DTO.Optional(DTO.String({ format: "email", minLength: 5 })),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface UserUpdateType {
  email?: string;
  age?: number;
}

// user.controller.ts
import { Controller, Post, Patch, Body, Param } from "wynkjs";
import { CreateUserDTO, UserUpdateDTO } from "./user.dto";
import type { CreateUserType, UserUpdateType } from "./user.dto";

@Controller("/users")
export class UserController {
  @Post({
    path: "/",
    body: CreateUserDTO, // ✅ Automatic validation
  })
  async create(@Body() body: CreateUserType) {
    // Body is validated automatically!
    // Invalid requests get clear error messages
    return { message: "User created", data: body };
  }

  @Patch({
    path: "/:id",
    body: UserUpdateDTO, // ✅ Different schema for updates
  })
  async update(@Param("id") id: string, @Body() body: UserUpdateType) {
    return { message: "User updated", id, data: body };
  }
}
```

**Customize validation error format:**

```typescript
import { WynkFactory, FormatErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  // Choose your validation error format
  validationErrorFormatter: new FormatErrorFormatter(), // NestJS-style (recommended)
  // validationErrorFormatter: new SimpleErrorFormatter(), // Simple array
  // validationErrorFormatter: new DetailedErrorFormatter(), // Detailed with paths
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

// Choose your validation error format
const app = WynkFactory.create({
  controllers: [UserController],
  // Option 1: Default format (recommended)
  // validationErrorFormatter: new FormatErrorFormatter(), // NestJS-style
  // Option 2: Simple array format
  // validationErrorFormatter: new SimpleErrorFormatter(),
  // Option 3: Detailed format with field info
  // validationErrorFormatter: new DetailedErrorFormatter(),
});
```

**See [VALIDATION_FORMATTERS.md](./VALIDATION_FORMATTERS.md) for all available error formats**

### 🚫 Exception Handling

```typescript
import { Controller, Get, Param, NotFoundException } from "wynkjs";

@Controller("/users")
export class UserController {
  @Get("/:id")
  async findOne(@Param("id") id: string) {
    // Built-in exceptions
    if (id === "nonexistent") {
      throw new NotFoundException("User not found");
    }

    return { user: { id, name: "Alice" } };
  }
}
```

**Built-in exceptions:**

- `BadRequestException` - 400
- `UnauthorizedException` - 401
- `ForbiddenException` - 403
- `NotFoundException` - 404
- `InternalServerErrorException` - 500

### 🔄 Multiple Params and Query Validation

```typescript
// user.dto.ts
export const MultiParamDto = DTO.Object({
  id1: DTO.String({ minLength: 2, maxLength: 50 }),
  id2: DTO.String({ minLength: 2, maxLength: 50 }),
});

export const UserQueryDto = DTO.Strict({
  includePosts: DTO.Optional(DTO.Boolean({ default: false })),
  includeComments: DTO.Optional(DTO.Boolean({ default: false })),
});

// user.controller.ts
@Post({
  path: "/:id1/:id2",
  body: CreateUserDTO,
  params: MultiParamDto,  // ✅ Validates route params
  query: UserQueryDto,     // ✅ Validates query params
})
async create(
  @Body() body: CreateUserType,
  @Param("id1") id1: string,
  @Param("id2") id2: string,
  @Query() query: UserQueryType
) {
  return {
    message: "User created",
    data: body,
    params: { id1, id2 },
    query
  };
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
│   │   └── user.controller.ts
│   ├── services/
│   │   └── email.service.ts
│   ├── dto/
│   │   └── user.dto.ts
│   ├── exceptions/
│   │   └── email.exceptions.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## 🎨 Complete Working Example

Here's a complete, production-ready example with all features:

```typescript
// dto/user.dto.ts
import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 50 })),
  email: CommonDTO.Email({ description: "User email address" }),
  mobile: DTO.Optional(
    DTO.String({
      pattern: "^[6-9]{1}[0-9]{9}$",
      errorMessage: "Invalid mobile number",
    })
  ),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export const UserIdDto = DTO.Object({
  id: DTO.String({ minLength: 2, maxLength: 50 }),
});

export interface CreateUserType {
  name?: string;
  email: string;
  mobile?: string;
  age?: number;
}

// services/email.service.ts
import { Injectable } from "wynkjs";

@Injectable()
export class EmailService {
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    console.log(`📧 Sending welcome email to ${email}`);
    // Your email sending logic (SendGrid, AWS SES, etc.)
  }
}

// controllers/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { CreateUserDTO, UserIdDto } from "../dto/user.dto";
import type { CreateUserType } from "../dto/user.dto";
import { EmailService } from "../services/email.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private emailService: EmailService) {}

  @Get("/")
  async list() {
    return { users: ["Alice", "Bob", "Charlie"] };
  }

  @Post({ path: "/", body: CreateUserDTO })
  async create(@Body() body: CreateUserType) {
    // Send welcome email using injected service
    if (body.email && body.name) {
      await this.emailService.sendWelcomeEmail(body.email, body.name);
    }
    return { message: "User created", data: body };
  }

  @Get({ path: "/:id", params: UserIdDto })
  async findOne(@Param("id") id: string) {
    if (id === "nonexistent") {
      throw new NotFoundException("User not found");
    }
    return { user: { id, name: "Alice" } };
  }

  @Patch({ path: "/:id", params: UserIdDto })
  async update(@Param("id") id: string, @Body() body: any) {
    return { message: "User updated", id, data: body };
  }
}

// index.ts
import { WynkFactory } from "wynkjs";
import { UserController } from "./controllers/user.controller";

const app = WynkFactory.create({
  controllers: [UserController],
});

await app.listen(3000);
console.log("🚀 Server running on http://localhost:3000");
```

**Test the API:**

```bash
# List all users
curl http://localhost:3000/users

# Create a new user (with validation and email)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'

# Get user by ID
curl http://localhost:3000/users/123

# Update user
curl -X PATCH http://localhost:3000/users/123 \
  -H "Content-Type: application/json" \
  -d '{"email":"newemail@example.com"}'

# Test 404 exception
curl http://localhost:3000/users/nonexistent
```

---

## 📖 API Reference

### Core Decorators

#### `@Controller(basePath?: string)`

Define a controller class with optional base path.

```typescript
@Controller("/users")
export class UserController {
  // All routes will be prefixed with /users
}
```

#### `@Get(path?: string)` / `@Post()` / `@Patch()` / `@Delete()`

HTTP method decorators with optional path and options.

```typescript
@Get("/")                    // GET /users
@Post({ path: "/", body: CreateUserDTO })  // POST with validation
@Patch({ path: "/:id", params: UserIdDto }) // PATCH with param validation
```

#### `@Body()` / `@Param(key?)` / `@Query(key?)`

Parameter extraction decorators.

```typescript
async create(
  @Body() body: CreateUserType,      // Full body
  @Param("id") id: string,            // Single param
  @Query() query: UserQueryType       // Full query object
) {}
```

#### `@Injectable()`

Mark a class as injectable for dependency injection.

```typescript
@Injectable()
export class EmailService {
  // This service can be injected into controllers
}
```

### DTO Helpers

#### `DTO.Strict(properties, options?)`

Create object schema that strips additional properties.

```typescript
const UserDTO = DTO.Strict({
  name: DTO.String(),
  email: DTO.String({ format: "email" }),
});
```

#### `CommonDTO` Patterns

Pre-built validation patterns for common use cases.

```typescript
CommonDTO.Email(); // Email validation
CommonDTO.Name(); // Name (2-50 chars)
CommonDTO.Password(); // Password (min 6 chars)
CommonDTO.UUID(); // UUID format
CommonDTO.PhoneIN(); // Indian phone number
```

### Exception Classes

```typescript
throw new NotFoundException("User not found"); // 404
throw new BadRequestException("Invalid input"); // 400
throw new UnauthorizedException("Not authenticated"); // 401
throw new ForbiddenException("Access denied"); // 403
throw new InternalServerErrorException("Error"); // 500
```

---

## �️ CLI Tool

### create-wynkjs

Quickly scaffold a new WynkJS project with best practices:

```bash
bunx create-wynkjs
# or
npx create-wynkjs
```

**Features:**

- 🎯 Interactive project setup
- ✅ TypeScript configuration (strict mode)
- 🔍 ESLint with TypeScript rules
- 💅 Prettier for code formatting
- 🪝 Husky for Git hooks (optional)
- 🔥 Hot reload with `bun --watch` (faster than nodemon)
- 📝 Complete working example (CRUD API)

**Generated Project Structure:**

```
my-wynkjs-app/
├── src/
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── services/
│   │   └── user.service.ts
│   ├── dto/
│   │   └── user.dto.ts
│   └── index.ts
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
└── package.json
```

**Available Scripts:**

- `bun run dev` - Development with hot reload
- `bun run start` - Production server
- `bun run build` - Build TypeScript
- `bun run lint` - Run ESLint
- `bun run format` - Format with Prettier

[Learn more about create-wynkjs](./packages/create-wynkjs/README.md)

---

## �🔗 Resources

- 📚 [Full Documentation](https://github.com/wynkjs/wynkjs-core)
- 🚀 [CLI Tool (create-wynkjs)](./packages/create-wynkjs/README.md)
- 💡 [IntelliSense Guide](./docs/INTELLISENSE_GUIDE.md)
- 🎨 [Validation Formatters](./VALIDATION_FORMATTERS.md)
- 📝 [Changelog](./CHANGELOG.md)
- 🐛 [Report Issues](https://github.com/wynkjs/wynkjs-core/issues)

---

## 🤝 Contributing

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
```
