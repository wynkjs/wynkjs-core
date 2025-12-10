/**
 * WynkJS Framework - Core Module
 * A high-performance framework built on Elysia with decorator support
 *
 * @author WynkJS Team
 * @license MIT
 */

// Import reflect-metadata at the top of the framework
// This ensures users don't need to import it manually
import "reflect-metadata";

// Re-export tsyringe decorators for dependency injection
// Users can import these from 'wynkjs' instead of 'tsyringe'
export {
  injectable,
  inject,
  singleton,
  autoInjectable,
  registry,
  container,
} from "tsyringe";
export type { DependencyContainer } from "tsyringe";

// Capital-cased aliases for consistency with WynkJS naming convention
export {
  injectable as Injectable,
  inject as Inject,
  singleton as Singleton,
  autoInjectable as AutoInjectable,
  registry as Registry,
  container as Container,
} from "tsyringe";

// HTTP Method Decorators
export * from "./decorators/http.decorators";

// Parameter Decorators
export * from "./decorators/param.decorators";

// Guard System
export * from "./decorators/guard.decorators";

// Interceptor System
export * from "./decorators/interceptor.decorators";
export * from "./decorators/interceptor.advanced";

// Pipe System
export * from "./decorators/pipe.decorators";
export * from "./decorators/pipe.advanced";
// Note: validation.pipe.ts is deprecated, use pipe.decorators.ts instead

// Exception Filters
export * from "./decorators/exception.decorators";
export * from "./decorators/formatter.decorators";
export * from "./filters/exception.filters";

// Database Registry (General-Purpose)
// Works with ANY ORM/ODM: Drizzle, Mongoose, Prisma, TypeORM, custom Database classes
export * from "./decorators/database.decorators";

// Database Plugins (Optional)
// For ORM-specific features, install a plugin:
// - @wynkjs/drizzle-plugin (Drizzle ORM with advanced features)
// - @wynkjs/mongoose-plugin (Mongoose ODM with advanced features)
// See: plugins/drizzle and plugins/mongoose

// DTO Utilities
export * from "./dto";

// Schema Registry for custom error messages
export { schemaRegistry } from "./schema-registry";

// Application Factory
export * from "./factory";

// CORS Module
export type { CorsOptions } from "./cors";
export { setupCors, validateCorsOptions } from "./cors";

// Global Prefix Module
export type { GlobalPrefixOptions } from "./global-prefix";
export {
  applyGlobalPrefix,
  normalizePrefixPath,
  validateGlobalPrefix,
  wrapWithPrefix,
} from "./global-prefix";

// Plugins
export { compression } from "./plugins/compression";
export type { CompressionOptions } from "./plugins/compression";

// Testing Module
export * from "./testing";

/**
 * Framework version
 */
export const VERSION = "1.0.0";

/**
 * Framework name
 */
export const FRAMEWORK_NAME = "WynkJS Framework";
