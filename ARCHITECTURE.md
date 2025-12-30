# WynkJS Architecture - Exception Handling

## 🔍 What Goes Where?

### 1️⃣ `exception.decorators.ts` - Exception Classes & Decorators

**Purpose:** Define exception types and decorators for exception handling

**Contains:**

- ✅ Exception classes (throw these in your code)
  - `HttpException`, `NotFoundException`, `BadRequestException`, etc.
- ✅ Decorators for filters
  - `@Catch()`, `@UseFilters()`
- ✅ Interfaces
  - `WynkExceptionFilter`
- ✅ Example filters (NOT for global use)
  - `HttpWynkExceptionFilter`
  - `AllExceptions`
  - `AuthenticationException`
  - `AuthorizationException`
  - `RateLimitException`
  - `BusinessLogicException`

**Usage:**

```typescript
import { NotFoundException, UseFilters, AuthenticationException } from "wynkjs";

// Throw exceptions
throw new NotFoundException("User not found");

// Use specific filters on routes/controllers
@UseFilters(AuthenticationException)
@Controller("/auth")
export class AuthController {}
```

---

### 2️⃣ `formatter.decorators.ts` - Validation Error Formatters

**Purpose:** Format validation errors from TypeBox/Elysia

**Contains:**

- ✅ `ErrorFormatter` interface
- ✅ `FormatErrorFormatter` - Object format `{ field: ["messages"] }`
- ✅ `SimpleErrorFormatter` - Simple array format
- ✅ `DetailedErrorFormatter` - Detailed field info

**Usage:**

```typescript
import { WynkFactory, DetailedErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter(), // ✅ Pass here
});
```

**❌ WRONG:**

```typescript
// Don't use formatters as filters!
app.useGlobalFilters(new DetailedErrorFormatter()); // ❌ Won't work
```

---

### 3️⃣ `filters/exception.filters.ts` - Global Exception Filters

**Purpose:** Filters that are SAFE to use globally

**Contains:**

- ✅ `DatabaseExceptionFilter` - Catches database errors, re-throws HttpExceptions
- ✅ `NotFoundExceptionFilter` - Smart filter with response data checking
- ✅ `FileUploadExceptionFilter` - Handles file upload errors
- ✅ `GlobalExceptionFilter` - Catch-all for unhandled exceptions

**Usage:**

```typescript
import {
  GlobalExceptionFilter,
  DatabaseExceptionFilter,
  NotFoundExceptionFilter,
} from "wynkjs";

app.useGlobalFilters(
  new DatabaseExceptionFilter(), // Specific: DB errors
  new NotFoundExceptionFilter(), // Specific: 404s with smart detection
  new GlobalExceptionFilter() // General: Everything else
);
```

---

## 🎯 Key Differences

### Formatters vs Filters

| Feature          | Formatters                                         | Filters                    |
| ---------------- | -------------------------------------------------- | -------------------------- |
| **Purpose**      | Format validation errors                           | Handle runtime exceptions  |
| **When?**        | During request validation                          | When exceptions are thrown |
| **Registration** | `WynkFactory.create({ validationErrorFormatter })` | `app.useGlobalFilters()`   |
| **Scope**        | Validation only                                    | All exceptions             |
| **Example**      | `FormatErrorFormatter`                             | `DatabaseExceptionFilter`  |

### Global Filters vs Route-Specific Filters

| Type               | Where to Use                         | Examples                                                                      |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| **Global Filters** | `app.useGlobalFilters()`             | `DatabaseExceptionFilter`, `NotFoundExceptionFilter`, `GlobalExceptionFilter` |
| **Route-Specific** | `@UseFilters()` on controller/method | `AuthenticationException`, `AuthorizationException`                           |

---

## 📝 Complete Example

```typescript
import {
  WynkFactory,
  DetailedErrorFormatter, // Formatter
  DatabaseExceptionFilter, // Global filter
  NotFoundExceptionFilter, // Global filter (smart)
  GlobalExceptionFilter, // Global filter
  AuthenticationException, // Route-specific filter
  NotFoundException, // Exception class
  UseFilters, // Decorator
} from "wynkjs";

// 1. Create app with validation formatter
const app = WynkFactory.create({
  controllers: [UserController, AuthController],
  validationErrorFormatter: new DetailedErrorFormatter(), // For validation errors
});

// 2. Register global exception filters
app.useGlobalFilters(
  new DatabaseExceptionFilter(), // DB errors
  new NotFoundExceptionFilter(), // Smart 404 handling
  new GlobalExceptionFilter() // Catch-all
);

// 3. Use route-specific filters where needed
@UseFilters(AuthenticationException)
@Controller("/auth")
export class AuthController {
  @Post("/login")
  async login() {
    throw new NotFoundException("Invalid credentials");
  }
}
```

---

## 🔔 Core Framework Updates (recent)

This project recently updated the WynkJS core. Below are the key runtime and testing changes you should know about.

