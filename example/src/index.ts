import "dotenv/config"; // ✅ Load environment variables
import {
  FormatErrorFormatter,
  SimpleErrorFormatter,
  DetailedErrorFormatter,
  WynkFactory,
  CorsOptions,
} from "wynkjs";

import { GlobalExceptionFilter, DatabaseExceptionFilter } from "wynkjs";
import { UserController } from "./modules/user/user.controller";
import { ValidationExceptionFilter } from "./filter/validation.filter";
import { CustomExceptionFilter } from "./filter/custom.filter";
import { ProductController } from "./modules/product/product.controller";
import { CorsTestController } from "./modules/cors-test/cors-test.controller";
import { DatabaseService } from "./database";
import { corsOptions } from "./corsOptions";
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
    ],
    controllers: [UserController, ProductController, CorsTestController],
    cors: selectedCors,
    logger: true,
    validationErrorFormatter: new DetailedErrorFormatter(),
  });

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
