// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, it, expect } from "bun:test";
import { WynkFactory } from "../../core/factory";
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Options,
  Head,
  DTO,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  Header,
  Redirect,
} from "../../core";
import "reflect-metadata";

/**
 * HTTP Decorators Test Suite
 * Tests all HTTP method decorators with various scenarios:
 * - String path syntax
 * - Object path syntax
 * - DTO validation (body, params, query, headers, response)
 * - Route metadata
 * - Multiple routes per controller
 * - Nested paths
 */

describe("HTTP Decorators - Basic Path Syntax", () => {
  it("should register @Get with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Get("/users")
      async getUsers() {
        return { users: [] };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes).toBeDefined();
    expect(routes.length).toBe(1);
    expect(routes[0].method).toBe("GET");
    expect(routes[0].path).toBe("/users");
  });

  it("should register @Post with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Post("/users")
      async createUser() {
        return { created: true };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("POST");
  });

  it("should register @Put with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Put("/users/:id")
      async updateUser() {
        return { updated: true };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("PUT");
    expect(routes[0].path).toBe("/users/:id");
  });

  it("should register @Patch with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Patch("/users/:id")
      async patchUser() {
        return { patched: true };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("PATCH");
  });

  it("should register @Delete with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Delete("/users/:id")
      async deleteUser() {
        return { deleted: true };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("DELETE");
  });

  it("should register @Options with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Options("/users")
      async optionsUsers() {
        return { methods: ["GET", "POST"] };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("OPTIONS");
  });

  it("should register @Head with string path", async () => {
    @Controller("/api/test")
    class TestController {
      @Head("/users")
      async headUsers() {
        return {};
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("HEAD");
  });
});

describe("HTTP Decorators - Object Path Syntax", () => {
  it("should register @Get with object path", async () => {
    @Controller("/api/test")
    class TestController {
      @Get({ path: "/users" })
      async getUsers() {
        return { users: [] };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].path).toBe("/users");
  });

  it("should register @Post with object path", async () => {
    @Controller("/api/test")
    class TestController {
      @Post({ path: "/users" })
      async createUser() {
        return { created: true };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].method).toBe("POST");
  });

  it("should handle empty path (defaults to controller base path)", async () => {
    @Controller("/api/users")
    class TestController {
      @Get({ path: "/" })
      async getAll() {
        return { users: [] };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].path).toBe("/");
  });

  it("should handle undefined path in options", async () => {
    @Controller("/api/users")
    class TestController {
      @Get({})
      async getAll() {
        return { users: [] };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", TestController.prototype);
    expect(routes[0].path).toBe("");
  });
});

describe("HTTP Decorators - With Body DTO", () => {
  const CreateUserDTO = DTO.Object({
    name: DTO.String({ minLength: 2, maxLength: 50 }),
    email: DTO.String({ format: "email" }),
    age: DTO.Optional(DTO.Number({ minimum: 18 })),
  });

  it("should register @Post with body DTO", async () => {
    @Controller("/api/users")
    class UserController {
      @Post({ path: "/", body: CreateUserDTO })
      async create(@Body() data: any) {
        return { created: data };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.body).toBeDefined();
  });

  it("should register @Put with body DTO", async () => {
    @Controller("/api/users")
    class UserController {
      @Put({ path: "/:id", body: CreateUserDTO })
      async update(@Param("id") id: string, @Body() data: any) {
        return { updated: data };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.body).toBeDefined();
  });

  it("should register @Patch with partial body DTO", async () => {
    const PartialUpdateDTO = DTO.Object({
      name: DTO.Optional(DTO.String({ minLength: 2 })),
      email: DTO.Optional(DTO.String({ format: "email" })),
    });

    @Controller("/api/users")
    class UserController {
      @Patch({ path: "/:id", body: PartialUpdateDTO })
      async patch(@Param("id") id: string, @Body() data: any) {
        return { patched: data };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.body).toBeDefined();
  });

  it("should handle nested object DTO", async () => {
    const NestedDTO = DTO.Object({
      user: DTO.Object({
        name: DTO.String(),
        profile: DTO.Object({
          bio: DTO.String(),
          avatar: DTO.Optional(DTO.String({ format: "uri" })),
        }),
      }),
    });

    @Controller("/api/complex")
    class ComplexController {
      @Post({ path: "/nested", body: NestedDTO })
      async createNested(@Body() data: any) {
        return { created: data };
      }
    }

    const app = WynkFactory.create({ controllers: [ComplexController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ComplexController.prototype);
    expect(routes[0].options.body).toBeDefined();
  });

  it("should handle array DTO", async () => {
    const ArrayDTO = DTO.Object({
      users: DTO.Array(
        DTO.Object({
          name: DTO.String(),
          email: DTO.String({ format: "email" }),
        })
      ),
    });

    @Controller("/api/bulk")
    class BulkController {
      @Post({ path: "/users", body: ArrayDTO })
      async bulkCreate(@Body() data: any) {
        return { count: data.users.length };
      }
    }

    const app = WynkFactory.create({ controllers: [BulkController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", BulkController.prototype);
    expect(routes[0].options.body).toBeDefined();
  });
});

describe("HTTP Decorators - With Params DTO", () => {
  const UserIdDTO = DTO.Object({
    id: DTO.String({ minLength: 1 }),
  });

  const MultipleParamsDTO = DTO.Object({
    userId: DTO.String(),
    postId: DTO.String(),
  });

  it("should register @Get with params DTO", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/:id", params: UserIdDTO })
      async findOne(@Param("id") id: string) {
        return { user: { id } };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.params).toBeDefined();
  });

  it("should register @Delete with params DTO", async () => {
    @Controller("/api/users")
    class UserController {
      @Delete({ path: "/:id", params: UserIdDTO })
      async remove(@Param("id") id: string) {
        return { deleted: id };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.params).toBeDefined();
  });

  it("should handle multiple params", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/:userId/posts/:postId", params: MultipleParamsDTO })
      async getPost(
        @Param("userId") userId: string,
        @Param("postId") postId: string
      ) {
        return { userId, postId };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].path).toBe("/:userId/posts/:postId");
  });

  it("should handle numeric params with validation", async () => {
    const NumericParamsDTO = DTO.Object({
      id: DTO.Number({ minimum: 1 }),
    });

    @Controller("/api/items")
    class ItemController {
      @Get({ path: "/:id", params: NumericParamsDTO })
      async findOne(@Param("id") id: number) {
        return { item: { id } };
      }
    }

    const app = WynkFactory.create({ controllers: [ItemController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ItemController.prototype);
    expect(routes[0].options.params).toBeDefined();
  });
});

describe("HTTP Decorators - With Query DTO", () => {
  const QueryDTO = DTO.Object({
    page: DTO.Optional(DTO.Number({ minimum: 1 })),
    limit: DTO.Optional(DTO.Number({ minimum: 1, maximum: 100 })),
    search: DTO.Optional(DTO.String()),
  });

  const FilterDTO = DTO.Object({
    status: DTO.Optional(
      DTO.Union([DTO.Literal("active"), DTO.Literal("inactive")])
    ),
    sortBy: DTO.Optional(DTO.String()),
    order: DTO.Optional(DTO.Union([DTO.Literal("asc"), DTO.Literal("desc")])),
  });

  it("should register @Get with query DTO", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/", query: QueryDTO })
      async findAll(@Query() query: any) {
        return { users: [], pagination: query };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.query).toBeDefined();
  });

  it("should handle complex query filters", async () => {
    @Controller("/api/products")
    class ProductController {
      @Get({ path: "/", query: FilterDTO })
      async search(@Query() query: any) {
        return { products: [], filters: query };
      }
    }

    const app = WynkFactory.create({ controllers: [ProductController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ProductController.prototype);
    expect(routes[0].options.query).toBeDefined();
  });

  it("should handle boolean query params", async () => {
    const BooleanQueryDTO = DTO.Object({
      includeDeleted: DTO.Optional(DTO.Boolean()),
      verified: DTO.Optional(DTO.Boolean()),
    });

    @Controller("/api/users")
    class UserController {
      @Get({ path: "/", query: BooleanQueryDTO })
      async findAll(@Query() query: any) {
        return { users: [], filters: query };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.query).toBeDefined();
  });

  it("should handle array query params", async () => {
    const ArrayQueryDTO = DTO.Object({
      tags: DTO.Optional(DTO.Array(DTO.String())),
      ids: DTO.Optional(DTO.Array(DTO.Number())),
    });

    @Controller("/api/items")
    class ItemController {
      @Get({ path: "/", query: ArrayQueryDTO })
      async findByTags(@Query() query: any) {
        return { items: [], filters: query };
      }
    }

    const app = WynkFactory.create({ controllers: [ItemController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ItemController.prototype);
    expect(routes[0].options.query).toBeDefined();
  });
});

describe("HTTP Decorators - With Headers DTO", () => {
  const AuthHeadersDTO = DTO.Object({
    authorization: DTO.String({ pattern: "^Bearer " }),
  });

  const CustomHeadersDTO = DTO.Object({
    "x-api-key": DTO.String(),
    "x-request-id": DTO.Optional(DTO.String({ format: "uuid" })),
  });

  it("should register @Get with headers DTO", async () => {
    @Controller("/api/secure")
    class SecureController {
      @Get({ path: "/profile", headers: AuthHeadersDTO })
      async getProfile(@Headers() headers: any) {
        return { authenticated: true };
      }
    }

    const app = WynkFactory.create({ controllers: [SecureController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", SecureController.prototype);
    expect(routes[0].options.headers).toBeDefined();
  });

  it("should handle custom headers", async () => {
    @Controller("/api/v1")
    class ApiController {
      @Post({ path: "/data", headers: CustomHeadersDTO })
      async postData(@Headers() headers: any, @Body() data: any) {
        return { received: true };
      }
    }

    const app = WynkFactory.create({ controllers: [ApiController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ApiController.prototype);
    expect(routes[0].options.headers).toBeDefined();
  });

  it("should handle content-type header validation", async () => {
    const ContentTypeDTO = DTO.Object({
      "content-type": DTO.Literal("application/json"),
    });

    @Controller("/api/strict")
    class StrictController {
      @Post({ path: "/json-only", headers: ContentTypeDTO })
      async jsonOnly(@Body() data: any) {
        return data;
      }
    }

    const app = WynkFactory.create({ controllers: [StrictController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", StrictController.prototype);
    expect(routes[0].options.headers).toBeDefined();
  });
});

describe("HTTP Decorators - With Response DTO", () => {
  const UserResponseDTO = DTO.Object({
    id: DTO.String(),
    name: DTO.String(),
    email: DTO.String({ format: "email" }),
    createdAt: DTO.String({ format: "date-time" }),
  });

  const PaginatedResponseDTO = DTO.Object({
    data: DTO.Array(DTO.Any()),
    total: DTO.Number(),
    page: DTO.Number(),
    pageSize: DTO.Number(),
  });

  it("should register @Get with response DTO", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/:id", response: UserResponseDTO })
      async findOne(@Param("id") id: string) {
        return {
          id,
          name: "John Doe",
          email: "john@example.com",
          createdAt: new Date().toISOString(),
        };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", UserController.prototype);
    expect(routes[0].options.response).toBeDefined();
  });

  it("should handle paginated response DTO", async () => {
    @Controller("/api/items")
    class ItemController {
      @Get({ path: "/", response: PaginatedResponseDTO })
      async findAll() {
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 10,
        };
      }
    }

    const app = WynkFactory.create({ controllers: [ItemController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ItemController.prototype);
    expect(routes[0].options.response).toBeDefined();
  });

  it("should handle union response types", async () => {
    const UnionResponseDTO = DTO.Union([
      DTO.Object({ success: DTO.Literal(true), data: DTO.Any() }),
      DTO.Object({ success: DTO.Literal(false), error: DTO.String() }),
    ]);

    @Controller("/api/operations")
    class OperationController {
      @Post({ path: "/execute", response: UnionResponseDTO })
      async execute() {
        return { success: true, data: {} };
      }
    }

    const app = WynkFactory.create({ controllers: [OperationController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", OperationController.prototype);
    expect(routes[0].options.response).toBeDefined();
  });
});

describe("HTTP Decorators - All Options Combined", () => {
  it("should handle all RouteOptions together", async () => {
    const CompleteDTO = DTO.Object({ data: DTO.String() });
    const ParamsDTO = DTO.Object({ id: DTO.String() });
    const QueryDTO = DTO.Object({ expand: DTO.Optional(DTO.Boolean()) });
    const HeadersDTO = DTO.Object({ "x-api-key": DTO.String() });
    const ResponseDTO = DTO.Object({
      success: DTO.Boolean(),
      result: DTO.Any(),
    });

    @Controller("/api/complete")
    class CompleteController {
      @Post({
        path: "/:id",
        body: CompleteDTO,
        params: ParamsDTO,
        query: QueryDTO,
        headers: HeadersDTO,
        response: ResponseDTO,
      })
      async complete(
        @Param("id") id: string,
        @Body() body: any,
        @Query() query: any,
        @Headers() headers: any
      ) {
        return { success: true, result: { id, body, query, headers } };
      }
    }

    const app = WynkFactory.create({ controllers: [CompleteController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", CompleteController.prototype);
    expect(routes[0].options.body).toBeDefined();
    expect(routes[0].options.params).toBeDefined();
    expect(routes[0].options.query).toBeDefined();
    expect(routes[0].options.headers).toBeDefined();
    expect(routes[0].options.response).toBeDefined();
  });
});

describe("HTTP Decorators - Multiple Routes", () => {
  it("should register multiple routes in one controller", async () => {
    @Controller("/api/products")
    class ProductController {
      @Get({ path: "/" })
      async findAll() {
        return { products: [] };
      }

      @Get({ path: "/:id" })
      async findOne(@Param("id") id: string) {
        return { product: { id } };
      }

      @Post({ path: "/" })
      async create(@Body() data: any) {
        return { created: data };
      }

      @Put({ path: "/:id" })
      async update(@Param("id") id: string, @Body() data: any) {
        return { updated: { id, ...data } };
      }

      @Patch({ path: "/:id" })
      async patch(@Param("id") id: string, @Body() data: any) {
        return { patched: { id, ...data } };
      }

      @Delete({ path: "/:id" })
      async remove(@Param("id") id: string) {
        return { deleted: id };
      }

      @Options({ path: "/" })
      async options() {
        return { methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] };
      }

      @Head({ path: "/" })
      async head() {
        return {};
      }
    }

    const app = WynkFactory.create({ controllers: [ProductController] });
    await app.build();

    const routes = Reflect.getMetadata("routes", ProductController.prototype);
    expect(routes.length).toBe(8);

    const methods = routes.map((r: any) => r.method);
    expect(methods).toContain("GET");
    expect(methods).toContain("POST");
    expect(methods).toContain("PUT");
    expect(methods).toContain("PATCH");
    expect(methods).toContain("DELETE");
    expect(methods).toContain("OPTIONS");
    expect(methods).toContain("HEAD");
  });
});

describe("HTTP Decorators - Additional Decorators", () => {
  it("should apply @HttpCode decorator", async () => {
    @Controller("/api/status")
    class StatusController {
      @Post({ path: "/resource" })
      @HttpCode(201)
      async create() {
        return { created: true };
      }
    }

    const app = WynkFactory.create({ controllers: [StatusController] });
    await app.build();

    const httpCode = Reflect.getMetadata(
      "route:httpCode",
      StatusController.prototype,
      "create"
    );
    expect(httpCode).toBe(201);
  });

  it("should apply @Header decorator", async () => {
    @Controller("/api/cache")
    class CacheController {
      @Get({ path: "/data" })
      @Header("Cache-Control", "max-age=3600")
      async getData() {
        return { data: "cached" };
      }
    }

    const app = WynkFactory.create({ controllers: [CacheController] });
    await app.build();

    const headers = Reflect.getMetadata(
      "route:headers",
      CacheController.prototype,
      "getData"
    );
    expect(headers["Cache-Control"]).toBe("max-age=3600");
  });

  it("should apply @Redirect decorator", async () => {
    @Controller("/api/redirect")
    class RedirectController {
      @Get({ path: "/old" })
      @Redirect("/api/redirect/new", 301)
      async oldEndpoint() {
        return {};
      }
    }

    const app = WynkFactory.create({ controllers: [RedirectController] });
    await app.build();

    const redirect = Reflect.getMetadata(
      "route:redirect",
      RedirectController.prototype,
      "oldEndpoint"
    );
    expect(redirect.url).toBe("/api/redirect/new");
    expect(redirect.statusCode).toBe(301);
  });

  it("should combine multiple decorators", async () => {
    @Controller("/api/combined")
    class CombinedController {
      @Post({ path: "/resource" })
      @HttpCode(201)
      @Header("X-Custom-Header", "value")
      async create() {
        return { created: true };
      }
    }

    const app = WynkFactory.create({ controllers: [CombinedController] });
    await app.build();

    const httpCode = Reflect.getMetadata(
      "route:httpCode",
      CombinedController.prototype,
      "create"
    );
    const headers = Reflect.getMetadata(
      "route:headers",
      CombinedController.prototype,
      "create"
    );

    expect(httpCode).toBe(201);
    expect(headers["X-Custom-Header"]).toBe("value");
  });
});