- **Guards as decorators and middleware**: Guards now support both middleware-style functions (e.g. `jwtGuard`) and class-based decorator usage via an instance `canActivate(context)` method. Use `@UseGuards(AuthGuard)` on controllers or methods to run the guard and attach an authenticated user to the request.

- **Request user propagation**: When a guard verifies a token it attaches the authenticated user to the request/context (`request.user`). Controller handlers should read the authenticated user directly from the request instead of re-parsing the `Authorization` header.

- **Auth utilities**: The `AuthGuard` exposes a verification helper that accepts tokens from header, cookie, or request body. It also validates token expiry (`exp`) during verification.

- **Controller examples**: Example endpoints now include runtime helpers used in tests:

  - `GET /auth/whoami` — reads `request.user` (protected by `@UseGuards(AuthGuard)`).
  - `GET /auth/me` — reads from `request.user` (works with cookie or header flows).
  - `POST /auth/verify` — accepts token via body/header/cookie and returns `user` information.

- **Dependency injection & testing**: The core uses `tsyringe` for DI. Tests register mock provider classes with the DI container to avoid starting real DB services. When writing integration tests that start the example app, prefer registering `MockAuthService` replacements so tests don't require database initialization or `onModuleInit` lifecycle for DB providers.

- **reflect-metadata**: Some test files require `import "reflect-metadata"` at the top when using DI/reflection. Add it to any test that bootstraps DI-managed providers under Bun.

- **Test runner and environment**: The project test suite runs with Bun's test runner. Keep tests and spawn scripts free of Node-only preload hooks like `ts-node/register` (avoid `import "dotenv/config"` or `-r ts-node/register` in tests that run under Bun). Use environment setup in CI or test harness instead.

- **Lifecycle error handling**: `WynkFactory` provider lifecycle methods (`onModuleInit`, `onModuleDestroy`) are exercised in tests. The factory handles provider failures during init/destroy; tests assert that the factory continues cleanup on destroy even if one provider throws.

- **CI integration**: A GitHub Actions workflow was added at `.github/workflows/ci.yml` to install Bun, run `bun install`, and execute `bun test tests/ --coverage`. The workflow uploads test artifacts (JUnit/coverage) for further inspection.

---

If you'd like, I can also:

- Add an architecture diagram (SVG) showing request flow (client → rate-limit → jwt guard → controller) and DI wiring.
- Produce a short migration note for `example/README.md` describing how to adapt older controllers to `request.user`.

---

## ✅ Testing Checklist

- [ ] Build completes: `npm run build`
- [ ] Formatters work in validation errors
- [ ] Global filters catch appropriate exceptions
- [ ] Smart NotFoundExceptionFilter works correctly
- [ ] Route-specific filters only affect their routes
- [ ] Example app runs: `cd example && npm run dev`

---

## 🎉 Benefits of This Structure

1. **Clear Separation**: Formatters ≠ Filters
2. **Global Safety**: Only safe filters in `filters/` folder
3. **Route Flexibility**: Use specific filters on specific routes
4. **Easy Import**: Import from `'wynkjs'` - no deep paths needed
5. **Type Safety**: All properly typed with TypeScript

---

## 📁 Recommended Project Structure

When building WynkJS applications, follow this **module-based organization**:

```
my-wynkjs-app/
├── src/
│   ├── modules/
│   │   ├── user/
│   │   │   ├── user.controller.ts    # Controller with routes
│   │   │   ├── user.service.ts       # Business logic
│   │   │   ├── user.dto.ts           # Validation schemas with custom errors
│   │   │   ├── user.controller.test.ts  # Unit tests
│   │   │   └── user.service.test.ts     # Unit tests
│   │   └── product/
│   │       ├── product.controller.ts
│   │       ├── product.service.ts
│   │       ├── product.dto.ts
│   │       └── *.test.ts
│   ├── filters/
│   │   └── custom.filter.ts         # Your custom global filters
│   ├── guards/
│   │   └── auth.guard.ts            # Authentication/authorization guards
│   ├── interceptors/
│   │   └── logging.interceptor.ts   # Request/response interceptors
│   ├── e2e/
│   │   └── *.e2e.test.ts            # End-to-end API tests
│   └── index.ts                      # Application bootstrap
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

**Key Benefits:**

- ✅ **Module Co-location**: Each feature has controller, service, DTO, and tests together
- ✅ **Easy Navigation**: Find all related files in one folder
- ✅ **Scalability**: Add new modules without affecting others
- ✅ **Generated by CLI**: Use `bunx create-wynkjs` to get this structure automatically
- ✅ **Test Organization**: Unit tests next to code, E2E tests separate

**DTO Best Practice:**

Always include custom error messages in your DTOs:

```typescript
// modules/user/user.dto.ts
import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.String({
    minLength: 2,
    maxLength: 50,
    error: "Name must be between 2 and 50 characters", // ✅ Custom error
  }),
  email: CommonDTO.Email({
    error: "Please provide a valid email address", // ✅ Custom error
  }),
  age: DTO.Optional(
    DTO.Number({
      minimum: 18,
      error: "Age must be at least 18 years", // ✅ Custom error
    })
  ),
});
```
