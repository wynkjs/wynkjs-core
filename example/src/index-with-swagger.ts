import "dotenv/config";
import {
  FormatErrorFormatter,
  SimpleErrorFormatter,
  DetailedErrorFormatter,
  WynkFactory,
  CorsOptions,
  compression,
} from "wynkjs";
import { swagger } from "@elysiajs/swagger";

import { GlobalExceptionFilter, DatabaseExceptionFilter } from "wynkjs";
import { UserController } from "./modules/user/user.controller";
import { ValidationExceptionFilter } from "./filter/validation.filter";
import { CustomExceptionFilter } from "./filter/custom.filter";
import { ProductController } from "./modules/product/product.controller";
import { CorsTestController } from "./modules/cors-test/cors-test.controller";
import { DatabaseService } from "./database";
import { corsOptions } from "./corsOptions";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthService } from "./modules/auth/auth.service";
import { AuthGuard } from "./modules/auth/auth.guard";
import { RoleSeeder } from "./modules/auth/role-seeder.service";
import { ProtectedRoutesController } from "./modules/protected/protected-routes.controller";
import { SessionController } from "./modules/session/session.controller";
import { corsDevelopment } from "./cors-examples";

/**
 * Bootstrap WynkJS Application with Swagger Documentation
 * 
 * Features:
 * - Complete API documentation
 * - Interactive Swagger UI
 * - JWT Bearer authentication support
 * - Auto-generated OpenAPI 3.0.3 spec
 */
async function bootstrap() {
  console.log("🚀 Starting WynkJS Application with Swagger Documentation...\n");

  const selectedCors = corsDevelopment;

  console.log("🔒 CORS Configuration: Development Mode");
  console.log("   - Allows all origins in development");
  console.log("   - Strict whitelist in production\n");

  // Create WynkJS application
  const app = WynkFactory.create({
    providers: [
      DatabaseService,
      AuthService,
      AuthGuard,
      RoleSeeder,
    ],
    controllers: [
      UserController,
      ProductController,
      CorsTestController,
      AuthController,
      ProtectedRoutesController,
      SessionController,
    ],
    cors: selectedCors,
    logger: true,
    validationErrorFormatter: new DetailedErrorFormatter(),
  });

  // Enable compression middleware
  app.use(
    compression({
      threshold: 1024,
      encodings: ["br", "gzip", "deflate"],
    })
  );

  // Build the Elysia server instance
  const server = await app.build();

  // Add Swagger Documentation
  server.use(
    swagger({
      documentation: {
        info: {
          title: "WynkJS Example API",
          version: "1.0.0",
          description: `
# WynkJS Example Application API

Complete API documentation for the WynkJS framework demonstration application.

## Features

- 🔐 **JWT Authentication** - Secure login and registration
- 👥 **User Management** - CRUD operations for users
- 📦 **Product Management** - Product catalog endpoints
- 🛡️ **Protected Routes** - Role-based access control (RBAC)
- 🍪 **Session Management** - Cookie-based sessions
- 🌐 **CORS Testing** - CORS configuration examples

## Authentication

Most protected endpoints require a valid JWT token. To authenticate:

1. **Register** a new user at \`POST /auth/register\`
2. **Login** at \`POST /auth/login\` to get your access token
3. Click the **Authorize** button (🔒) at the top right
4. Enter your token in the format: \`Bearer YOUR_TOKEN_HERE\`
5. Click **Authorize** to apply the token to all requests

## Roles

- **user** - Regular user access
- **admin** - Full administrative access
- **moderator** - Content moderation access

## Response Formats

All responses follow consistent patterns:
- **Success**: \`{ message: string, data?: any }\`
- **Error**: \`{ error: string, details?: any }\`
          `.trim(),
          contact: {
            name: "WynkJS Team",
            url: "https://github.com/yourusername/wynkjs",
          },
          license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
          },
        },
        tags: [
          {
            name: "Authentication",
            description: "User authentication endpoints - register, login, token verification",
          },
          {
            name: "Users",
            description: "User management operations - CRUD endpoints with validation",
          },
          {
            name: "Products",
            description: "Product catalog management - full CRUD operations",
          },
          {
            name: "Protected Routes",
            description: "Role-based protected endpoints (requires authentication)",
          },
          {
            name: "Session",
            description: "Session management with cookies - demonstrates Request/Response usage",
          },
          {
            name: "CORS Test",
            description: "CORS configuration testing endpoints",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "Enter your JWT token obtained from /auth/login or /auth/register",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      path: "/docs",
      exclude: ["/docs", "/docs/json"], // Exclude Swagger endpoints from documentation
    })
  );

  // Register global exception filters
  app.useGlobalFilters(
    process.env.NODE_ENV === "production"
      ? new DatabaseExceptionFilter()
      : new GlobalExceptionFilter()
  );

  // Start server
  await server.listen(3000);

  console.log("\n✅ WynkJS Application Started Successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌐 Server:          http://localhost:3000");
  console.log("📚 Swagger UI:      http://localhost:3000/docs");
  console.log("📄 OpenAPI JSON:    http://localhost:3000/docs/json");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📖 Quick Start Guide:\n");
  console.log("1️⃣  Visit http://localhost:3000/docs for interactive API documentation");
  console.log("2️⃣  Click 'POST /auth/register' to create a new user account");
  console.log("3️⃣  Copy the 'accessToken' from the response");
  console.log("4️⃣  Click the 'Authorize' button (🔒) at the top right");
  console.log("5️⃣  Paste your token and click 'Authorize'");
  console.log("6️⃣  Now you can test all protected endpoints!\n");
  console.log("🔐 Protected Endpoints:");
  console.log("   • /protected/*      - Requires any authenticated user");
  console.log("   • /protected/admin  - Requires 'admin' role");
  console.log("   • /protected/moderator - Requires 'moderator' or 'admin' role\n");
  console.log("💡 Tip: All endpoints are documented with examples in Swagger UI");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
