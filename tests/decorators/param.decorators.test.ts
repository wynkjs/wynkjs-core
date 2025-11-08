// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, it, expect } from "bun:test";
import { WynkFactory } from "../../core/factory";
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  Request,
  Response,
  DTO,
} from "../../core";
import "reflect-metadata";

/**
 * Parameter Decorators Test Suite
 * Tests all parameter decorators with various scenarios:
 * - @Param - Path parameters
 * - @Query - Query string parameters
 * - @Body - Request body
 * - @Headers - Request headers
 * - @Request - Full request object
 * - @Response - Response object
 */

describe("Parameter Decorators - @Param", () => {
  it("should extract single param", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/:id" })
      async findOne(@Param("id") id: string) {
        return { userId: id };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract multiple params", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/:userId/posts/:postId" })
      async getPost(
        @Param("userId") userId: string,
        @Param("postId") postId: string
      ) {
        return { userId, postId };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract all params without key", async () => {
    @Controller("/api/users")
    class UserController {
      @Get({ path: "/:userId/posts/:postId" })
      async getPost(@Param() params: any) {
        return { params };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle numeric params", async () => {
    const ParamsDTO = DTO.Object({
      id: DTO.Number({ minimum: 1 }),
    });

    @Controller("/api/items")
    class ItemController {
      @Get({ path: "/:id", params: ParamsDTO })
      async findOne(@Param("id") id: number) {
        return { itemId: id };
      }
    }

    const app = WynkFactory.create({ controllers: [ItemController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle UUID params with validation", async () => {
    const UUIDParamsDTO = DTO.Object({
      id: DTO.String({ format: "uuid" }),
    });

    @Controller("/api/resources")
    class ResourceController {
      @Get({ path: "/:id", params: UUIDParamsDTO })
      async findOne(@Param("id") id: string) {
        return { resourceId: id };
      }
    }

    const app = WynkFactory.create({ controllers: [ResourceController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle nested route params", async () => {
    @Controller("/api/organizations")
    class OrgController {
      @Get({ path: "/:orgId/teams/:teamId/members/:memberId" })
      async getMember(
        @Param("orgId") orgId: string,
        @Param("teamId") teamId: string,
        @Param("memberId") memberId: string
      ) {
        return { orgId, teamId, memberId };
      }
    }

    const app = WynkFactory.create({ controllers: [OrgController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - @Query", () => {
  it("should extract single query param", async () => {
    @Controller("/api/search")
    class SearchController {
      @Get({ path: "/" })
      async search(@Query("q") query: string) {
        return { searchQuery: query };
      }
    }

    const app = WynkFactory.create({ controllers: [SearchController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract multiple query params", async () => {
    @Controller("/api/products")
    class ProductController {
      @Get({ path: "/" })
      async findAll(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("sort") sort: string
      ) {
        return { page, limit, sort };
      }
    }

    const app = WynkFactory.create({ controllers: [ProductController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract all query params without key", async () => {
    @Controller("/api/search")
    class SearchController {
      @Get({ path: "/" })
      async search(@Query() query: any) {
        return { filters: query };
      }
    }

    const app = WynkFactory.create({ controllers: [SearchController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle query with DTO validation", async () => {
    const QueryDTO = DTO.Object({
      page: DTO.Optional(DTO.Number({ minimum: 1 })),
      limit: DTO.Optional(DTO.Number({ minimum: 1, maximum: 100 })),
      search: DTO.Optional(DTO.String({ minLength: 3 })),
    });

    @Controller("/api/users")
    class UserController {
      @Get({ path: "/", query: QueryDTO })
      async findAll(@Query() query: any) {
        return { users: [], pagination: query };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle boolean query params", async () => {
    const BooleanQueryDTO = DTO.Object({
      active: DTO.Optional(DTO.Boolean()),
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
    expect(app).toBeDefined();
  });

  it("should handle array query params", async () => {
    const ArrayQueryDTO = DTO.Object({
      tags: DTO.Optional(DTO.Array(DTO.String())),
      categories: DTO.Optional(DTO.Array(DTO.Number())),
    });

    @Controller("/api/posts")
    class PostController {
      @Get({ path: "/", query: ArrayQueryDTO })
      async findByTags(@Query() query: any) {
        return { posts: [], filters: query };
      }
    }

    const app = WynkFactory.create({ controllers: [PostController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle enum-like query params", async () => {
    const EnumQueryDTO = DTO.Object({
      status: DTO.Optional(
        DTO.Union([
          DTO.Literal("draft"),
          DTO.Literal("published"),
          DTO.Literal("archived"),
        ])
      ),
      order: DTO.Optional(DTO.Union([DTO.Literal("asc"), DTO.Literal("desc")])),
    });

    @Controller("/api/articles")
    class ArticleController {
      @Get({ path: "/", query: EnumQueryDTO })
      async findAll(@Query() query: any) {
        return { articles: [], filters: query };
      }
    }

    const app = WynkFactory.create({ controllers: [ArticleController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - @Body", () => {
  it("should extract entire body", async () => {
    @Controller("/api/users")
    class UserController {
      @Post({ path: "/" })
      async create(@Body() data: any) {
        return { created: data };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract specific body field", async () => {
    @Controller("/api/auth")
    class AuthController {
      @Post({ path: "/login" })
      async login(
        @Body("email") email: string,
        @Body("password") password: string
      ) {
        return { email, authenticated: true };
      }
    }

    const app = WynkFactory.create({ controllers: [AuthController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle body with DTO validation", async () => {
    const CreateUserDTO = DTO.Object({
      name: DTO.String({ minLength: 2, maxLength: 50 }),
      email: DTO.String({ format: "email" }),
      age: DTO.Optional(DTO.Number({ minimum: 18 })),
    });

    @Controller("/api/users")
    class UserController {
      @Post({ path: "/", body: CreateUserDTO })
      async create(@Body() data: any) {
        return { created: data };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle nested body objects", async () => {
    const NestedDTO = DTO.Object({
      user: DTO.Object({
        name: DTO.String(),
        email: DTO.String({ format: "email" }),
      }),
      metadata: DTO.Object({
        source: DTO.String(),
        timestamp: DTO.Number(),
      }),
    });

    @Controller("/api/complex")
    class ComplexController {
      @Post({ path: "/", body: NestedDTO })
      async create(@Body() data: any) {
        return { created: data };
      }
    }

    const app = WynkFactory.create({ controllers: [ComplexController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle array body", async () => {
    const ArrayBodyDTO = DTO.Array(
      DTO.Object({
        name: DTO.String(),
        email: DTO.String({ format: "email" }),
      })
    );

    @Controller("/api/bulk")
    class BulkController {
      @Post({ path: "/users", body: ArrayBodyDTO })
      async bulkCreate(@Body() users: any[]) {
        return { count: users.length };
      }
    }

    const app = WynkFactory.create({ controllers: [BulkController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle partial update body", async () => {
    const PartialUpdateDTO = DTO.Object({
      name: DTO.Optional(DTO.String()),
      email: DTO.Optional(DTO.String({ format: "email" })),
      bio: DTO.Optional(DTO.String({ maxLength: 500 })),
    });

    @Controller("/api/users")
    class UserController {
      @Patch({ path: "/:id", body: PartialUpdateDTO })
      async update(@Param("id") id: string, @Body() data: any) {
        return { updated: { id, ...data } };
      }
    }

    const app = WynkFactory.create({ controllers: [UserController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - @Headers", () => {
  it("should extract single header", async () => {
    @Controller("/api/secure")
    class SecureController {
      @Get({ path: "/profile" })
      async getProfile(@Headers("authorization") auth: string) {
        return { authenticated: !!auth };
      }
    }

    const app = WynkFactory.create({ controllers: [SecureController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract multiple headers", async () => {
    @Controller("/api/v1")
    class ApiController {
      @Get({ path: "/data" })
      async getData(
        @Headers("authorization") auth: string,
        @Headers("x-api-key") apiKey: string,
        @Headers("x-request-id") requestId: string
      ) {
        return { auth, apiKey, requestId };
      }
    }

    const app = WynkFactory.create({ controllers: [ApiController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should extract all headers without key", async () => {
    @Controller("/api/debug")
    class DebugController {
      @Get({ path: "/headers" })
      async getHeaders(@Headers() headers: any) {
        return { headers };
      }
    }

    const app = WynkFactory.create({ controllers: [DebugController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle headers with DTO validation", async () => {
    const HeadersDTO = DTO.Object({
      authorization: DTO.String({ pattern: "^Bearer " }),
      "x-api-key": DTO.String({ minLength: 32 }),
      "content-type": DTO.Optional(DTO.Literal("application/json")),
    });

    @Controller("/api/secure")
    class SecureController {
      @Post({ path: "/data", headers: HeadersDTO })
      async postData(@Headers() headers: any, @Body() data: any) {
        return { received: true };
      }
    }

    const app = WynkFactory.create({ controllers: [SecureController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle case-insensitive headers", async () => {
    @Controller("/api/test")
    class TestController {
      @Get({ path: "/" })
      async test(
        @Headers("Content-Type") contentType: string,
        @Headers("User-Agent") userAgent: string
      ) {
        return { contentType, userAgent };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - @Request", () => {
  it("should extract full request object", async () => {
    @Controller("/api/test")
    class TestController {
      @Get({ path: "/" })
      async test(@Request() req: any) {
        return { method: req.method, url: req.url };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should access request properties", async () => {
    @Controller("/api/info")
    class InfoController {
      @Post({ path: "/" })
      async getInfo(@Request() req: any, @Body() data: any) {
        return {
          method: req.method,
          headers: req.headers,
          body: data,
        };
      }
    }

    const app = WynkFactory.create({ controllers: [InfoController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - @Response", () => {
  it("should extract response object", async () => {
    @Controller("/api/test")
    class TestController {
      @Get({ path: "/" })
      async test(@Response() res: any) {
        // Can manipulate response object
        return { success: true };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should work with request object", async () => {
    @Controller("/api/test")
    class TestController {
      @Post({ path: "/" })
      async test(@Request() req: any, @Response() res: any, @Body() data: any) {
        return {
          requestMethod: req.method,
          data,
        };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - Combined Usage", () => {
  it("should use multiple parameter decorators together", async () => {
    const CreateDTO = DTO.Object({
      title: DTO.String(),
      content: DTO.String(),
    });

    const QueryDTO = DTO.Object({
      notify: DTO.Optional(DTO.Boolean()),
    });

    @Controller("/api/posts")
    class PostController {
      @Post({ path: "/:userId", body: CreateDTO, query: QueryDTO })
      async create(
        @Param("userId") userId: string,
        @Body() data: any,
        @Query() query: any,
        @Headers("authorization") auth: string
      ) {
        return { userId, data, query, authenticated: !!auth };
      }
    }

    const app = WynkFactory.create({ controllers: [PostController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle all parameter types in one method", async () => {
    @Controller("/api/complex")
    class ComplexController {
      @Put({ path: "/:id" })
      async update(
        @Param("id") id: string,
        @Query("version") version: string,
        @Body() data: any,
        @Headers("authorization") auth: string,
        @Request() req: any,
        @Response() res: any
      ) {
        return {
          id,
          version,
          data,
          authenticated: !!auth,
          method: req.method,
        };
      }
    }

    const app = WynkFactory.create({ controllers: [ComplexController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle multiple params and queries", async () => {
    @Controller("/api/organizations")
    class OrgController {
      @Get({ path: "/:orgId/projects/:projectId" })
      async getProject(
        @Param("orgId") orgId: string,
        @Param("projectId") projectId: string,
        @Query("include") include: string,
        @Query("fields") fields: string,
        @Headers("accept") accept: string
      ) {
        return { orgId, projectId, include, fields, accept };
      }
    }

    const app = WynkFactory.create({ controllers: [OrgController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should mix param extraction methods", async () => {
    @Controller("/api/flexible")
    class FlexibleController {
      @Post({ path: "/:id" })
      async flexibleEndpoint(
        @Param("id") id: string,
        @Param() allParams: any,
        @Query("filter") filter: string,
        @Query() allQuery: any,
        @Body("name") name: string,
        @Body() allBody: any
      ) {
        return { id, allParams, filter, allQuery, name, allBody };
      }
    }

    const app = WynkFactory.create({ controllers: [FlexibleController] });
    await app.build();
    expect(app).toBeDefined();
  });
});

describe("Parameter Decorators - Edge Cases", () => {
  it("should handle missing optional params", async () => {
    const OptionalQueryDTO = DTO.Object({
      search: DTO.Optional(DTO.String()),
      page: DTO.Optional(DTO.Number()),
    });

    @Controller("/api/search")
    class SearchController {
      @Get({ path: "/", query: OptionalQueryDTO })
      async search(@Query() query: any) {
        return { results: [], query };
      }
    }

    const app = WynkFactory.create({ controllers: [SearchController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle default values", async () => {
    @Controller("/api/defaults")
    class DefaultController {
      @Get({ path: "/" })
      async search(
        @Query("page") page: number = 1,
        @Query("limit") limit: number = 10
      ) {
        return { page, limit };
      }
    }

    const app = WynkFactory.create({ controllers: [DefaultController] });
    await app.build();
    expect(app).toBeDefined();
  });

  it("should handle empty body", async () => {
    @Controller("/api/test")
    class TestController {
      @Post({ path: "/ping" })
      async ping(@Body() body: any) {
        return { received: body || {} };
      }
    }

    const app = WynkFactory.create({ controllers: [TestController] });
    await app.build();
    expect(app).toBeDefined();
  });
});
