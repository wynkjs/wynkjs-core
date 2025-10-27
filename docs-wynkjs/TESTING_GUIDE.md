# Testing Guide

WynkJS includes a built-in testing module designed to work seamlessly with Bun's built-in test runner.

## Overview

- **No Jest required** - Uses Bun's built-in test runner (faster and lighter)
- **Isolated DI containers** - Each test gets its own dependency injection container
- **Mock utilities** - Built-in tools for creating mocks and spies
- **Auto-generated tests** - wynkjs-cli generates test files automatically

## Quick Start

### 1. Generated Tests

When you generate a module with `wynkjs-cli`, test files are automatically created:

```bash
wynkjs g m product

# Creates:
# src/modules/product/
#   ├── product.controller.ts
#   ├── product.controller.test.ts  ✨
#   ├── product.service.ts
#   ├── product.service.test.ts     ✨
#   └── product.dto.ts
```

### 2. Run Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/modules/product/product.service.test.ts

# Run tests in a directory
bun test src/modules/product/

# Watch mode
bun test --watch
```

## Testing Services

### Basic Service Test

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe("findAll", () => {
    it("should return an empty array initially", () => {
      const result = service.findAll();

      expect(result).toBeArray();
      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new user", () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
      };

      const result = service.create(userData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
    });
  });
});
```

### Service with Dependencies

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { UserService } from "./user.service";
import { EmailService } from "./email.service";

describe("UserService", () => {
  let userService: UserService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, EmailService],
    }).compile();

    userService = module.get<UserService>(UserService);
    emailService = module.get<EmailService>(EmailService);
  });

  it("should send welcome email when creating user", async () => {
    // Spy on email service method
    const sendEmailSpy = MockFactory.createSpy();
    emailService.sendWelcomeEmail = sendEmailSpy;

    const userData = { name: "John", email: "john@example.com" };
    await userService.create(userData);

    // Verify email was sent
    expect(sendEmailSpy.calls).toHaveLength(1);
    expect(sendEmailSpy.calls[0][0]).toBe(userData.email);
  });
});
```

## Testing Controllers

### Basic Controller Test

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const result = await controller.findAll();

      expect(result).toBeDefined();
      expect(result.data).toBeArray();
    });
  });

  describe("findOne", () => {
    it("should return a single user", async () => {
      // Create a test user
      const user = service.create({
        name: "John",
        email: "john@example.com",
      });

      const result = await controller.findOne(user.id);

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(user.id);
    });

    it("should throw NotFoundException when user not found", async () => {
      expect(async () => {
        await controller.findOne("nonexistent-id");
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createDto = {
        name: "Jane",
        email: "jane@example.com",
      };

      const result = await controller.create(createDto);

      expect(result.message).toBe("User created successfully");
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(createDto.name);
    });
  });
});
```

### Controller with Mocked Service

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController with Mocks", () => {
  let controller: UserController;
  let mockService: any;

  beforeEach(async () => {
    // Create a mock service
    mockService = MockFactory.createMock({
      findAll: () => [
        { id: "1", name: "User 1", email: "user1@example.com" },
        { id: "2", name: "User 2", email: "user2@example.com" },
      ],
      findById: (id: string) => ({
        id,
        name: "Test User",
        email: "test@example.com",
      }),
      create: (data: any) => ({ id: "new-id", ...data }),
    });

    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it("should use mocked service", async () => {
    const result = await controller.findAll();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe("User 1");
  });
});
```

## Testing Utilities

### Mock Request/Response

```typescript
import { createMockRequest, createMockResponse } from "wynkjs";

