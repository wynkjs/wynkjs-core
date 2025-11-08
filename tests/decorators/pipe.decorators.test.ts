// @ts-nocheck
import { describe, expect, test, beforeEach } from "bun:test";
import "reflect-metadata";
import { container } from "tsyringe";
import {
  WynkFactory,
  Controller,
  Get,
  Post,
  Put,
  UsePipes,
  Injectable,
  Body,
  Param,
  Query,
} from "../../core";
import type { PipeContext } from "../../core/interfaces/pipe.interface";

// ============================================================================
// MOCK PIPES
// ============================================================================

@Injectable()
class ValidationPipe {
  async transform(value: any, context: PipeContext): Promise<any> {
    if (context.type === "body") {
      if (!value || typeof value !== "object") {
        throw new Error("Body must be an object");
      }

      if (value.email && !value.email.includes("@")) {
        throw new Error("Invalid email format");
      }

      if (value.age && (value.age < 0 || value.age > 150)) {
        throw new Error("Age must be between 0 and 150");
      }
    }

    return value;
  }
}

@Injectable()
class ParseIntPipe {
  async transform(value: any, context: PipeContext): Promise<number> {
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      throw new Error(`Cannot parse "${value}" to integer`);
    }

    return parsed;
  }
}

@Injectable()
class TrimPipe {
  async transform(value: any, context: PipeContext): Promise<any> {
    if (typeof value === "string") {
      return value.trim();
    }

    if (typeof value === "object" && value !== null) {
      const trimmed: any = {};
      for (const key in value) {
        if (typeof value[key] === "string") {
          trimmed[key] = value[key].trim();
        } else {
          trimmed[key] = value[key];
        }
      }
      return trimmed;
    }

    return value;
  }
}

@Injectable()
class UppercasePipe {
  async transform(value: any, context: PipeContext): Promise<any> {
    if (typeof value === "string") {
      return value.toUpperCase();
    }

    if (typeof value === "object" && value !== null) {
      const uppercased: any = {};
      for (const key in value) {
        if (typeof value[key] === "string") {
          uppercased[key] = value[key].toUpperCase();
        } else {
          uppercased[key] = value[key];
        }
      }
      return uppercased;
    }

    return value;
  }
}

@Injectable()
class DefaultValuePipe {
  private defaultValue: any;

  constructor(defaultValue: any = null) {
    this.defaultValue = defaultValue;
  }

  async transform(value: any, context: PipeContext): Promise<any> {
    if (value === undefined || value === null || value === "") {
      return this.defaultValue;
    }
    return value;
  }
}

@Injectable()
class ParseBoolPipe {
  async transform(value: any, context: PipeContext): Promise<boolean> {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "1" || lower === "yes") {
        return true;
      }
      if (lower === "false" || lower === "0" || lower === "no") {
        return false;
      }
    }

    throw new Error(`Cannot parse "${value}" to boolean`);
  }
}

@Injectable()
class SanitizePipe {
  async transform(value: any, context: PipeContext): Promise<any> {
    if (typeof value === "string") {
      // Remove potentially dangerous characters
      return value
        .replace(/[<>]/g, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+=/gi, "");
    }

    if (typeof value === "object" && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        if (typeof value[key] === "string") {
          sanitized[key] = value[key]
            .replace(/[<>]/g, "")
            .replace(/javascript:/gi, "")
            .replace(/on\w+=/gi, "");
        } else {
          sanitized[key] = value[key];
        }
      }
      return sanitized;
    }

    return value;
  }
}

@Injectable()
class TransformObjectPipe {
  async transform(value: any, context: PipeContext): Promise<any> {
    if (typeof value === "object" && value !== null) {
      return {
        ...value,
        transformed: true,
        timestamp: Date.now(),
      };
    }
    return value;
  }
}

