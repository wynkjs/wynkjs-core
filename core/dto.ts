/**
 * DTO Utilities for WynkJS Framework
 * Re-exports Elysia's TypeBox for DTO validation
 */

import { t } from "elysia";

/**
 * Export Elysia's TypeBox as DTO builder
 * This provides runtime validation for request bodies, queries, params, etc.
 *
 * @example
 * import { DTO } from '@wynkjs/framework';
 *
 * export const CreateUserDTO = DTO.Object({
 *   name: DTO.String({ minLength: 2, maxLength: 50 }),
 *   email: DTO.String({ format: 'email' }),
 *   age: DTO.Optional(DTO.Number({ minimum: 18 })),
 * });
 *
 * @Controller('/users')
 * export class UserController {
 *   @Post({ body: CreateUserDTO })
 *   async create(@Body() data: any) {
 *     // data is automatically validated against CreateUserDTO
 *     return { created: data };
 *   }
 * }
 */
// Note: Elysia's type builder exposes internal option types that TypeScript
// cannot emit in d.ts files (TS4023). To keep declaration generation clean
// while preserving runtime behavior, we export DTO with an `any` type.
// Consumers still get runtime validation; for static typing, prefer using
// `Static<TSchema>` from Elysia which we re-export below.
export const DTO: any = t;

/**
 * Helper to attach strict validation to a DTO Object schema
 * Sets additionalProperties to false which makes Elysia strip unknown fields
 *
 * NOTE: Elysia's default behavior is to STRIP additional properties, not throw errors.
 * This is secure by default. If you need to throw errors on unknown properties,
 * use the approach documented in STRICT_VALIDATION.md
 *
 * @param properties - Object properties schema
 * @param options - Additional schema options
 * @returns TypeBox schema with additionalProperties: false
 *
 * @example
 * export const UserDTO = DTO.Strict({
 *   email: DTO.String(),
 *   age: DTO.Number()
 * });
 *
 * // Request: { email: "test@test.com", age: 25, extra: "field" }
 * // Result: { email: "test@test.com", age: 25 } ← extra stripped (secure)
 */
DTO.Strict = (
  properties: Record<string, any>,
  options: Record<string, any> = {}
) => {
  return t.Object(properties, {
    ...options,
    additionalProperties: false,
  });
};

/**
 * Common DTO patterns for quick use
 */
export const CommonDTO = {
  /**
   * Name validation (2-50 characters)
   */
  Name: (options = {}) => t.String({ minLength: 2, maxLength: 50, ...options }),

  /**
   * Email validation
   * Uses format: email which validates basic email structure
   */
  Email: (options: any = {}) =>
    t.String({
      format: "email",
      error: "Invalid email address",
      ...options,
    }),

  /**
   * Password validation (min 6 characters)
   */
  Password: (options = {}) => t.String({ minLength: 6, ...options }),

  /**
   * UUID validation
   */
  UUID: (options = {}) => t.String({ format: "uuid", ...options }),

  /**
   * URL validation
   */
  URL: (options = {}) => t.String({ format: "uri", ...options }),

  /**
   * Date string validation (ISO 8601)
   */
  DateString: (options = {}) => t.String({ format: "date-time", ...options }),

  /**
   * Phone number (Indian format)
   */
  PhoneIN: (options = {}) =>
    t.String({
      pattern: "^[6-9]{1}[0-9]{9}$",
      errorMessage: "Invalid mobile number",
      ...options,
    }),

  /**
   * Integer ID
   */
  ID: (options = {}) => t.Number({ minimum: 1, ...options }),

  /**
   * Pagination query
   */
  Pagination: () =>
    t.Object({
      page: t.Optional(t.Number({ minimum: 1, default: 1 })),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 10 })),
    }),

  /**
   * Sort query
   */
  Sort: (fields: string[]) =>
    t.Object({
      sortBy: t.Optional(t.Union(fields.map((f) => t.Literal(f)))),
      sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    }),
};

/**
 * Export TypeBox types for TypeScript inference
 */
export type { TSchema, Static } from "elysia";
