# Testing Guide

Comprehensive testing guide for WynkJS applications using Bun's built-in test runner.

## Table of Contents

- [Getting Started](#getting-started)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Testing Controllers](#testing-controllers)
- [Testing Services](#testing-services)
- [Testing Guards & Middleware](#testing-guards--middleware)
- [Testing Exception Filters](#testing-exception-filters)
- [Testing DTOs](#testing-dtos)
- [Mocking & Spies](#mocking--spies)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)

---

## Getting Started

### Installation

WynkJS uses Bun's built-in test runner - no additional dependencies needed!

```bash
# Run all tests
bun test

# Run specific test file
bun test src/user.test.ts

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test File Structure

```
my-wynkjs-app/
├── src/
│   ├── modules/
│   │   └── user/
│   │       ├── user.controller.ts
│   │       ├── user.controller.test.ts    # Unit tests
│   │       ├── user.service.ts
│   │       ├── user.service.test.ts       # Unit tests
│   │       └── user.dto.ts
│   ├── e2e/
│   │   └── user.e2e.test.ts               # E2E tests
│   └── index.ts
```

---

## Unit Testing

### Testing Services

```typescript
// user.service.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { UserService } from "./user.service";

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe("findAll", () => {
    test("should return an array of users", async () => {
      const users = await userService.findAll();

      expect(users).toBeArray();
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe("findOne", () => {
    test("should return a user by id", async () => {
      const user = await userService.findOne("1");

      expect(user).toHaveProperty("id");
      expect(user.id).toBe("1");
      expect(user).toHaveProperty("name");
    });

    test("should throw NotFoundException for invalid id", async () => {
      expect(async () => {
        await userService.findOne("nonexistent");
      }).toThrow("User not found");
    });
  });

  describe("create", () => {
    test("should create a new user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const user = await userService.create(userData);

      expect(user).toHaveProperty("id");
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
    });

    test("should reject duplicate email", async () => {
      const userData = {
        name: "Jane Doe",
        email: "existing@example.com",
      };

      expect(async () => {
        await userService.create(userData);
      }).toThrow("Email already exists");
    });
  });
});
```

### Testing with Dependency Injection

```typescript
// email.service.test.ts
import { describe, test, expect, mock } from "bun:test";
import { EmailService } from "./email.service";
import { UserService } from "./user.service";

describe("UserService with EmailService", () => {
  test("should send welcome email after user creation", async () => {
    // Create a mock email service
    const mockEmailService = {
      sendWelcomeEmail: mock(async () => {
        return Promise.resolve();
      }),
    };

    // Inject mock into UserService
    const userService = new UserService(mockEmailService as any);

    const userData = {
      name: "John",
      email: "john@example.com",
    };

    await userService.create(userData);

    // Verify email was sent
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
      "john@example.com",
      "John"
    );
  });
});
```

---

## Integration Testing

### Testing Controllers with WynkFactory

```typescript
// user.controller.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WynkFactory } from "wynkjs";
import { UserController } from "./user.controller";

describe("UserController (Integration)", () => {
  let app: any;
  let baseURL: string;

  beforeAll(async () => {
    // Create test app
    app = WynkFactory.create({
      controllers: [UserController],
    });

    // Start server on random port
    await app.listen(0); // Port 0 = random available port
    baseURL = `http://localhost:${app.server.port}`;
  });

  afterAll(async () => {
    // Stop server after tests
    app.stop();
  });

  describe("GET /users", () => {
    test("should return list of users", async () => {
      const response = await fetch(`${baseURL}/users`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("users");
      expect(data.users).toBeArray();
    });
  });

  describe("POST /users", () => {
    test("should create a new user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const response = await fetch(`${baseURL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("message", "User created");
      expect(data.data.name).toBe(userData.name);
    });

    test("should reject invalid data", async () => {
      const invalidData = {
        name: "J", // Too short
        email: "invalid-email",
        age: 15, // Too young
      };

      const response = await fetch(`${baseURL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidData),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("message", "Validation failed");
      expect(data.errors).toBeArray();
    });
  });

  describe("GET /users/:id", () => {
    test("should return user by id", async () => {
      const response = await fetch(`${baseURL}/users/1`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toHaveProperty("id", "1");
    });

    test("should return 404 for nonexistent user", async () => {
      const response = await fetch(`${baseURL}/users/nonexistent`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("message");
    });
  });
});
```

---

## E2E Testing

End-to-end tests verify complete user workflows:

```typescript
// e2e/auth-flow.e2e.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WynkFactory } from "wynkjs";
import { UserController } from "../modules/user/user.controller";
import { AuthController } from "../modules/auth/auth.controller";

describe("Authentication Flow (E2E)", () => {
  let app: any;
  let baseURL: string;
  let authToken: string;

  beforeAll(async () => {
    app = WynkFactory.create({
      controllers: [UserController, AuthController],
    });
    await app.listen(0);
    baseURL = `http://localhost:${app.server.port}`;
  });

  afterAll(() => {
    app.stop();
  });

  test("Complete user registration and login flow", async () => {
    // 1. Register a new user
    const registerData = {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: "password123",
    };

    const registerResponse = await fetch(`${baseURL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    expect(registerResponse.status).toBe(201);
    const registerResult = await registerResponse.json();
    expect(registerResult).toHaveProperty("message", "User registered");

    // 2. Login with new credentials
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: registerData.email,
        password: registerData.password,
      }),
    });

    expect(loginResponse.status).toBe(200);
    const loginResult = await loginResponse.json();
    expect(loginResult).toHaveProperty("token");
    authToken = loginResult.token;

    // 3. Access protected route with token
    const profileResponse = await fetch(`${baseURL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(profileResponse.status).toBe(200);
    const profileResult = await profileResponse.json();
    expect(profileResult.user.email).toBe(registerData.email);

    // 4. Try accessing protected route without token
    const unauthorizedResponse = await fetch(`${baseURL}/auth/profile`);
    expect(unauthorizedResponse.status).toBe(401);
  });
});
```

---

## Testing Controllers

### Controller Unit Tests

Test controller methods in isolation:

```typescript
// user.controller.unit.test.ts
import { describe, test, expect, mock } from "bun:test";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController (Unit)", () => {
  test("list should return users from service", async () => {
    // Mock service
    const mockService = {
      findAll: mock(async () => [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ]),
    };

    const controller = new UserController(mockService as any);
    const result = await controller.list();

    expect(mockService.findAll).toHaveBeenCalledTimes(1);
    expect(result.users).toHaveLength(2);
  });

  test("create should call service with correct data", async () => {
    const mockService = {
      create: mock(async (data: any) => ({ id: "1", ...data })),
    };

    const controller = new UserController(mockService as any);
    const userData = { name: "John", email: "john@example.com" };

    await controller.create(userData);

    expect(mockService.create).toHaveBeenCalledWith(userData);
  });
});
```

---

## Testing Services

### Service with Database

```typescript
// user.service.test.ts with database
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { UserService } from "./user.service";
import { DatabaseService } from "../../database/database.service";

describe("UserService with Database", () => {
  let userService: UserService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    // Use test database
    process.env.DATABASE_URL = "sqlite::memory:";
    dbService = new DatabaseService();
    await dbService.onModuleInit();

    userService = new UserService(dbService);

    // Seed test data
    await dbService.db.insert(userTable).values([
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ]);
  });

  afterEach(async () => {
    // Clean up database
    await dbService.db.delete(userTable);
    await dbService.onModuleDestroy();
  });

  test("should find all users from database", async () => {
    const users = await userService.findAll();

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("Alice");
  });

  test("should create user in database", async () => {
    const newUser = {
      name: "Charlie",
      email: "charlie@example.com",
    };

    const created = await userService.create(newUser);

    expect(created).toHaveProperty("id");
    expect(created.name).toBe(newUser.name);

    // Verify in database
    const users = await userService.findAll();
    expect(users).toHaveLength(3);
  });
});
```

---

## Testing Guards & Middleware

```typescript
// auth.guard.test.ts
import { describe, test, expect, mock } from "bun:test";
import { jwtAuthGuard } from "./auth.guard";

describe("JWT Auth Guard", () => {
  test("should allow request with valid token", async () => {
    const mockContext = {
      headers: {
        authorization: "Bearer valid-jwt-token",
      },
      user: null,
    };

    const mockNext = mock(() => ({ success: true }));

    const result = await jwtAuthGuard(mockContext, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockContext.user).toBeTruthy();
  });

  test("should reject request without token", async () => {
    const mockContext = {
      headers: {},
    };

    const mockNext = mock(() => ({}));

    expect(async () => {
      await jwtAuthGuard(mockContext, mockNext);
    }).toThrow("Unauthorized");

    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should reject request with invalid token", async () => {
    const mockContext = {
      headers: {
        authorization: "Bearer invalid-token",
      },
    };

    const mockNext = mock(() => ({}));

    expect(async () => {
      await jwtAuthGuard(mockContext, mockNext);
    }).toThrow();
  });
});
```

---

## Testing Exception Filters

```typescript
// custom.filter.test.ts
import { describe, test, expect } from "bun:test";
import { CustomExceptionFilter } from "./custom.filter";
import { NotFoundException } from "wynkjs";

describe("CustomExceptionFilter", () => {
  const filter = new CustomExceptionFilter();

  test("should format NotFoundException correctly", () => {
    const exception = new NotFoundException("User not found");
    const mockContext = {
      getRequest: () => ({
        url: "/users/123",
        method: "GET",
      }),
    };

    const result = filter.catch(exception, mockContext as any);

    expect(result).toHaveProperty("statusCode", 404);
    expect(result).toHaveProperty("message", "User not found");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("path", "/users/123");
  });

  test("should handle unknown errors", () => {
    const exception = new Error("Unknown error");
    const mockContext = {
      getRequest: () => ({
        url: "/api/data",
        method: "POST",
      }),
    };

    const result = filter.catch(exception, mockContext as any);

    expect(result).toHaveProperty("statusCode", 500);
  });
});
```

---

## Testing DTOs

### Validation Testing

```typescript
// user.dto.test.ts
import { describe, test, expect } from "bun:test";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { CreateUserDTO } from "./user.dto";

describe("CreateUserDTO", () => {
  const validator = TypeCompiler.Compile(CreateUserDTO);

  test("should accept valid user data", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    };

    const result = validator.Check(validData);
    expect(result).toBe(true);
  });

  test("should reject invalid email", () => {
    const invalidData = {
      name: "John Doe",
      email: "invalid-email",
      age: 30,
    };

    const result = validator.Check(invalidData);
    expect(result).toBe(false);

    const errors = [...validator.Errors(invalidData)];
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].path).toBe("/email");
  });

  test("should reject age below minimum", () => {
    const invalidData = {
      name: "Young User",
      email: "young@example.com",
      age: 15,
    };

    const result = validator.Check(invalidData);
    expect(result).toBe(false);

    const errors = [...validator.Errors(invalidData)];
    expect(errors.some((e) => e.path === "/age")).toBe(true);
  });

  test("should reject additional properties with Strict", () => {
    const invalidData = {
      name: "John",
      email: "john@example.com",
      age: 30,
      extraField: "should be removed",
    };

    // DTO.Strict() removes additional properties
    const result = validator.Check(invalidData);
    expect(result).toBe(true); // Accepts but strips extra field
  });
});
```

---

## Mocking & Spies

### Using Bun's Mock Functions

```typescript
import { describe, test, expect, mock, spyOn } from "bun:test";

describe("Mocking Examples", () => {
  test("mock function calls", async () => {
    const mockFn = mock((x: number) => x * 2);

    const result = mockFn(5);

    expect(result).toBe(10);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(5);
  });

  test("spy on object methods", async () => {
    const userService = {
      findAll: async () => [{ id: "1", name: "Alice" }],
    };

    const spy = spyOn(userService, "findAll");

    await userService.findAll();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("mock implementation", async () => {
    const mockFetch = mock(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: "mocked" }),
      })
    );

    globalThis.fetch = mockFetch as any;

    const response = await fetch("https://api.example.com");
    const data = await response.json();

    expect(data).toEqual({ data: "mocked" });
    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com");
  });
});
```

---

## Test Coverage

### Running Coverage Reports

```bash
# Generate coverage report
bun test --coverage

# Coverage output shows:
# - Lines covered
# - Branches covered
# - Functions covered
# - Statements covered
```

### Coverage Configuration

Create `bunfig.toml`:

```toml
[test]
coverage = true
coverageThreshold = 80
coverageReporter = ["text", "lcov", "html"]
```

### Viewing Coverage

```bash
# Generate HTML coverage report
bun test --coverage

# Open coverage report in browser
open coverage/index.html
```

---

## Best Practices

### Test Organization

1. **Co-locate tests**: Place test files next to source files
2. **Use descriptive names**: `user.service.test.ts`, `auth.e2e.test.ts`
3. **Group related tests**: Use `describe` blocks
4. **One assertion per test**: When possible, test one thing at a time

### Test Structure (AAA Pattern)

```typescript
test("should create user", async () => {
  // Arrange - Set up test data
  const userData = {
    name: "John",
    email: "john@example.com",
  };

  // Act - Execute the code under test
  const result = await userService.create(userData);

  // Assert - Verify the outcome
  expect(result).toHaveProperty("id");
  expect(result.name).toBe(userData.name);
});
```

### Use beforeEach/afterEach

```typescript
describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    // Set up before each test
    service = new UserService();
  });

  afterEach(() => {
    // Clean up after each test
    service = null;
  });

  test("test 1", () => {
    /* ... */
  });
  test("test 2", () => {
    /* ... */
  });
});
```

### Test Coverage Goals

- **Controllers**: 80%+ coverage
- **Services**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Critical paths**: 100% coverage (authentication, payments, etc.)

### What to Test

✅ **Do Test:**

- Business logic in services
- Controller request/response handling
- Validation logic
- Error handling
- Edge cases and boundary conditions
- Integration points
- Critical user flows (E2E)

❌ **Don't Test:**

- Framework internals (WynkJS, Elysia)
- Third-party libraries
- Trivial getters/setters
- Configuration files

### Test Data Management

```typescript
// test-helpers/fixtures.ts
export const userFixtures = {
  validUser: {
    name: "John Doe",
    email: "john@example.com",
    age: 30,
  },
  invalidUser: {
    name: "J",
    email: "invalid",
    age: 15,
  },
  adminUser: {
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
  },
};

