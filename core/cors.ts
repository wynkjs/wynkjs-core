import { Elysia } from "elysia";

/**
 * CORS Configuration Module for WynkJS Framework
 * Separated from factory.ts for better maintainability
 */

export interface CorsOptions {
  origin?:
    | string
    | string[]
    | RegExp
    | ((origin: string) => boolean | Promise<boolean>);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflight?: boolean;
}

/**
 * Setup CORS for Elysia application
 * @param app - Elysia instance
 * @param corsOptions - CORS configuration (true for defaults, or custom config)
 * @throws Error if @elysiajs/cors is not installed
 */
export function setupCors(
  app: Elysia,
  corsOptions: boolean | CorsOptions
): void {
  try {
    // Try to import @elysiajs/cors
    const { cors } = require("@elysiajs/cors");

    if (corsOptions === true) {
      // Simple CORS - allow all origins
      app.use(cors());
      console.log("✅ CORS enabled (all origins allowed)");
    } else if (typeof corsOptions === "object") {
      // Advanced CORS configuration
      const config: any = {};

      // Handle origin option (supports function, string, array, RegExp)
      if (typeof corsOptions.origin === "function") {
        // Convert function to Elysia's format
        const originFn = corsOptions.origin;
        config.origin = async (request: Request) => {
          const origin = request.headers.get("origin") || "";
          const allowed = await originFn(origin);
          return allowed ? origin : false;
        };
      } else if (corsOptions.origin) {
        config.origin = corsOptions.origin;
      }

      // Methods
      if (corsOptions.methods) {
        config.methods = Array.isArray(corsOptions.methods)
          ? corsOptions.methods.join(",")
          : corsOptions.methods;
      }

      // Allowed headers
      if (corsOptions.allowedHeaders) {
        config.allowedHeaders = Array.isArray(corsOptions.allowedHeaders)
          ? corsOptions.allowedHeaders.join(",")
          : corsOptions.allowedHeaders;
      }

      // Exposed headers
      if (corsOptions.exposedHeaders) {
        config.exposedHeaders = Array.isArray(corsOptions.exposedHeaders)
          ? corsOptions.exposedHeaders.join(",")
          : corsOptions.exposedHeaders;
      }

      // Credentials
      if (corsOptions.credentials !== undefined) {
        config.credentials = corsOptions.credentials;
      }

      // Max age
      if (corsOptions.maxAge !== undefined) {
        config.maxAge = corsOptions.maxAge;
      }

      // Preflight
      if (corsOptions.preflight !== undefined) {
        config.preflight = corsOptions.preflight;
      }

      app.use(cors(config));
      console.log("✅ CORS enabled with custom configuration");
    }
  } catch (error) {
    console.error("❌ Failed to enable CORS: @elysiajs/cors package not found");
    console.error("   Install it with: bun add @elysiajs/cors");
    console.error(
      "   Or remove cors option from ApplicationOptions to skip CORS setup"
    );
    throw new Error(
      "CORS configuration failed: @elysiajs/cors package is required"
    );
  }
}

/**
 * Validate CORS configuration
 * @param corsOptions - CORS configuration to validate
 * @returns true if valid, throws error if invalid
 */
export function validateCorsOptions(
  corsOptions: boolean | CorsOptions
): boolean {
  if (typeof corsOptions === "boolean") {
    return true;
  }

  if (typeof corsOptions === "object") {
    // Validate origin
    if (corsOptions.origin !== undefined) {
      const validOriginTypes = [
        "string",
        "function",
        "object", // array or RegExp
      ];
      const originType = typeof corsOptions.origin;

      if (!validOriginTypes.includes(originType)) {
        throw new Error(
          `Invalid CORS origin type: ${originType}. Must be string, array, RegExp, or function.`
        );
      }

      // Validate array of strings
      if (Array.isArray(corsOptions.origin)) {
        if (!corsOptions.origin.every((o) => typeof o === "string")) {
          throw new Error("CORS origin array must contain only strings (URLs)");
        }
      }
    }

    // Validate methods
    if (corsOptions.methods !== undefined) {
      if (
        typeof corsOptions.methods !== "string" &&
        !Array.isArray(corsOptions.methods)
      ) {
        throw new Error("CORS methods must be string or array of strings");
      }
    }

    // Validate maxAge
    if (
      corsOptions.maxAge !== undefined &&
      typeof corsOptions.maxAge !== "number"
    ) {
      throw new Error("CORS maxAge must be a number");
    }

    // Validate credentials
    if (
      corsOptions.credentials !== undefined &&
      typeof corsOptions.credentials !== "boolean"
    ) {
      throw new Error("CORS credentials must be a boolean");
    }

    return true;
  }

  throw new Error("CORS options must be boolean or CorsOptions object");
}
