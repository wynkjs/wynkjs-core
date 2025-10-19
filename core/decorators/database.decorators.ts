import "reflect-metadata";
import { container, inject } from "tsyringe";

/**
 * WynkJS Database Decorators
 * 
 * Simple and lightweight decorators using tsyringe DI container.
 * Works with ANY database pattern:
 * - Drizzle ORM
 * - Mongoose ODM
 * - Prisma
 * - TypeORM
 * - Custom Database classes
 * 
 * Usage:
 * ```typescript
 * @injectable()
 * class UserService {
 *   constructor(@InjectTable(userTable) private table: typeof userTable) {}
 * }
 * ```
 */

const TABLE_TOKEN_PREFIX = "TABLE_";
const MODEL_TOKEN_PREFIX = "MODEL_";
const TABLE_REGISTRY = new Map<any, string>();
const MODEL_REGISTRY = new Map<any, string>();

/**
 * Create or get a unique token for a table
 */
function getOrCreateTableToken(table: any): string {
  if (TABLE_REGISTRY.has(table)) {
    return TABLE_REGISTRY.get(table)!;
  }

  // Generate a unique token
  const token = TABLE_TOKEN_PREFIX + TABLE_REGISTRY.size;
  TABLE_REGISTRY.set(table, token);

  // Register the table immediately
  if (!container.isRegistered(token)) {
    container.register(token, { useValue: table });
  }

  return token;
}

/**
 * Create or get a unique token for a model
 */
function getOrCreateModelToken(model: any): string {
  if (MODEL_REGISTRY.has(model)) {
    return MODEL_REGISTRY.get(model)!;
  }

  // Generate a unique token
  const token = MODEL_TOKEN_PREFIX + MODEL_REGISTRY.size;
  MODEL_REGISTRY.set(model, token);

  // Register the model immediately
  if (!container.isRegistered(token)) {
    container.register(token, { useValue: model });
  }

  return token;
}

/**
 * Inject a table into constructor parameter
 * 
 * @example
 * ```typescript
 * @injectable()
 * class UserService {
 *   constructor(@InjectTable(userTable) private table: typeof userTable) {}
 * }
 * ```
 */
export function InjectTable(table: any): ParameterDecorator {
  const token = getOrCreateTableToken(table);
  return inject(token) as ParameterDecorator;
}

/**
 * Inject a model into constructor parameter
 * 
 * @example
 * ```typescript
 * @injectable()
 * class UserService {
 *   constructor(@InjectModel(User) private userModel: typeof User) {}
 * }
 * ```
 */
export function InjectModel(model: any): ParameterDecorator {
  const token = getOrCreateModelToken(model);
  return inject(token) as ParameterDecorator;
}

/**
 * Register multiple tables at once
 * Call this at application startup
 * 
 * @example
 * ```typescript
 * registerTables({
 *   userTable,
 *   postTable,
 *   commentTable,
 * });
 * ```
 */
export function registerTables(tables: Record<string, any>): void {
  for (const [name, table] of Object.entries(tables)) {
    const token = getOrCreateTableToken(table);
    if (!container.isRegistered(token)) {
      container.register(token, { useValue: table });
    }
  }
}

/**
 * Register multiple models at once
 * Call this at application startup
 * 
 * @example
 * ```typescript
 * registerModels({
 *   User,
 *   Post,
 *   Comment,
 * });
 * ```
 */
export function registerModels(models: Record<string, any>): void {
  for (const [name, model] of Object.entries(models)) {
    const token = getOrCreateModelToken(model);
    if (!container.isRegistered(token)) {
      container.register(token, { useValue: model });
    }
  }
}

// Re-export tsyringe decorators for convenience
export { injectable, inject, singleton, container } from "tsyringe";
