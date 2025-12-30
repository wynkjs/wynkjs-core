/**
 * WynkJS + Elysia Swagger Integration Example
 * 
 * This example demonstrates how WynkJS (built on Elysia) can use
 * Elysia's Swagger plugin to automatically generate API documentation
 */

import { WynkFactory } from "../core";
import { Controller, Get, Post, Put, Delete } from "../core/decorators/http.decorators";
import { Body, Param, Query } from "../core/decorators/param.decorators";
import { DTO } from "../core/dto";
import { swagger } from "@elysiajs/swagger";

// Define DTOs for Swagger documentation
const CreateUserDTO = DTO.Object({
  username: DTO.String({ minLength: 3, maxLength: 50 }),
  email: DTO.String({ format: "email" }),
  age: DTO.Optional(DTO.Number({ minimum: 18, maximum: 120 })),
  role: DTO.Optional(DTO.Enum(["user", "admin", "moderator"])),
});

const UpdateUserDTO = DTO.Object({
  username: DTO.Optional(DTO.String({ minLength: 3 })),
  email: DTO.Optional(DTO.String({ format: "email" })),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

const UserQueryDTO = DTO.Object({
  page: DTO.Optional(DTO.Number({ minimum: 1 })),
  limit: DTO.Optional(DTO.Number({ minimum: 1, maximum: 100 })),
  role: DTO.Optional(DTO.String()),
});

const UserParamDTO = DTO.Object({
  id: DTO.String({ pattern: "^[0-9]+$" }),
});

// Example Controller with proper documentation
@Controller("/users")
class UserController {
  @Get({
    path: "/",
    query: UserQueryDTO,
  })
  async listUsers(@Query() query: any) {
    return {
      users: [
        { id: 1, username: "john_doe", email: "john@example.com", age: 25, role: "user" },
        { id: 2, username: "jane_smith", email: "jane@example.com", age: 30, role: "admin" },
      ],
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
        total: 2,
      },
    };
  }

  @Get({
    path: "/:id",
    params: UserParamDTO,
  })
  async getUserById(@Param("id") id: string) {
    return {
      id: parseInt(id),
      username: "john_doe",
      email: "john@example.com",
      age: 25,
      role: "user",
    };
  }

  @Post({
    path: "/",
    body: CreateUserDTO,
  })
  async createUser(@Body() body: any) {
    return {
      id: 3,
      ...body,
      createdAt: new Date().toISOString(),
    };
  }

  @Put({
    path: "/:id",
    params: UserParamDTO,
    body: UpdateUserDTO,
  })
  async updateUser(@Param("id") id: string, @Body() body: any) {
    return {
      id: parseInt(id),
      ...body,
      updatedAt: new Date().toISOString(),
    };
  }

  @Delete({
    path: "/:id",
    params: UserParamDTO,
  })
  async deleteUser(@Param("id") id: string) {
    return {
      message: `User ${id} deleted successfully`,
      id: parseInt(id),
    };
  }
}

// Define DTOs for Product API
const CreateProductDTO = DTO.Object({
  name: DTO.String({ minLength: 1, maxLength: 200 }),
  description: DTO.Optional(DTO.String({ maxLength: 1000 })),
  price: DTO.Number({ minimum: 0 }),
  category: DTO.String(),
  inStock: DTO.Optional(DTO.Boolean()),
});

@Controller("/products")
class ProductController {
  @Get({ path: "/" })
  async listProducts() {
    return {
      products: [
        { id: 1, name: "Laptop", price: 999.99, category: "Electronics", inStock: true },
        { id: 2, name: "Mouse", price: 29.99, category: "Accessories", inStock: true },
      ],
    };
  }

  @Post({
    path: "/",
    body: CreateProductDTO,
  })
  async createProduct(@Body() body: any) {
    return {
      id: 3,
      ...body,
      createdAt: new Date().toISOString(),
    };
  }
}

// Create WynkJS application
const app = WynkFactory.create({
  controllers: [UserController, ProductController],
  cors: true,
});

// Build the Elysia app
const server = await app.build();

// ✨ Add Swagger plugin to the built Elysia app
// This is the key: WynkJS builds on Elysia, so we can use any Elysia plugin!
server.use(
  swagger({
    documentation: {
      info: {
        title: "WynkJS API Documentation",
        version: "1.0.0",
        description: "API documentation automatically generated from WynkJS decorators",
      },
      tags: [
        { name: "users", description: "User management endpoints" },
        { name: "products", description: "Product management endpoints" },
      ],
    },
    path: "/swagger",
    exclude: ["/swagger", "/swagger/json"],
  })
);

// Start the server
server.listen(3333);

console.log("🎉 WynkJS Server with Swagger running on http://localhost:3333");
console.log("📚 API Documentation available at: http://localhost:3333/swagger");
console.log("📄 OpenAPI JSON available at: http://localhost:3333/swagger/json");
