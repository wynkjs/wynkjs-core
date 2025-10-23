# WynkJS Core Philosophy

## 🎯 Lightweight & Flexible

**WynkJS does NOT try to be everything.** We provide:

### ✅ What's Included

- **Decorators** - @Controller, @Get, @Post, @Body, @Param, etc.
- **Dependency Injection** - @Injectable, @Inject, @Singleton, etc. (powered by tsyringe)
- **Guards** - Route protection and authorization
- **Pipes** - Input validation and transformation
- **Interceptors** - Request/response modification
- **Filters** - Error handling
- **DTO Validation** - Using Elysia's built-in TypeBox
- **Database Helpers** - initializeDatabase() and getDatabase() (optional)

### ❌ What's NOT Included

- Heavy ORM abstractions
- Forced database libraries
- Complex configuration systems
- Unnecessary dependencies
- Bloated features you don't need

## 🚀 Why This Approach?

1. **Performance** - 20x faster than NestJS (Elysia's speed)
2. **Flexibility** - Use ANY database library you want
3. **Simplicity** - Learn once, use anywhere
4. **Small Bundle** - No unnecessary code
5. **Freedom** - You're not locked into our choices

## 📚 Database Integration

We provide **example patterns** you can copy, not forced implementations.

### Option 1: Use Our Helper (Recommended)

```typescript
import { initializeDatabase, getDatabase } from "@wynkjs/framework";

const db = initializeDatabase({ type: "postgres", connectionString, schema });
// Use anywhere: const db = getDatabase();
```

### Option 2: Create Your Own Pattern

Copy examples from `core/database.ts` and customize to your needs.

### Option 3: Use Your Existing Code

WynkJS doesn't force you to change anything. Keep using your existing database patterns!

## 💡 Philosophy

> **"Give developers the tools they need, not the bloat they don't."**

We focus on making decorators and middleware work beautifully with Elysia.
Everything else? **You decide.**

### 💉 Dependency Injection

WynkJS includes full dependency injection support with **zero manual imports required**:

```typescript
import { Injectable, Controller, Get } from "wynkjs";

@Injectable()
export class UserService {
  getUsers() {
    return [{ id: 1, name: "Alice" }];
  }
}

@Injectable()
@Controller("/api")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/users")
  getAll() {
    return this.userService.getUsers();
  }
}
```

**Available decorators** (both naming conventions supported):

- `@Injectable()` / `@injectable()` - Mark class as injectable
- `@Inject()` / `@inject()` - Inject specific dependency
- `@Singleton()` / `@singleton()` - Create singleton instance
- `@AutoInjectable()` / `@autoInjectable()` - Auto-inject dependencies
- `Registry` / `registry` - Manual registration
- `Container` / `container` - Direct container access

---

**Built with ❤️ by the WynkJS Team**