@Injectable()
class RequiredPipe {
  async transform(value: any, context: PipeContext): Promise<any> {
    if (value === undefined || value === null || value === "") {
      throw new Error(
        `${context.key || "Value"} is required but was ${value}`
      );
    }
    return value;
  }
}

@Injectable()
class ArrayPipe {
  async transform(value: any, context: PipeContext): Promise<any[]> {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim());
    }

    return [value];
  }
}

// ============================================================================
// PIPE DECORATOR TESTS
// ============================================================================

describe("Pipe Decorators", () => {
  beforeEach(() => {
    container.clearInstances();
  });

  // ==========================================================================
  // SINGLE PIPE TESTS
  // ==========================================================================

  describe("Single Pipe", () => {
    test("should apply validation pipe to body", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Post({ path: "/" })
        @UsePipes(ValidationPipe)
        createUser(@Body() data: any) {
          return { created: true, data };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      // Valid data
      const validResponse = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", age: 25 }),
        })
      );
      expect(validResponse.status).toBe(200);

      // Invalid email
      const invalidEmailResponse = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "invalid-email", age: 25 }),
        })
      );
      expect(invalidEmailResponse.status).toBe(500);

      // Invalid age
      const invalidAgeResponse = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", age: 200 }),
        })
      );
      expect(invalidAgeResponse.status).toBe(500);
    });

    test("should apply ParseInt pipe to param", async () => {
      @Controller({ path: "/items" })
      class ItemController {
        @Get({ path: "/:id" })
        @UsePipes(ParseIntPipe)
        getItem(@Param("id") id: number) {
          return { id, type: typeof id };
        }
      }

      const app = WynkFactory.create({
        controllers: [ItemController],
      });

      const response = await app.handle(
        new Request("http://localhost/items/123")
      );
      const data = await response.json();

      expect(data.id).toBe(123);
      expect(data.type).toBe("number");
    });

    test("should apply trim pipe to body", async () => {
      @Controller({ path: "/data" })
      class DataController {
        @Post({ path: "/" })
        @UsePipes(TrimPipe)
        createData(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [DataController],
      });

      const response = await app.handle(
        new Request("http://localhost/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  John  ", city: "  NYC  " }),
        })
      );
      const result = await response.json();

      expect(result.data.name).toBe("John");
      expect(result.data.city).toBe("NYC");
    });

    test("should apply uppercase pipe to query param", async () => {
      @Controller({ path: "/search" })
      class SearchController {
        @Get({ path: "/" })
        @UsePipes(UppercasePipe)
        search(@Query("q") query: string) {
          return { query };
        }
      }

      const app = WynkFactory.create({
        controllers: [SearchController],
      });

      const response = await app.handle(
        new Request("http://localhost/search?q=hello")
      );
      const data = await response.json();

      expect(data.query).toBe("HELLO");
    });

    test("should apply sanitize pipe to body", async () => {
      @Controller({ path: "/comments" })
      class CommentController {
        @Post({ path: "/" })
        @UsePipes(SanitizePipe)
        createComment(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [CommentController],
      });

      const response = await app.handle(
        new Request("http://localhost/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "<script>alert('xss')</script>Hello",
            link: "javascript:alert('xss')",
          }),
        })
      );
      const result = await response.json();

      expect(result.data.text).toBe("scriptalert('xss')/scriptHello");
      expect(result.data.link).toBe("alert('xss')");
    });
  });

  // ==========================================================================
  // MULTIPLE PIPES
  // ==========================================================================

  describe("Multiple Pipes", () => {
    test("should apply multiple pipes in order", async () => {
      @Controller({ path: "/transform" })
      class TransformController {
        @Post({ path: "/" })
        @UsePipes(TrimPipe, UppercasePipe)
        transform(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [TransformController],
      });

      const response = await app.handle(
        new Request("http://localhost/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "  hello world  " }),
        })
      );
      const result = await response.json();

      // TrimPipe first, then UppercasePipe
      expect(result.data.message).toBe("HELLO WORLD");
    });

    test("should chain validation and transformation pipes", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Post({ path: "/" })
        @UsePipes(ValidationPipe, TrimPipe, TransformObjectPipe)
        createUser(@Body() data: any) {
          return { user: data };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController],
      });

      const response = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: " test@example.com ",
            age: 25,
          }),
        })
      );
      const result = await response.json();

      expect(result.user.email).toBe("test@example.com");
      expect(result.user.transformed).toBe(true);
      expect(result.user.timestamp).toBeDefined();
    });

    test("should execute pipes in correct order", async () => {
      const executionOrder: string[] = [];

      @Injectable()
      class Pipe1 {
        async transform(value: any, context: PipeContext): Promise<any> {
          executionOrder.push("pipe1");
          return value;
        }
      }

      @Injectable()
      class Pipe2 {
        async transform(value: any, context: PipeContext): Promise<any> {
          executionOrder.push("pipe2");
          return value;
        }
      }

      @Injectable()
      class Pipe3 {
        async transform(value: any, context: PipeContext): Promise<any> {
          executionOrder.push("pipe3");
          return value;
        }
      }

      @Controller({ path: "/test" })
      class TestController {
        @Post({ path: "/" })
        @UsePipes(Pipe1, Pipe2, Pipe3)
        test(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      await app.handle(
        new Request("http://localhost/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: "data" }),
        })
      );

      expect(executionOrder).toEqual(["pipe1", "pipe2", "pipe3"]);
    });
  });

  // ==========================================================================
  // CONTROLLER-LEVEL PIPES
  // ==========================================================================

  describe("Controller-Level Pipes", () => {
    test("should apply pipe to all controller methods", async () => {
      @Controller({ path: "/api" })
      @UsePipes(TrimPipe)
      class ApiController {
        @Post({ path: "/users" })
        createUser(@Body() data: any) {
          return { user: data };
        }

        @Put({ path: "/users/:id" })
        updateUser(@Param("id") id: string, @Body() data: any) {
          return { id, user: data };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      // Create user - should trim
      const createResponse = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  Alice  " }),
        })
      );
      const createData = await createResponse.json();
      expect(createData.user.name).toBe("Alice");

      // Update user - should also trim
      const updateResponse = await app.handle(
        new Request("http://localhost/api/users/123", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  Bob  " }),
        })
      );
      const updateData = await updateResponse.json();
      expect(updateData.user.name).toBe("Bob");
    });

    test("should combine controller and method pipes", async () => {
      @Controller({ path: "/data" })
      @UsePipes(TrimPipe)
      class DataController {
        @Post({ path: "/standard" })
        createStandard(@Body() data: any) {
          return { data };
        }

        @Post({ path: "/validated" })
        @UsePipes(ValidationPipe)
        createValidated(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [DataController],
      });

      // Standard: only trim
      const standardResponse = await app.handle(
        new Request("http://localhost/data/standard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "  hello  " }),
        })
      );
      const standardData = await standardResponse.json();
      expect(standardData.data.text).toBe("hello");

      // Validated: trim + validation (should reject invalid data)
      const invalidResponse = await app.handle(
        new Request("http://localhost/data/validated", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "invalid" }),
        })
      );
      expect(invalidResponse.status).toBe(500);
    });
  });

  // ==========================================================================
  // GLOBAL PIPES
  // ==========================================================================

  describe("Global Pipes", () => {
    test("should apply global pipe to all routes", async () => {
      @Controller({ path: "/users" })
      class UserController {
        @Post({ path: "/" })
        createUser(@Body() data: any) {
          return { data };
        }
      }

      @Controller({ path: "/posts" })
      class PostController {
        @Post({ path: "/" })
        createPost(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [UserController, PostController],
      });

      app.useGlobalPipes(TrimPipe);

      await app.build();

      // Both routes should trim data
      const userResponse = await app.handle(
        new Request("http://localhost/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "  Alice  " }),
        })
      );
      const userData = await userResponse.json();
      expect(userData.data.name).toBe("Alice");

      const postResponse = await app.handle(
        new Request("http://localhost/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "  Post  " }),
        })
      );
      const postData = await postResponse.json();
      expect(postData.data.title).toBe("Post");
    });

    test("should combine global and method pipes", async () => {
      @Controller({ path: "/api" })
      class ApiController {
        @Post({ path: "/basic" })
        createBasic(@Body() data: any) {
          return { data };
        }

        @Post({ path: "/enhanced" })
        @UsePipes(TransformObjectPipe)
        createEnhanced(@Body() data: any) {
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [ApiController],
      });

      app.useGlobalPipes(TrimPipe);

      await app.build();

      // Basic: only global trim
      const basicResponse = await app.handle(
        new Request("http://localhost/api/basic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "  hello  " }),
        })
      );
      const basicData = await basicResponse.json();
      expect(basicData.data.text).toBe("hello");
      expect(basicData.data.transformed).toBeUndefined();

      // Enhanced: global trim + method transform
      const enhancedResponse = await app.handle(
        new Request("http://localhost/api/enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "  hello  " }),
        })
      );
      const enhancedData = await enhancedResponse.json();
      expect(enhancedData.data.text).toBe("hello");
      expect(enhancedData.data.transformed).toBe(true);
    });
  });

  // ==========================================================================
  // TYPE CONVERSION PIPES
  // ==========================================================================

  describe("Type Conversion Pipes", () => {
    test("should parse integer from param", async () => {
      @Controller({ path: "/products" })
      class ProductController {
        @Get({ path: "/:id" })
        @UsePipes(ParseIntPipe)
        getProduct(@Param("id") id: number) {
          return { id, doubled: id * 2 };
        }
      }

      const app = WynkFactory.create({
        controllers: [ProductController],
      });

      const response = await app.handle(
        new Request("http://localhost/products/42")
      );
      const data = await response.json();

      expect(data.id).toBe(42);
      expect(data.doubled).toBe(84);
    });

    test("should parse boolean from query", async () => {
      @Controller({ path: "/settings" })
      class SettingsController {
        @Get({ path: "/" })
        @UsePipes(ParseBoolPipe)
        getSettings(@Query("enabled") enabled: boolean) {
          return { enabled, type: typeof enabled };
        }
      }

      const app = WynkFactory.create({
        controllers: [SettingsController],
      });

      // True values
      const trueResponses = await Promise.all([
        app.handle(new Request("http://localhost/settings?enabled=true")),
        app.handle(new Request("http://localhost/settings?enabled=1")),
        app.handle(new Request("http://localhost/settings?enabled=yes")),
      ]);

      for (const response of trueResponses) {
        const data = await response.json();
        expect(data.enabled).toBe(true);
        expect(data.type).toBe("boolean");
      }

      // False values
      const falseResponse = await app.handle(
        new Request("http://localhost/settings?enabled=false")
      );
      const falseData = await falseResponse.json();
      expect(falseData.enabled).toBe(false);
    });

    test("should convert to array", async () => {
      @Controller({ path: "/tags" })
      class TagController {
        @Get({ path: "/" })
        @UsePipes(ArrayPipe)
        getTags(@Query("items") items: string[]) {
          return { items, count: items.length };
        }
      }

      const app = WynkFactory.create({
        controllers: [TagController],
      });

      const response = await app.handle(
        new Request("http://localhost/tags?items=tag1,tag2,tag3")
      );
      const data = await response.json();

      expect(data.items).toEqual(["tag1", "tag2", "tag3"]);
      expect(data.count).toBe(3);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    test("should throw error when pipe fails", async () => {
      @Controller({ path: "/numbers" })
      class NumberController {
        @Get({ path: "/:id" })
        @UsePipes(ParseIntPipe)
        getNumber(@Param("id") id: number) {
          return { id };
        }
      }

      const app = WynkFactory.create({
        controllers: [NumberController],
      });

      const response = await app.handle(
        new Request("http://localhost/numbers/abc")
      );

      expect(response.status).toBe(500);
    });

    test("should throw error when required value is missing", async () => {
      @Controller({ path: "/required" })
      class RequiredController {
        @Post({ path: "/" })
        @UsePipes(RequiredPipe)
        create(@Body("name") name: string) {
          return { name };
        }
      }

      const app = WynkFactory.create({
        controllers: [RequiredController],
      });

      const response = await app.handle(
        new Request("http://localhost/required", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(500);
    });

    test("should stop execution if pipe throws", async () => {
      let handlerCalled = false;

      @Controller({ path: "/validate" })
      class ValidateController {
        @Post({ path: "/" })
        @UsePipes(ValidationPipe)
        create(@Body() data: any) {
          handlerCalled = true;
          return { data };
        }
      }

      const app = WynkFactory.create({
        controllers: [ValidateController],
      });

      await app.handle(
        new Request("http://localhost/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "invalid" }),
        })
      );

      expect(handlerCalled).toBe(false);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    test("should handle empty pipe array", async () => {
      @Controller({ path: "/test" })
      class TestController {
        @Get({ path: "/" })
        @UsePipes()
        getData() {
          return { data: "test" };
        }
      }

      const app = WynkFactory.create({
        controllers: [TestController],
      });

      const response = await app.handle(new Request("http://localhost/test"));
      const data = await response.json();

      expect(data).toEqual({ data: "test" });
    });

    test("should handle pipe with default value", async () => {
      @Controller({ path: "/defaults" })
      class DefaultController {
        @Get({ path: "/" })
        @UsePipes(new DefaultValuePipe("default-value"))
        getData(@Query("value") value: string) {
          return { value };
        }
      }

      const app = WynkFactory.create({
        controllers: [DefaultController],
      });

      // Without query param
      const response = await app.handle(
        new Request("http://localhost/defaults")
      );
      const data = await response.json();

      expect(data.value).toBe("default-value");
    });

    test("should handle pipe returning null", async () => {
      @Injectable()
      class NullPipe {
        async transform(value: any, context: PipeContext): Promise<any> {
          return null;
        }
      }

      @Controller({ path: "/null" })
      class NullController {
        @Get({ path: "/" })
        @UsePipes(NullPipe)
        getData(@Query("value") value: any) {
          return { value, isNull: value === null };
        }
      }

      const app = WynkFactory.create({
        controllers: [NullController],
      });

      const response = await app.handle(
        new Request("http://localhost/null?value=test")
      );
      const data = await response.json();

      expect(data.value).toBe(null);
      expect(data.isNull).toBe(true);
    });

    test("should handle pipe with complex transformation", async () => {
      @Injectable()
      class ComplexPipe {
        async transform(value: any, context: PipeContext): Promise<any> {
          if (typeof value === "object" && value !== null) {
            return {
              original: value,
              keys: Object.keys(value),
              values: Object.values(value),
              entries: Object.entries(value).length,
            };
          }
          return value;
        }
      }

      @Controller({ path: "/complex" })
      class ComplexController {
        @Post({ path: "/" })
        @UsePipes(ComplexPipe)
        process(@Body() data: any) {
          return { processed: data };
        }
      }

      const app = WynkFactory.create({
        controllers: [ComplexController],
      });

      const response = await app.handle(
        new Request("http://localhost/complex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a: 1, b: 2, c: 3 }),
        })
      );
      const result = await response.json();

      expect(result.processed.keys).toEqual(["a", "b", "c"]);
      expect(result.processed.values).toEqual([1, 2, 3]);
      expect(result.processed.entries).toBe(3);
    });
  });
});
