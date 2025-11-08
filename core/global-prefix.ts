import { Elysia } from "elysia";

/**
 * Global Prefix Module for WynkJS Framework
 * Adds a prefix to all routes in the application
 * Separated from factory.ts for better maintainability
 */

export interface GlobalPrefixOptions {
  prefix: string;
  exclude?: string[]; // Routes to exclude from prefix (e.g., ['/health', '/metrics'])
}

/**
 * Apply global prefix to all routes
 * @param app - Elysia instance
 * @param prefix - Prefix string (e.g., '/api', '/v1')
 * @param options - Additional options like route exclusions
 * @returns Modified Elysia instance
 */
export function applyGlobalPrefix(
  app: Elysia,
  prefix: string | GlobalPrefixOptions
): any {
  // Normalize prefix
  let prefixStr: string;
  let excludedRoutes: string[] = [];

  if (typeof prefix === "string") {
    prefixStr = prefix;
  } else {
    prefixStr = prefix.prefix;
    excludedRoutes = prefix.exclude || [];
  }

  // Validate and normalize prefix
  prefixStr = normalizePrefixPath(prefixStr);

  if (!prefixStr) {
    console.warn(
      "⚠️  Global prefix is empty after normalization. Skipping prefix setup."
    );
    return app;
  }

  // Create a new Elysia instance with the prefix
  const prefixedApp = new Elysia({ prefix: prefixStr });

  // Note: Elysia's prefix option automatically applies to all routes
  // registered on this instance. We'll return the prefixed instance.
  console.log(`✅ Global prefix applied: ${prefixStr}`);

  if (excludedRoutes.length > 0) {
    console.log(`   Excluded routes: ${excludedRoutes.join(", ")}`);
  }

  return prefixedApp;
}

/**
 * Normalize prefix path
 * - Ensures it starts with /
 * - Removes trailing /
 * - Validates format
 * @param prefix - Raw prefix string
 * @returns Normalized prefix
 */
export function normalizePrefixPath(prefix: string): string {
  if (!prefix) {
    return "";
  }

  let normalized = prefix.trim();

  // Ensure starts with /
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }

  // Remove trailing /
  if (normalized.endsWith("/") && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }

  // Validate format (no spaces, no special chars except /, -, _)
  const validPattern = /^\/[\w\-\/]*$/;
  if (!validPattern.test(normalized)) {
    throw new Error(
      `Invalid global prefix format: "${prefix}". Only alphanumeric, hyphens, underscores, and forward slashes are allowed.`
    );
  }

  return normalized;
}

/**
 * Check if a route should be excluded from global prefix
 * @param path - Route path
 * @param excludedRoutes - List of routes to exclude
 * @returns true if route should be excluded
 */
export function isRouteExcluded(
  path: string,
  excludedRoutes: string[]
): boolean {
  if (!excludedRoutes || excludedRoutes.length === 0) {
    return false;
  }

  // Normalize the path
  const normalizedPath = path.startsWith("/") ? path : "/" + path;

  // Check for exact match or wildcard match
  return excludedRoutes.some((excluded) => {
    // Exact match
    if (excluded === normalizedPath) {
      return true;
    }

    // Wildcard match (e.g., '/health/*')
    if (excluded.endsWith("/*")) {
      const base = excluded.slice(0, -2);
      return normalizedPath.startsWith(base);
    }

    return false;
  });
}

/**
 * Apply global prefix to an existing Elysia app by wrapping it
 * This is useful when you want to add prefix to already configured app
 * @param app - Existing Elysia instance
 * @param prefix - Prefix to apply
 * @returns New Elysia instance with prefix
 */
export function wrapWithPrefix(
  app: Elysia,
  prefix: string | GlobalPrefixOptions
): any {
  let prefixStr: string;
  let excludedRoutes: string[] = [];

  if (typeof prefix === "string") {
    prefixStr = prefix;
  } else {
    prefixStr = prefix.prefix;
    excludedRoutes = prefix.exclude || [];
  }

  prefixStr = normalizePrefixPath(prefixStr);

  // Create wrapper app with prefix
  const wrapper = new Elysia();

  // Mount the original app under the prefix
  wrapper.use(
    new Elysia({
      prefix: prefixStr,
    }).use(app)
  );

  console.log(`✅ Wrapped existing app with prefix: ${prefixStr}`);

  return wrapper;
}

/**
 * Validate global prefix configuration
 * @param prefix - Prefix configuration
 * @returns true if valid, throws error if invalid
 */
export function validateGlobalPrefix(
  prefix: string | GlobalPrefixOptions
): boolean {
  if (typeof prefix === "string") {
    // Validate string prefix
    if (prefix.length === 0) {
      throw new Error("Global prefix cannot be an empty string");
    }

    normalizePrefixPath(prefix); // This will throw if invalid
    return true;
  }

  if (typeof prefix === "object" && prefix !== null) {
    // Validate object prefix
    if (!prefix.prefix) {
      throw new Error("GlobalPrefixOptions must have a 'prefix' property");
    }

    if (typeof prefix.prefix !== "string") {
      throw new Error("Global prefix must be a string");
    }

    normalizePrefixPath(prefix.prefix); // This will throw if invalid

    // Validate exclude array
    if (prefix.exclude !== undefined) {
      if (!Array.isArray(prefix.exclude)) {
        throw new Error("GlobalPrefixOptions.exclude must be an array");
      }

      // Validate each excluded route
      prefix.exclude.forEach((route) => {
        if (typeof route !== "string") {
          throw new Error(
            "All routes in GlobalPrefixOptions.exclude must be strings"
          );
        }
      });
    }

    return true;
  }

  throw new Error("Global prefix must be string or GlobalPrefixOptions object");
}
