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
 * Common DTO patterns for quick use
 */
export const CommonDTO = {
  /**
   * Name validation (2-50 characters)
   */
  Name: (options = {}) => t.String({ minLength: 2, maxLength: 50, ...options }),

  /**
   * Email validation
   */
  Email: (options = {}) => t.String({ format: "email", ...options }),

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