// Use in tests
import { userFixtures } from "../test-helpers/fixtures";

test("should create user", async () => {
  const user = await userService.create(userFixtures.validUser);
  expect(user).toHaveProperty("id");
});
```

---

## Example: Complete Test Suite

```typescript
// user.test.ts - Complete example
import { describe, test, expect, beforeAll, afterAll, mock } from "bun:test";
import { WynkFactory } from "wynkjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("User Module", () => {
  // Unit Tests
  describe("UserService (Unit)", () => {
    let service: UserService;

    beforeAll(() => {
      service = new UserService();
    });

    test("should find all users", async () => {
      const users = await service.findAll();
      expect(users).toBeArray();
    });

    test("should create user", async () => {
      const data = { name: "John", email: "john@example.com" };
      const user = await service.create(data);
      expect(user).toHaveProperty("id");
    });
  });

  // Integration Tests
  describe("UserController (Integration)", () => {
    let app: any;
    let baseURL: string;

    beforeAll(async () => {
      app = WynkFactory.create({
        controllers: [UserController],
      });
      await app.listen(0);
      baseURL = `http://localhost:${app.server.port}`;
    });

    afterAll(() => {
      app.stop();
    });

    test("GET /users should return users", async () => {
      const response = await fetch(`${baseURL}/users`);
      expect(response.status).toBe(200);
    });

    test("POST /users should create user", async () => {
      const response = await fetch(`${baseURL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John",
          email: "john@example.com",
        }),
      });
      expect(response.status).toBe(201);
    });
  });
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Run tests with coverage
        run: bun test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Resources

- [Bun Test Runner Documentation](https://bun.sh/docs/cli/test)
- [WynkJS Testing Module](./core/testing/index.ts)
- [Example Tests](./example/src/)
- [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Happy Testing! 🧪**
