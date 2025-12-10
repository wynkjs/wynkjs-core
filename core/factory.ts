import { Elysia } from "elysia";
import "reflect-metadata";
import { container } from "tsyringe";
import { Value } from "@sinclair/typebox/value";
import {
  createExecutionContext,
  executeGuards,
} from "./decorators/guard.decorators";
import { executeInterceptors } from "./decorators/interceptor.decorators";
import { executePipes, ArgumentMetadata } from "./decorators/pipe.decorators";
import {
  executeExceptionFilters,
  HttpException,
} from "./decorators/exception.decorators";
import { ParamMetadata } from "./decorators/param.decorators";
import { ErrorFormatter } from "./decorators/formatter.decorators";
import { schemaRegistry } from "./schema-registry";
import { CorsOptions, setupCors } from "./cors";
import { applyGlobalPrefix, normalizePrefixPath } from "./global-prefix";
import {
  buildUltraOptimizedHandler,
  buildMiddlewareChain,
} from "./ultra-optimized-handler";

/**
 * Application Factory for WynkJS Framework
 * Creates and configures Elysia app with all decorators support
 */

export interface ApplicationOptions {
  cors?: boolean | CorsOptions;
  globalPrefix?: string;
  logger?: boolean;
  validationErrorFormatter?: ErrorFormatter;
  providers?: any[]; // Provider classes to register and initialize
}

export class WynkFramework {
  private app: Elysia;
  private controllers: any[] = [];
  private providers: any[] = []; // Store registered providers
  private globalGuards: any[] = [];
  private globalInterceptors: any[] = [];
  private globalPipes: any[] = [];
  private globalFilters: any[] = [];
  private validationFormatter?: ErrorFormatter;
  private shutdownHandlersRegistered = false; // Prevent duplicate signal handlers
  private globalPrefix?: string; // Store global prefix for route registration
  private isBuilt = false; // Track if build() has been called

