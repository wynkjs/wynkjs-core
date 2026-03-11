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
import { PipesModule } from "./modules/pipes/pipes.module";
import { InterceptorsModule } from "./modules/interceptors/interceptors.module";
import { FiltersModule } from "./modules/filters/filters.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { FormattersModule } from "./modules/formatters/formatters.module";
import {
  APP_CONFIG,
  LOG_LEVEL,
  ASYNC_CONFIG,
} from "./modules/providers/config.token";

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
      PipesModule,
      InterceptorsModule,
      FiltersModule,
      ProvidersModule,
      FormattersModule,
    ],
    providers: [
      {
        provide: APP_CONFIG,
        useValue: { name: "WynkJS Demo", version: "1.0.9", env: "development" },
      },
      { provide: LOG_LEVEL, useValue: "debug" },
      {
        provide: ASYNC_CONFIG,
        useFactory: (cfg: any) => ({
          ...cfg,
          extra: true,
          timestamp: Date.now(),
        }),
        inject: [APP_CONFIG],
      },
    ],
    cors: true,
    logger: true,
    globalPrefix: "/api",
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
          version: "1.0.9",
          description: `
# WynkJS Feature Demo

Complete API showcasing every WynkJS feature — no database required.

## Modules

- **User** – Full CRUD, DTO validation
- **Product** – Product catalog CRUD
- **Auth** – JWT login/register (in-memory)
- **Protected** – Role-based guards
- **Session** – Cookie sessions via Request/Response
- **Demo** – Guards, Pipes, Interceptors, SetMetadata, Reflector, createParamDecorator, HttpStatus, applyDecorators, @Headers, @User, @Context, @Ip, @Session, @HostParam, @UploadedFile/@UploadedFiles, @Head, @Options, @Redirect, @Sse, @Use, schemaRegistry
- **Health** – OnModuleInit / OnModuleDestroy lifecycle
- **Pipes** – ParseIntPipe, ParseBoolPipe, ValidationPipe, custom pipes, @UsePipes at method and param level
- **Interceptors** – Logging, transform, timeout interceptors; @UseInterceptors at controller and method level
- **Filters** – Custom @Catch filters, @UseFilters, built-in HttpWynkExceptionFilter, AllExceptions, every HTTP exception type
- **Providers** – ValueProvider, FactoryProvider, ExistingProvider, ClassProvider, @Optional, @Inject
- **Formatters** – FormatErrorFormatter, SimpleErrorFormatter, DetailedErrorFormatter

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
          {
            name: "Demo",
            description:
              "Advanced features: guards, pipes, interceptors, metadata, lifecycle, param decorators, HTTP method decorators, schemaRegistry",
          },
          { name: "Health", description: "Health check — OnModuleInit / OnModuleDestroy lifecycle" },
          { name: "Pipes", description: "Built-in and custom pipes — ParseIntPipe, ParseBoolPipe, ValidationPipe, @UsePipes" },
          {
            name: "Interceptors",
            description:
              "Logging, transform, timeout interceptors — @UseInterceptors at controller and method level",
          },
          {
            name: "Filters",
            description:
              "Custom @Catch filters, @UseFilters, built-in exception filters, all HTTP exception types",
          },
          {
            name: "Providers",
            description:
              "ValueProvider, FactoryProvider, ExistingProvider, ClassProvider, @Optional, @Inject",
          },
          {
            name: "Formatters",
            description:
              "FormatErrorFormatter, SimpleErrorFormatter, DetailedErrorFormatter validation error formats",
          },
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
