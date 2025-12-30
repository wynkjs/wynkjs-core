import "dotenv/config"; // ✅ Load environment variables
import {
  FormatErrorFormatter,
  SimpleErrorFormatter,
  DetailedErrorFormatter,
  WynkFactory,
  CorsOptions,
  compression,
} from "wynkjs";

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
// Import CORS examples
import {
  corsDynamicValidation,
  corsEnvironmentBased,
  corsWithLogging,
  corsMultiTenant,
  corsSecure,
  corsDevelopment,
} from "./cors-examples";

/**
 * Bootstrap WynkJS Application
 * Example of using WynkJS framework with Database Provider
 */
async function bootstrap() {
  console.log("🚀 Starting WynkJS Application...\n");

  // CORS Configuration Options:
  // 1. corsOptions - Production whitelist (from corsOptions.ts)
  // 2. corsDynamicValidation - Dynamic validation with subdomain support
  // 3. corsEnvironmentBased - Different behavior per environment
  // 4. corsWithLogging - Detailed logging
  // 5. corsMultiTenant - Multi-tenant support
  // 6. corsSecure - Advanced security
  // 7. corsDevelopment - Development-friendly (allows all in dev)
  // 8. true - Allow all origins (simple mode)

  const selectedCors = corsDevelopment; // Change this to test different configs

  console.log("🔒 CORS Configuration: Development Mode");
  console.log("   - Allows all origins in development");
  console.log("   - Strict whitelist in production\n");

  // Create WynkJS application with providers and controllers
  const app = WynkFactory.create({
    providers: [
      DatabaseService, // ✅ Database provider - initialized before controllers
      AuthService, // ✅ Auth service provider
      AuthGuard, // ✅ Auth guard provider
      RoleSeeder, // ✅ Role seeder provider
    ],
    controllers: [
      UserController,
      ProductController,
      CorsTestController,
      AuthController, // ✅ Auth controller
      ProtectedRoutesController, // ✅ Protected routes controller
      SessionController, // ✅ Session controller - demonstrates Request/Response architecture
    ],
    cors: selectedCors,
    logger: true,
    validationErrorFormatter: new DetailedErrorFormatter(),
  });

  // Enable compression middleware
  app.use(
    compression({
      threshold: 1024, // Compress responses larger than 1KB
      encodings: ["br", "gzip", "deflate"], // Support Brotli, Gzip, and Deflate
    })
  );

  // Option 2: With FormatErrorFormatter (object-based format)
  // const app = WynkFactory.create({
  //   controllers: [UserController],
  //   cors: true,
  //   logger: true,
  //   validationErrorFormatter: new FormatErrorFormatter(),
  // });

  // Option 3: With SimpleErrorFormatter (array of messages)
  // const app = WynkFactory.create({
  //   controllers: [UserController],
  //   cors: true,
  //   logger: true,
  //   validationErrorFormatter: new SimpleErrorFormatter(),
  // });

  // Option 4: With DetailedErrorFormatter (detailed field info)
  // const app = WynkFactory.create({
  //   controllers: [UserController],
  //   cors: true,
  //   logger: true,
  //   validationErrorFormatter: new DetailedErrorFormatter(),
  // });

  // Register global exception filter
  // CustomExceptionFilter handles all exceptions with production/development modes
  app.useGlobalFilters(
    process.env.NODE_ENV === "production"
      ? new DatabaseExceptionFilter()
      : new GlobalExceptionFilter()
  );

  // Start server
  await app.listen(3000);

  console.log("🎉 WynkJS Application is running on http://localhost:3000");
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
