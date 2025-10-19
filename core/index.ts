/**
 * WynkJS Framework - Core Module
 * A high-performance framework built on Elysia with decorator support
 *
 * @author WynkJS Team
 * @license MIT
 */

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
export * from "./decorators/exception.advanced";

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

// Application Factory
export * from "./factory";

/**
 * Framework version
 */
export const VERSION = "1.0.0";

/**
 * Framework name
 */
export const FRAMEWORK_NAME = "WynkJS Framework";