describe("Middleware", () => {
  it("should process request", async () => {
    const req = createMockRequest({
      method: "POST",
      url: "/users",
      body: { name: "John" },
      headers: { "content-type": "application/json" },
    });

    const res = createMockResponse();

    // Test your middleware
    await myMiddleware(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });
});
```

### Mock Execution Context

```typescript
import { createMockExecutionContext } from "wynkjs";

describe("Guard", () => {
  it("should allow authorized requests", async () => {
    const context = createMockExecutionContext(
      createMockRequest({
        headers: { authorization: "Bearer valid-token" },
      })
    );

    const result = await authGuard.canActivate(context);

    expect(result).toBe(true);
  });
});
```

### Creating Spies

```typescript
import { MockFactory } from "wynkjs";

describe("Service with Spy", () => {
  it("should track method calls", () => {
    const spy = MockFactory.createSpy((x: number) => x * 2);

    const result1 = spy(5);
    const result2 = spy(10);

    expect(result1).toBe(10);
    expect(result2).toBe(20);
    expect(spy.calls).toHaveLength(2);
    expect(spy.calls[0]).toEqual([5]);
    expect(spy.calls[1]).toEqual([10]);
  });
});
```

## Best Practices

### 1. Use `beforeEach` for Setup

Always create a fresh testing module in `beforeEach` to ensure test isolation:

```typescript
beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [MyService],
  }).compile();

  service = module.get<MyService>(MyService);
});
```

### 2. Test One Thing at a Time

Each test should verify a single behavior:

```typescript
// ✅ Good - tests one specific behavior
it("should return 404 when user not found", async () => {
  expect(async () => {
    await controller.findOne("invalid-id");
  }).toThrow(NotFoundException);
});

// ❌ Bad - tests multiple things
it("should handle users correctly", async () => {
  // Creates user, updates user, deletes user all in one test
});
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good
it("should throw NotFoundException when user with given id does not exist", () => {});

// ❌ Bad
it("should work", () => {});
```

### 4. Clean Up After Tests

```typescript
afterEach(async () => {
  await module.close(); // Clean up DI container
});
```

### 5. Group Related Tests

```typescript
describe("UserService", () => {
  describe("findAll", () => {
    it("should return empty array initially", () => {});
    it("should return all users", () => {});
  });

  describe("create", () => {
    it("should create a new user", () => {});
    it("should generate unique id", () => {});
  });
});
```

## Testing HTTP Endpoints (Integration Tests)

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { WynkFactory } from "wynkjs";
import { UserController } from "./user.controller";

describe("User API Integration Tests", () => {
  let app: any;
  const PORT = 3001;

  beforeAll(async () => {
    app = WynkFactory.create({
      controllers: [UserController],
    });
    await app.listen(PORT);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should create a user", async () => {
    const response = await fetch(`http://localhost:${PORT}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("User created successfully");
  });

  it("should get all users", async () => {
    const response = await fetch(`http://localhost:${PORT}/users`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeArray();
  });
});
```

## Running Tests in CI/CD

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun test
```

## Bun Test Runner Features

Bun's built-in test runner is **fast** and has many features:

```bash
# Run tests
bun test

# Watch mode
bun test --watch

# Run specific test
bun test user.service.test.ts

# Coverage (coming soon in Bun)
bun test --coverage

# Bail on first failure
bun test --bail

# Run tests in parallel
bun test --parallel
```

## Matchers

Bun test includes these matchers:

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(number);
expect(value).toBeLessThan(number);
expect(value).toBeCloseTo(number);

// Arrays
expect(array).toHaveLength(number);
expect(array).toContain(item);
expect(array).toBeArray();

// Objects
expect(obj).toHaveProperty("key");
expect(obj).toMatchObject({ key: value });

// Functions
expect(fn).toThrow();
expect(fn).toThrow(Error);
expect(fn).toThrow("error message");

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Common Testing Patterns

### Testing Async Methods

```typescript
it("should handle async operations", async () => {
  const result = await service.fetchData();
  expect(result).toBeDefined();
});
```

### Testing Error Handling

```typescript
it("should throw error for invalid input", () => {
  expect(() => {
    service.process(null);
  }).toThrow("Invalid input");
});
```

### Testing with Timeouts

```typescript
it("should complete within time limit", async () => {
  const start = Date.now();
  await service.longRunningOperation();
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(1000); // Less than 1 second
});
```

## Summary

- ✅ Use `Test.createTestingModule()` for isolated testing
- ✅ Generate tests automatically with `wynkjs-cli`
- ✅ Use Bun's built-in test runner (no Jest needed)
- ✅ Mock dependencies with `MockFactory`
- ✅ Write descriptive test names
- ✅ Keep tests simple and focused
- ✅ Test one behavior per test
- ✅ Clean up after tests with `afterEach`

Happy testing! 🧪
