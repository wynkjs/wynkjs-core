import {
  FormatErrorFormatter,
  SimpleErrorFormatter,
  DetailedErrorFormatter,
  // ValidationExceptionFilter,
  WynkFactory,
} from "wynkjs";

import { GlobalExceptionFilter, DatabaseExceptionFilter } from "wynkjs";
import { UserController } from "./user.controller";
import { ValidationExceptionFilter } from "./validation.filter";
import { CustomExceptionFilter } from "./custom.filter";
/**
 * Bootstrap WynkJS Application
 * Example of using WynkJS framework with Database Registry
 */
async function bootstrap() {
  console.log("🚀 Starting WynkJS Application...\n");

  // Set DATABASE_URL if not set

  //   // Initialize database and register with WynkJS
  //   const db = initializeDatabase();

  // Create WynkJS application with all controllers
  // Option 1: Default format { field: [messages] }
  const app = WynkFactory.create({
    controllers: [UserController],
    cors: true,
    logger: true,
    // validationErrorFormatter: new DetailedErrorFormatter(),
  });

  // Option 2: With FormatErrorFormatter (NestJS-style format)
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
    new CustomExceptionFilter() // Handles all HttpException and unknown errors
  );

  // Start server
  await app.listen(3000);

  console.log("🎉 WynkJS Application is running on http://localhost:3000");
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