  constructor(options: ApplicationOptions = {}) {
    this.app = new Elysia();
    this.validationFormatter = options.validationErrorFormatter;

    // Store global prefix for later use
    if (options.globalPrefix) {
      this.globalPrefix = normalizePrefixPath(options.globalPrefix);
    }

    // Register providers if provided
    if (options.providers && options.providers.length > 0) {
      this.providers.push(...options.providers);
    }

    // Apply CORS configuration
    if (options.cors) {
      setupCors(this.app, options.cors);
    }

    // Configure Elysia's error handling for validation errors
    this.app.onError(({ code, error, set, request }) => {
      // Handle ValidationError from Elysia
      if (
        code === "VALIDATION" ||
        (error as any)?.constructor?.name === "ValidationError"
      ) {
        const validationError = error as any;
        set.status = 400;

        // Get the validation type (body, query, params)
        const validationType = validationError.on || "body";

        // Try to find the schema key for this route
        const method = request.method;
        const path = new URL(request.url).pathname;
        const schemaKey = schemaRegistry.getSchemaKeyForRoute(
          method,
          path,
          validationType
        );

        // Try to collect all validation errors using TypeBox
        const allErrors: Record<string, string[]> = {};

        // Check if we have the validator and value to collect all errors
        if (validationError.validator && validationError.value) {
          const schema =
            validationError.validator.schema || validationError.validator;

          // Use TypeBox's Errors iterator to collect ALL validation errors
          try {
            const errors = [...Value.Errors(schema, validationError.value)];

            if (errors.length > 0) {
              errors.forEach((err: any) => {
                const field = err.path?.replace(/^\//, "") || "unknown";
                if (!allErrors[field]) {
                  allErrors[field] = [];
                }

                // Try to get custom error message from schema registry
                let message = err.message || "Validation failed";
                if (schemaKey) {
                  const customMessage = schemaRegistry.getErrorMessage(
                    schemaKey,
                    field
                  );
                  if (customMessage) {
                    message = customMessage;
                  }
                }

                allErrors[field].push(message);
              });
            } else {
              // Fallback to single error
              const field =
                validationError.valueError?.path?.replace(/^\//, "") ||
                validationError.on ||
                "body";
              let message =
                validationError.customError ||
                validationError.valueError?.message ||
                "Validation failed";

              // Try to get custom error message
              if (schemaKey) {
                const customMessage = schemaRegistry.getErrorMessage(
                  schemaKey,
                  field
                );
                if (customMessage) {
                  message = customMessage;
                }
              }

              allErrors[field] = [message];
            }
          } catch (e) {
            // Fallback to single error if TypeBox iteration fails
            const field =
              validationError.valueError?.path?.replace(/^\//, "") ||
              validationError.on ||
              "body";
            let message =
              validationError.customError ||
              validationError.valueError?.message ||
              "Validation failed";

            // Try to get custom error message
            if (schemaKey) {
              const customMessage = schemaRegistry.getErrorMessage(
                schemaKey,
                field
              );
              if (customMessage) {
                message = customMessage;
              }
            }

            allErrors[field] = [message];
          }
        } else {
          // Fallback to single error
          const field =
            validationError.valueError?.path?.replace(/^\//, "") ||
            validationError.on ||
            "body";
          let message =
            validationError.customError ||
            validationError.valueError?.message ||
            "Validation failed";

          // Try to get custom error message
          if (schemaKey) {
            const customMessage = schemaRegistry.getErrorMessage(
              schemaKey,
              field
            );
            if (customMessage) {
              message = customMessage;
            }
          }

          allErrors[field] = [message];
        }

        // If a custom formatter is provided, use it
        if (this.validationFormatter) {
          // Convert allErrors to the format expected by formatters
          const formattedError = {
            errors: Object.entries(allErrors).map(([field, messages]) => ({
              path: `/${field}`,
              summary: messages[0],
              message: messages.join(", "),
            })),
          };
          return this.validationFormatter.format(formattedError);
        }

        // Default format: { statusCode, message, errors: { field: [messages] } }
        return {
          statusCode: 400,
          message: "Validation failed",
          errors: allErrors,
        };
      }

      // Default error handling
      const err = error as any;
      set.status = err.status || 500;
      return {
        statusCode: err.status || 500,
        message: err.message || "Internal server error",
        error: err.name || "Error",
      };
    });

    // Apply global prefix if specified
    if (options.globalPrefix) {
      // Global prefix is handled during route registration
      console.log(`✅ Global prefix configured: ${this.globalPrefix}`);
    }

    return this;
  }

  /**
   * Static convenience creator to align with documentation examples
   */
  static create(
    options: ApplicationOptions & {
      controllers?: any[];
      providers?: any[];
    } = {}
  ): WynkFramework {
    const app = new WynkFramework(options);

    // Don't re-register providers/controllers if they were already added in constructor
    // The constructor already handles options.providers

    if (options.controllers && options.controllers.length) {
      app.registerControllers(...options.controllers);
    }

    return app;
  }

  /**
   * Register providers with the application
   * Providers are singleton services that are initialized when the app starts
   */
  registerProviders(...providers: any[]): this {
    this.providers.push(...providers);
    return this;
  }

  /**
   * Register controllers with the application
   */
  registerControllers(...controllers: any[]): this {
    this.controllers.push(...controllers);
    return this;
  }

  /**
   * Register global guards
   */
  useGlobalGuards(...guards: any[]): this {
    this.globalGuards.push(...guards);
    return this;
  }

  /**
   * Register global interceptors
   */
  useGlobalInterceptors(...interceptors: any[]): this {
    this.globalInterceptors.push(...interceptors);
    return this;
  }

  /**
   * Register global pipes
   */
  useGlobalPipes(...pipes: any[]): this {
    this.globalPipes.push(...pipes);
    return this;
  }

  /**
   * Register global exception filters
   */
  useGlobalFilters(...filters: any[]): this {
    this.globalFilters.push(...filters);
    return this;
  }

  /**
   * Initialize all registered providers
   * Providers with onModuleInit() method will be called
   */
  private async initializeProviders(): Promise<void> {
    console.log(`🔧 Initializing ${this.providers.length} providers...`);

    for (const ProviderClass of this.providers) {
      try {
        console.log(`  ⚙️  Initializing provider: ${ProviderClass.name}`);

        // Resolve provider instance from DI container
        const instance: any = container.resolve(ProviderClass);

        // Check if provider has onModuleInit lifecycle hook
        if (typeof instance.onModuleInit === "function") {
          await instance.onModuleInit();
          console.log(`  ✅ ${ProviderClass.name} initialized successfully`);
        } else {
          // Just register in container for injection
          console.log(`  ✅ ${ProviderClass.name} registered in container`);
        }
      } catch (error) {
        console.error(
          `  ❌ Failed to initialize provider ${ProviderClass.name}:`,
          error
        );
        throw new Error(
          `Provider initialization failed for ${ProviderClass.name}: ${
            (error as any).message
          }`
        );
      }
    }

    console.log(`✅ All providers initialized successfully\n`);
  }

  /**
   * Build the application - register all routes
   */
  async build(): Promise<Elysia> {
    // Initialize providers first (database connections, etc.)
    if (this.providers.length > 0) {
      await this.initializeProviders();
    }
    // Register global error handler if filters exist
    if (this.globalFilters.length > 0) {
      this.app.onError(async ({ error, set, request }) => {
        console.log("🔴 ELYSIA ON_ERROR HOOK TRIGGERED");
        console.log("Error:", (error as any)?.message || String(error));
        console.log("Global filters:", this.globalFilters.length);

        // Create a simple execution context
        const executionContext = {
          getRequest: () => request,
          getResponse: () => set,
          getContext: () => ({ request, set }),
          getHandler: () => null,
          getClass: () => null,
        } as any;

        try {
          const result = await executeExceptionFilters(
            this.globalFilters,
            error,
            executionContext
          );

          if (result) {
            if (result.statusCode) {
              set.status = result.statusCode;
            }
            return result;
          }
        } catch (filterError) {
          console.error("Filter error:", filterError);
        }

        // Fallback error handling
        set.status = 500;
        return {
          statusCode: 500,
          message: (error as any)?.message || "Internal server error",
          error: "Internal Server Error",
        };
      });
    }

    for (const ControllerClass of this.controllers) {
      await this.registerController(ControllerClass);
    }

    this.isBuilt = true;
    return this.app;
  }

  /**
   * Cleanup all providers when app shuts down
   * Providers with onModuleDestroy() method will be called
   */
  private async destroyProviders(): Promise<void> {
    console.log(`\n🔧 Cleaning up ${this.providers.length} providers...`);

    for (const ProviderClass of this.providers) {
      try {
        // Resolve provider instance from DI container
        const instance: any = container.resolve(ProviderClass);

        // Check if provider has onModuleDestroy lifecycle hook
        if (typeof instance.onModuleDestroy === "function") {
          console.log(`  🧹 Destroying provider: ${ProviderClass.name}`);
          await instance.onModuleDestroy();
          console.log(`  ✅ ${ProviderClass.name} destroyed successfully`);
        }
      } catch (error) {
        console.error(
          `  ❌ Failed to destroy provider ${ProviderClass.name}:`,
          error
        );
        // Continue cleanup even if one provider fails
      }
    }

    console.log(`✅ All providers cleaned up\n`);
  }

  /**
   * Use an Elysia plugin or middleware (fully compatible with Elysia.js ecosystem)
   *
   * This method directly proxies to Elysia's use() method, making all Elysia plugins
   * and middleware work seamlessly with WynkJS.
   *
   * @param plugin - Any Elysia plugin or instance
   * @returns this for method chaining
   *
   * @example
   * ```typescript
   * import { WynkFactory } from "wynkjs";
   * import { compression } from "wynkjs";
   * import { cors } from "@elysiajs/cors";
   * import { swagger } from "@elysiajs/swagger";
   * import { jwt } from "@elysiajs/jwt";
   *
   * const app = WynkFactory.create({
   *   controllers: [UserController],
   * });
   *
   * // Use WynkJS built-in plugins
   * app.use(compression({ threshold: 1024 }));
   *
   * // Use any Elysia plugin from npm
   * app.use(cors());
   * app.use(swagger());
   * app.use(jwt({ name: 'jwt', secret: 'secret' }));
   *
   * await app.listen(3000);
   * ```
   */
  use(...plugins: any[]): this {
    (this.app.use as any)(...plugins);
    return this;
  }

  /**
   * Start listening on a port
   */
  async listen(port: number): Promise<void> {
    await this.build();
    this.app.listen(port);
    console.log(`🚀 Application is running on http://localhost:${port}`);

    // Register signal handlers only once to prevent memory leaks
    if (!this.shutdownHandlersRegistered) {
      this.shutdownHandlersRegistered = true;

      // Setup graceful shutdown handlers
      const gracefulShutdown = async (signal: string) => {
        console.log(`\n📡 Received ${signal}, shutting down gracefully...`);

        try {
          // Cleanup providers (close database connections, etc.)
          await this.destroyProviders();

          // Stop the Elysia server
          await this.app.stop();

          console.log("👋 Application shut down successfully");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      };

      // Register signal handlers (only once)
      process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.once("SIGINT", () => gracefulShutdown("SIGINT"));
    }
  }

  /**
   * Get the underlying Elysia instance
   */
  getApp(): Elysia {
    return this.app;
  }

  /**
   * Handle an HTTP request
   * Automatically builds the app if not already built
   */
  async handle(request: Request): Promise<Response> {
    if (!this.isBuilt) {
      await this.build();
    }
    return this.app.handle(request);
  }

  /**
   * Register a single controller
   */
  private async registerController(ControllerClass: any): Promise<void> {
    // Use tsyringe container to resolve controller with all dependencies
    const instance: any = container.resolve(ControllerClass);
    const basePath = Reflect.getMetadata("basePath", ControllerClass) || "";

    // Try reading from multiple locations
    const routes1 = Reflect.getMetadata("routes", ControllerClass) || [];
    const routes2 =
      Reflect.getMetadata("routes", ControllerClass.prototype) || [];
    const routes3 = Reflect.getMetadata("controller:routes", instance) || [];

    console.log(`🔍 Routes on ControllerClass: ${routes1.length}`);
    console.log(`🔍 Routes on prototype: ${routes2.length}`);
    console.log(`🔍 Routes on instance: ${routes3.length}`);

    const routes =
      routes1.length > 0 ? routes1 : routes2.length > 0 ? routes2 : routes3;

    console.log(
      `📦 Registering controller ${ControllerClass.name} with ${routes.length} routes`
    );

    const controllerGuards =
      Reflect.getMetadata("guards", ControllerClass) || [];
    const controllerInterceptors =
      Reflect.getMetadata("interceptors", ControllerClass) || [];
    const controllerPipes = Reflect.getMetadata("pipes", ControllerClass) || [];
    const controllerFilters =
      Reflect.getMetadata("filters", ControllerClass) || [];

    // Get @Use() middleware (simple pattern like user's working code)
    const controllerUses = Reflect.getMetadata("uses", ControllerClass) || [];

    for (const route of routes) {
      // Apply global prefix to route path
      let fullPath = basePath + route.path;
      if (this.globalPrefix) {
        fullPath = this.globalPrefix + fullPath;
      }

      const method = route.method.toLowerCase();
      const methodName = route.methodName;

      // Get method-specific metadata
      const methodGuards =
        Reflect.getMetadata("guards", instance, methodName) || [];
      const methodInterceptors =
        Reflect.getMetadata("interceptors", instance, methodName) || [];
      const methodPipes =
        Reflect.getMetadata("pipes", instance, methodName) || [];
      const methodFilters =
        Reflect.getMetadata("filters", instance, methodName) || [];

      // Get @Use() middleware for this method
      const methodUses =
        Reflect.getMetadata("uses", instance, methodName) || [];

      const params: ParamMetadata[] =
        Reflect.getMetadata("params", instance, methodName) || [];

      // Sort params once during registration, not on every request
      if (params.length > 0) {
        params.sort((a, b) => a.index - b.index);
      }

      const httpCode = Reflect.getMetadata(
        "route:httpCode",
        instance,
        methodName
      );
      const headers = Reflect.getMetadata(
        "route:headers",
        instance,
        methodName
      );
      const redirect = Reflect.getMetadata(
        "route:redirect",
        instance,
        methodName
      );

      // Combine guards, interceptors, pipes, filters
      // Order: method -> controller -> global (method is innermost/closest to handler)
      const allGuards = [
        ...this.globalGuards,
        ...controllerGuards,
        ...methodGuards,
      ];
      const allInterceptors = [
        ...methodInterceptors,
        ...controllerInterceptors,
        ...this.globalInterceptors,
      ];
      const allPipes = [
        ...this.globalPipes,
        ...controllerPipes,
        ...methodPipes,
      ];
      const allFilters = [
        ...this.globalFilters,
        ...controllerFilters,
        ...methodFilters,
      ];

      // Get route options (for body validation schema)
      const routeOptions = route.options || {};
      const bodySchema = Reflect.getMetadata(
        "route:bodySchema",
        instance,
        methodName
      );
      if (bodySchema && !routeOptions.body) {
        routeOptions.body = bodySchema;
      }

      // ⚡ ULTRA-OPTIMIZED HANDLER - Use specialized builder
      // This eliminates nested async/await and IIFEs for maximum performance
      const handler = buildUltraOptimizedHandler({
        instance,
        methodName,
        ControllerClass,
        params,
        allGuards,
        allInterceptors,
        allPipes,
        allFilters,
        httpCode,
        headers,
        redirect,
        routePath: route.path,
        routeMethod: method.toUpperCase(),
      });

      // Wrap handler with @Use() middleware if present
      // Combine controller and method middleware
      const allUses = [...controllerUses, ...methodUses];

      let finalHandler = handler;

      if (allUses.length > 0) {
        finalHandler = buildMiddlewareChain(handler, allUses);
      }

      // Register route with Elysia
      const elysiaOptions: any = {};

      if (routeOptions.body || bodySchema) {
        const schema = routeOptions.body || bodySchema;
        elysiaOptions.body = schema;

        // Register schema with custom error messages
        const schemaKey = `${ControllerClass.name}.${methodName}.body`;
        schemaRegistry.registerSchema(schemaKey, schema);
        schemaRegistry.registerRoute(method, fullPath, schemaKey, "body");
      }
      if (routeOptions.query) {
        elysiaOptions.query = routeOptions.query;

        // Register query schema
        const schemaKey = `${ControllerClass.name}.${methodName}.query`;
        schemaRegistry.registerSchema(schemaKey, routeOptions.query);
        schemaRegistry.registerRoute(method, fullPath, schemaKey, "query");
      }
      if (routeOptions.params) {
        elysiaOptions.params = routeOptions.params;

        // Register params schema
        const schemaKey = `${ControllerClass.name}.${methodName}.params`;
        schemaRegistry.registerSchema(schemaKey, routeOptions.params);
        schemaRegistry.registerRoute(method, fullPath, schemaKey, "params");
      }
      if (routeOptions.headers) {
        elysiaOptions.headers = routeOptions.headers;
      }

      // Register with options if any validation schemas are present

      if (Object.keys(elysiaOptions).length > 0) {
        (this.app as any)[method](fullPath, finalHandler, elysiaOptions);
      } else {
        (this.app as any)[method](fullPath, finalHandler);
      }
    }
  }
}

/**
 * Factory function to create a new application
 */
export function createApp(options: ApplicationOptions = {}): WynkFramework {
  return new WynkFramework(options);
}

/**
 * Alias for WynkFramework with static create method
 */
export class WynkFactory {
  static create(
    options: ApplicationOptions & {
      controllers?: any[];
      providers?: any[];
    } = {}
  ): WynkFramework {
    const app = new WynkFramework(options);

    // Don't re-register providers if they were already added in constructor
    // The constructor already handles options.providers

    if (options.controllers) {
      app.registerControllers(...options.controllers);
    }

    return app;
  }
}

// Export ElysiaFramework as alias for backwards compatibility
export { WynkFramework as ElysiaFramework };
