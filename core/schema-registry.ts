/**
 * Schema Registry for storing and retrieving custom error messages
 * This allows validation pipes to look up custom error messages from schemas
 */

interface SchemaErrorMessages {
  [schemaKey: string]: {
    [fieldPath: string]: string;
  };
}

interface RouteSchemaMap {
  [routeKey: string]: {
    // routeKey format: "POST:/users/:id"
    schemaKey: string;
    validationType: "body" | "query" | "params";
  }[];
}

class SchemaRegistry {
  private static instance: SchemaRegistry;
  private errorMessages: SchemaErrorMessages = {};
  private routeSchemas: RouteSchemaMap = {};

  private constructor() {}

  static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  /**
   * Register custom error messages for a schema
   * @param schemaKey Unique key for the schema (e.g., class name + method)
   * @param schema The TypeBox schema object
   */
  registerSchema(schemaKey: string, schema: any): void {
    if (!schema || typeof schema !== "object") return;

    const messages: { [fieldPath: string]: string } = {};
    this.extractErrorMessages(schema, "", messages);

    if (Object.keys(messages).length > 0) {
      this.errorMessages[schemaKey] = messages;
    }
  }

  /**
   * Register route-to-schema mapping
   * @param method HTTP method (GET, POST, etc.)
   * @param path Route path
   * @param schemaKey The schema key
   * @param validationType Type of validation (body, query, params)
   */
  registerRoute(
    method: string,
    path: string,
    schemaKey: string,
    validationType: "body" | "query" | "params"
  ): void {
    const routeKey = `${method.toUpperCase()}:${path}`;

    if (!this.routeSchemas[routeKey]) {
      this.routeSchemas[routeKey] = [];
    }

    this.routeSchemas[routeKey].push({ schemaKey, validationType });
  }

  /**
   * Get schema key for a route and validation type
   * @param method HTTP method
   * @param path Route path (actual request path with values)
   * @param validationType Type of validation
   * @returns Schema key or undefined
   */
  getSchemaKeyForRoute(
    method: string,
    path: string,
    validationType: "body" | "query" | "params"
  ): string | undefined {
    // First try exact match
    const exactKey = `${method.toUpperCase()}:${path}`;
    if (this.routeSchemas[exactKey]) {
      const found = this.routeSchemas[exactKey].find(
        (s) => s.validationType === validationType
      );
      if (found) return found.schemaKey;
    }

    // If no exact match, try to match patterns
    // e.g., request path "/users/10/100" should match pattern "/users/:id1/:id2"
    for (const [routeKey, schemas] of Object.entries(this.routeSchemas)) {
      // Split only on the first colon to separate method from path
      const colonIndex = routeKey.indexOf(":");
      const routeMethod = routeKey.substring(0, colonIndex);
      const routePath = routeKey.substring(colonIndex + 1);

      if (routeMethod !== method.toUpperCase()) continue;

      // Check if the routePath is a pattern (contains :param)
      if (routePath.includes(":")) {
        // Convert pattern to regex
        const pattern = routePath
          .replace(/:[^/]+/g, "([^/]+)") // Replace :param with regex group
          .replace(/\//g, "\\/"); // Escape slashes

        const regex = new RegExp(`^${pattern}$`);

        if (regex.test(path)) {
          const found = schemas.find(
            (s) => s.validationType === validationType
          );
          if (found) return found.schemaKey;
        }
      }
    }

    return undefined;
  }

  /**
   * Recursively extract error messages from schema
   */
  private extractErrorMessages(
    schema: any,
    path: string,
    messages: { [fieldPath: string]: string }
  ): void {
    // Check for custom error message at current level
    if (schema.error || schema.errorMessage) {
      messages[path || "root"] = schema.error || schema.errorMessage;
    }

    // Recurse into object properties
    if (schema.type === "object" && schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const newPath = path ? `${path}.${key}` : key;
        this.extractErrorMessages(value, newPath, messages);
      }
    }

    // Recurse into array items
    if (schema.type === "array" && schema.items) {
      const newPath = path ? `${path}[]` : "[]";
      this.extractErrorMessages(schema.items, newPath, messages);
    }
  }

  /**
   * Get custom error message for a field path
   * @param schemaKey The schema key
   * @param fieldPath The field path (e.g., "user.email")
   * @returns Custom error message or undefined
   */
  getErrorMessage(schemaKey: string, fieldPath: string): string | undefined {
    const schemaMessages = this.errorMessages[schemaKey];
    if (!schemaMessages) return undefined;

    // Try exact match first
    if (schemaMessages[fieldPath]) {
      return schemaMessages[fieldPath];
    }

    // Try without array indices (e.g., "items.0.name" -> "items[].name")
    const normalizedPath = fieldPath.replace(/\.\d+\./g, "[].");
    if (schemaMessages[normalizedPath]) {
      return schemaMessages[normalizedPath];
    }

    return undefined;
  }

  /**
   * Clear all registered schemas (useful for testing)
   */
  clear(): void {
    this.errorMessages = {};
    this.routeSchemas = {};
  }
}

export const schemaRegistry = SchemaRegistry.getInstance();
