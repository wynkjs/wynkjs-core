import {
  WynkFactory,
  DetailedErrorFormatter,
  GlobalExceptionFilter,
  compression,
} from "wynkjs";
import { swagger } from "@elysiajs/swagger";

// Feature Modules
import { UserModule } from "./modules/user/user.module";
import { ProductModule } from "./modules/product/product.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProtectedModule } from "./modules/protected/protected.module";
import { SessionModule } from "./modules/session/session.module";
import { DemoModule } from "./modules/demo/demo.module";
import { HealthModule } from "./modules/health/health.module";

/**
 * Create and start the WynkJS demo server with modules, middleware, global filters, and Swagger documentation.
 *
 * Initializes an application with the feature modules, enables CORS and logging, applies compression middleware
 * and a global exception filter, builds the underlying Elysia server, mounts Swagger docs at `/docs`, and starts
 * listening on port 3000 while logging the API and docs URLs to the console.
 */
async function bootstrap() {
  const app = WynkFactory.create({
    modules: [
      UserModule,
      ProductModule,
      AuthModule,
      ProtectedModule,
      SessionModule,
      DemoModule,
      HealthModule,
    ],
    cors: true,
    logger: true,
    validationErrorFormatter: new DetailedErrorFormatter(),
  });

  // Compression middleware
  app.use(
    compression({
      threshold: 1024,
      encodings: ["br", "gzip", "deflate"],
    })
  );

  // Global exception filter (catches unhandled exceptions)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Build the underlying Elysia server
  const server = await app.build();

  // Attach Swagger docs (must be called on the raw Elysia instance)
  server.use(
    swagger({
      documentation: {
        info: {
          title: "WynkJS Demo API",
          version: "1.0.0",
          description: `
# WynkJS Feature Demo

Complete API showcasing every WynkJS feature — no database required.

## Modules

- **User** – Full CRUD, DTO validation
- **Product** – Product catalog CRUD
- **Auth** – JWT login/register (in-memory)
- **Protected** – Role-based guards
- **Session** – Cookie sessions via Request/Response
- **Demo** – Guards, Pipes, Interceptors, SetMetadata, Reflector, createParamDecorator, HttpStatus, applyDecorators, lifecycle hooks
- **Health** – OnModuleInit / OnModuleDestroy lifecycle

## Default credentials

| Email | Password | Roles |
|---|---|---|
| admin@example.com | password123 | admin, user |
| user@example.com | password123 | user |

## Auth flow

1. \`POST /auth/login\` → get \`token\`
2. Click **Authorize** → paste \`Bearer <token>\`
          `.trim(),
        },
        tags: [
          { name: "User", description: "User management — CRUD with DTO validation" },
          { name: "Product", description: "Product catalog — CRUD operations" },
          { name: "Auth", description: "JWT authentication — login, register, profile" },
          { name: "Protected", description: "Role-based access control (requires JWT)" },
          { name: "Session", description: "Cookie-based sessions via WynkRequest/WynkResponse" },
          { name: "Demo", description: "Advanced features: guards, pipes, interceptors, metadata, lifecycle" },
          { name: "Health", description: "Health check — OnModuleInit / OnModuleDestroy lifecycle" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
      path: "/docs",
    })
  );

  server.listen(3000);

  console.log("\n🚀 WynkJS demo server running!");
  console.log("   API  → http://localhost:3000");
  console.log("   Docs → http://localhost:3000/docs\n");
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
