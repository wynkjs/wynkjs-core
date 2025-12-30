/**
 * WynkJS + Elysia Swagger - Advanced Example with Authentication
 * 
 * This example shows how to integrate JWT authentication with Swagger UI
 */

import { WynkFactory } from "../core";
import { Controller, Get, Post, Put, Delete } from "../core/decorators/http.decorators";
import { Body, Param, Query, Headers } from "../core/decorators/param.decorators";
import { UseGuards } from "../core/decorators/guard.decorators";
import { DTO } from "../core/dto";
import { swagger } from "@elysiajs/swagger";

// DTOs
const LoginDTO = DTO.Object({
  email: DTO.String({ format: "email" }),
  password: DTO.String({ minLength: 6 }),
});

const CreatePostDTO = DTO.Object({
  title: DTO.String({ minLength: 1, maxLength: 200 }),
  content: DTO.String({ minLength: 1 }),
  tags: DTO.Optional(DTO.Array(DTO.String())),
  published: DTO.Optional(DTO.Boolean()),
});

const UpdatePostDTO = DTO.Object({
  title: DTO.Optional(DTO.String({ minLength: 1 })),
  content: DTO.Optional(DTO.String({ minLength: 1 })),
  tags: DTO.Optional(DTO.Array(DTO.String())),
  published: DTO.Optional(DTO.Boolean()),
});

// Simple Auth Guard (for demonstration)
class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const authHeader = context.headers?.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }
    // In real app, verify JWT token here
    return true;
  }
}

// Controllers
@Controller("/auth")
class AuthController {
  @Post({
    path: "/login",
    body: LoginDTO,
  })
  async login(@Body() body: any) {
    // In real app, verify credentials and generate JWT
    return {
      access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      token_type: "bearer",
      expires_in: 3600,
    };
  }

  @Post({ path: "/register", body: LoginDTO })
  async register(@Body() body: any) {
    return {
      message: "User registered successfully",
      user: {
        id: 1,
        email: body.email,
      },
    };
  }
}

@Controller("/posts")
class PostController {
  @Get({ path: "/" })
  async listPosts(@Query() query: any) {
    return {
      posts: [
        {
          id: 1,
          title: "Getting Started with WynkJS",
          content: "WynkJS is a powerful framework...",
          tags: ["tutorial", "wynkjs"],
          published: true,
        },
      ],
    };
  }

  @Get({ path: "/:id" })
  async getPost(@Param("id") id: string) {
    return {
      id: parseInt(id),
      title: "Post Title",
      content: "Post content...",
    };
  }

  @Post({
    path: "/",
    body: CreatePostDTO,
  })
  @UseGuards(AuthGuard)
  async createPost(@Body() body: any, @Headers("authorization") auth: string) {
    return {
      id: 2,
      ...body,
      createdAt: new Date().toISOString(),
    };
  }

  @Put({
    path: "/:id",
    body: UpdatePostDTO,
  })
  @UseGuards(AuthGuard)
  async updatePost(@Param("id") id: string, @Body() body: any) {
    return {
      id: parseInt(id),
      ...body,
      updatedAt: new Date().toISOString(),
    };
  }

  @Delete({ path: "/:id" })
  @UseGuards(AuthGuard)
  async deletePost(@Param("id") id: string) {
    return {
      message: `Post ${id} deleted successfully`,
    };
  }
}

@Controller("/profile")
@UseGuards(AuthGuard)
class ProfileController {
  @Get({ path: "/" })
  async getProfile(@Headers("authorization") auth: string) {
    return {
      id: 1,
      email: "user@example.com",
      name: "John Doe",
      createdAt: "2024-01-01T00:00:00Z",
    };
  }

  @Put({
    path: "/",
    body: DTO.Object({
      name: DTO.Optional(DTO.String()),
      bio: DTO.Optional(DTO.String()),
    }),
  })
  async updateProfile(@Body() body: any) {
    return {
      message: "Profile updated",
      ...body,
    };
  }
}

// Create app
const app = WynkFactory.create({
  controllers: [AuthController, PostController, ProfileController],
  cors: true,
});

const server = await app.build();

// Add Swagger with JWT Authentication
server.use(
  swagger({
    documentation: {
      info: {
        title: "WynkJS Blog API",
        version: "1.0.0",
        description: `
# WynkJS Blog API

A comprehensive REST API for a blog platform built with WynkJS.

## Authentication

This API uses JWT (JSON Web Tokens) for authentication.

### How to authenticate:

1. Use the \`POST /auth/login\` endpoint to get a token
2. Click the "Authorize" button (🔓) at the top right
3. Enter: \`Bearer YOUR_TOKEN_HERE\`
4. Click "Authorize"
5. Now you can access protected endpoints

### Test Credentials:
- Email: \`test@example.com\`
- Password: \`password123\`
        `,
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
      },
      tags: [
        {
          name: "auth",
          description: "Authentication endpoints - Login & Register",
        },
        {
          name: "posts",
          description: "Blog post management - CRUD operations",
        },
        {
          name: "profile",
          description: "User profile management - Requires authentication",
        },
      ],
      servers: [
        {
          url: "http://localhost:3333",
          description: "Development server",
        },
        {
          url: "https://api.example.com",
          description: "Production server",
        },
      ],
      // Define security scheme for JWT
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token in the format: Bearer {token}",
          },
        },
      },
      // Apply security globally (can be overridden per route)
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    path: "/docs",
    exclude: ["/docs", "/docs/json"],
    swaggerOptions: {
      persistAuthorization: true, // Keep JWT token in browser storage
      displayRequestDuration: true,
      filter: true, // Enable search/filter
      syntaxHighlight: {
        activate: true,
        theme: "monokai",
      },
    },
  })
);

server.listen(3333);

console.log("\n🎉 WynkJS Blog API with Swagger Authentication");
console.log("━".repeat(60));
console.log("🌐 Server:        http://localhost:3333");
console.log("📚 Swagger UI:    http://localhost:3333/docs");
console.log("📄 OpenAPI Spec:  http://localhost:3333/docs/json");
console.log("━".repeat(60));
console.log("\n🔐 To test authenticated endpoints:");
console.log("1. Go to: http://localhost:3333/docs");
console.log("2. Use POST /auth/login to get a token");
console.log("3. Click 'Authorize' button (🔓) at the top");
console.log("4. Enter: Bearer YOUR_TOKEN");
console.log("5. Test protected endpoints like POST /posts");
console.log("\n✨ Features:");
console.log("   • JWT Authentication");
console.log("   • Interactive API testing");
console.log("   • Request/Response examples");
console.log("   • Schema validation");
console.log("   • OpenAPI 3.0 compatible\n");
