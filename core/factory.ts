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

/**
 * A provider that registers a static value under a token.
 *
 * @example
 * ```typescript
 * WynkFactory.create({
 *   providers: [{ provide: 'CONFIG', useValue: { port: 3000 } }],
 * });
 * // Inject with: @Inject('CONFIG') config: any
 * ```
 */
export interface ValueProvider {
  /** Injection token (string, symbol, or class constructor). */
  provide: any;
  /** The static value to register under the token. */
  useValue: any;
}

/**
 * A provider that calls a factory function (optionally with injected deps) to create the value.
 *
 * @example
 * ```typescript
 * WynkFactory.create({
 *   providers: [{ provide: 'DB', useFactory: (cfg) => createDb(cfg), inject: ['CONFIG'] }],
 * });
 * ```
 */
export interface FactoryProvider {
  /** Injection token. */
  provide: any;
  /** Factory function. Return value is registered under the token. */
  useFactory: (...args: any[]) => any;
  /** Tokens whose resolved values are passed as arguments to `useFactory`. */
  inject?: any[];
}

/**
 * A provider that maps a token to an already-registered token (alias).
 *
 * @example
 * ```typescript
 * WynkFactory.create({
 *   providers: [
 *     DatabaseService,
 *     { provide: 'IDatabase', useExisting: DatabaseService },
 *   ],
 * });
 * ```
 */
export interface ExistingProvider {
  /** Injection token to create an alias for. */
  provide: any;
  /** Token of the already-registered provider to alias. */
  useExisting: any;
}

/**
 * A provider that registers a class as itself (standard `@Injectable()` usage).
 * Equivalent to passing the class directly in the `providers` array.
 */
export interface ClassProvider {
  /** Injection token — must match `useClass`. */
  provide: any;
  /** Class to instantiate and register. */
  useClass: any;
}

/** Union of all supported provider definition shapes. */
export type Provider =
  | any
  | ValueProvider
  | FactoryProvider
  | ExistingProvider
  | ClassProvider;

/**
 * Options passed to `WynkFactory.create()` to configure the application.
 *
 * @example
 * WynkFactory.create({
 *   controllers: [UserController],
 *   providers: [DatabaseService],
 *   cors: true,
 *   globalPrefix: '/api/v1',
 *   validationErrorFormatter: new DetailedErrorFormatter(),
 * });
 */
export interface ApplicationOptions {
  /** Enable CORS. Pass `true` to allow all origins, or a `CorsOptions` object for fine-grained control. */
  cors?: boolean | CorsOptions;
  /** Prefix prepended to every registered route path (e.g. `'/api/v1'`). */
  globalPrefix?: string;
  /** Reserved for future request logging support. */
  logger?: boolean;
  /** Formatter applied to TypeBox validation errors before responding to the client. */
  validationErrorFormatter?: ErrorFormatter;
  /** Provider classes or provider token objects to initialize before routes are registered. */
  providers?: Provider[];
  /** `@Module()`-decorated classes whose controllers and providers are merged into the app. */
  modules?: any[];
}

export class WynkFramework {
  private app: Elysia;
  private controllers: any[] = [];
  private providers: any[] = []; // Store registered providers
  private controllerTags: Map<any, string> = new Map();
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
    }

    return this;
  }

  /**
   * Create a new `WynkFramework` application instance.
   *
   * This is the recommended entry point for bootstrapping a WynkJS app.
   * Pass controllers, providers, and configuration options in a single call.
   * Call `listen()` to start the server, or `handle()` to process requests directly
   * (useful in tests or serverless environments).
   *
   * @param options - Application configuration including controllers, providers, CORS,
   *   global prefix, and validation formatter
   * @returns A fully configured `WynkFramework` instance (not yet started)
   *
   * @example
   * ```typescript
   * const app = WynkFactory.create({
   *   controllers: [UserController, ProductController],
   *   providers: [DatabaseService],
   *   cors: true,
   *   globalPrefix: '/api/v1',
   * });
   *
   * await app.listen(3000);
   * ```
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
   * Register one or more providers (injectable services) with the application.
   * Providers are initialized before routes are registered.
   *
   * @param providers - `@Injectable()` classes to register
   * @returns `this` for method chaining
   */
  registerProviders(...providers: any[]): this {
    this.providers.push(...providers);
    return this;
  }

  /**
   * Register one or more `@Controller()`-decorated classes with the application.
   *
   * Controllers are processed when `build()` or `listen()` is called — routes
   * are not registered immediately. This means you can call `registerControllers()`
   * multiple times before starting the server.
   *
   * @param controllers - `@Controller()`-decorated class constructors
   * @returns `this` for method chaining
   *
   * @example
   * ```typescript
   * const app = new WynkFramework();
   * app.registerControllers(UserController, ProductController);
   * await app.listen(3000);
   * ```
   */
  registerControllers(...controllers: any[]): this {
    this.controllers.push(...controllers);
    return this;
  }

  private registerControllersWithTag(controllers: any[], tag: string): void {
    for (const ctrl of controllers) {
      this.controllers.push(ctrl);
      this.controllerTags.set(ctrl, tag);
    }
  }

  setControllerTag(controller: any, tag: string): this {
    this.controllerTags.set(controller, tag);
    return this;
  }

  /**
   * Register one or more guards that apply to every route in the application.
   *
   * Global guards run before controller-level and route-level guards.
   * Guards must implement `CanActivate` — return `true` to allow, `false` or
   * throw an exception to deny.
   *
   * @param guards - Instances implementing `CanActivate`
   * @returns `this` for method chaining
   *
   * @example
   * ```typescript
   * app.useGlobalGuards(new AuthGuard(), new RolesGuard());
   * ```
   */
  useGlobalGuards(...guards: any[]): this {
    this.globalGuards.push(...guards);
    return this;
  }

  /**
   * Register one or more interceptors that wrap every route in the application.
   *
   * Global interceptors run before controller-level and route-level interceptors.
   * They can transform both the inbound request context and the outbound response
   * using the `Observable`-style `CallHandler.handle()` pattern.
   *
   * @param interceptors - Instances implementing `WynkInterceptor`
   * @returns `this` for method chaining
   *
   * @example
   * ```typescript
   * app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
   * ```
   */
  useGlobalInterceptors(...interceptors: any[]): this {
    this.globalInterceptors.push(...interceptors);
    return this;
  }

  /**
   * Register one or more pipes that apply to every route in the application.
   *
   * Global pipes run before controller-level and route-level pipes and are
   * typically used for input validation or transformation (e.g. `ValidationPipe`,
   * `ParseIntPipe`).
   *
   * @param pipes - Instances implementing `WynkPipeTransform`
   * @returns `this` for method chaining
   *
   * @example
   * ```typescript
   * app.useGlobalPipes(new ValidationPipe());
   * ```
   */
  useGlobalPipes(...pipes: any[]): this {
    this.globalPipes.push(...pipes);
    return this;
  }

  /**
   * Register one or more exception filters that apply to every route in the application.
   *
   * Global exception filters catch exceptions thrown from any handler. Filters are
   * tried in order — the first one that handles the exception wins. Filters must
   * implement `WynkExceptionFilter` and be decorated with `@Catch()`.
   *
   * @param filters - Instances implementing `WynkExceptionFilter`
   * @returns `this` for method chaining
   *
   * @example
   * ```typescript
   * app.useGlobalFilters(new HttpExceptionFilter(), new DatabaseExceptionFilter());
   * ```
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
    for (const provider of this.providers) {
      try {
        // Plain class provider — resolve from DI container and call lifecycle hook
        if (typeof provider === "function") {
          const instance: any = container.resolve(provider);
          if (typeof instance.onModuleInit === "function") {
            await instance.onModuleInit();
          }
          continue;
        }

        // Object-style provider
        if (provider && typeof provider === "object" && "provide" in provider) {
          const token = provider.provide;

          if ("useValue" in provider) {
            // { provide, useValue } — register a static value
            container.register(token, { useValue: provider.useValue });
          } else if ("useFactory" in provider) {
            // { provide, useFactory, inject? } — call factory with resolved deps
            const deps = (provider.inject || []).map((dep: any) =>
              container.resolve(dep)
            );
            const value = await provider.useFactory(...deps);
            container.register(token, { useValue: value });
          } else if ("useExisting" in provider) {
            // { provide, useExisting } — alias one token to another
            container.register(token, {
              useFactory: () => container.resolve(provider.useExisting),
            });
          } else if ("useClass" in provider) {
            // { provide, useClass } — register a class under a custom token
            container.register(token, { useClass: provider.useClass });
            const instance: any = container.resolve(token);
            if (typeof instance.onModuleInit === "function") {
              await instance.onModuleInit();
            }
          }
          continue;
        }
      } catch (error) {
        const name =
          typeof provider === "function"
            ? provider.name
            : provider?.provide?.toString?.() ?? "unknown";
        throw new Error(
          `Provider initialization failed for ${name}: ${(error as any).message}`
        );
      }
    }
  }

  /**
   * Build the application by initializing all providers and registering all routes.
   *
   * Call this before handling requests if you need access to the underlying Elysia
   * instance (e.g. to attach Swagger). `listen()` and `handle()` call `build()`
   * automatically if it has not been called yet.
   *
   * @returns The underlying Elysia application instance
   *
   * @example
   * ```typescript
   * const server = await app.build();
   * server.use(swagger());
   * server.listen(3000);
   * ```
   */
  async build(): Promise<any> {
    // Initialize providers first (database connections, etc.)
    if (this.providers.length > 0) {
      await this.initializeProviders();
    }
    // Register global error handler if filters exist
    if (this.globalFilters.length > 0) {
      this.app.onError(async ({ error, set, request }) => {
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
        } catch (_filterError) {
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
    for (const provider of this.providers) {
      try {
        if (typeof provider === "function") {
          const instance: any = container.resolve(provider);
          if (typeof instance.onModuleDestroy === "function") {
            await instance.onModuleDestroy();
          }
        } else if (
          provider &&
          typeof provider === "object" &&
          "provide" in provider &&
          ("useClass" in provider || "useFactory" in provider)
        ) {
          // Only class/factory providers produce instances that may need cleanup
          const instance: any = container.resolve(provider.provide);
          if (typeof instance?.onModuleDestroy === "function") {
            await instance.onModuleDestroy();
          }
        }
      } catch {
        // Continue cleanup even if one provider fails
      }
    }
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
   * Start the HTTP server on the given port.
   *
   * Calls `build()` automatically if not yet called, then starts the Elysia server
   * and registers `SIGTERM`/`SIGINT` handlers for graceful shutdown. Providers with
   * `onModuleDestroy()` are called on shutdown.
   *
   * @param port - TCP port to listen on (default Bun port is typically 3000)
   *
   * @example
   * ```typescript
   * await app.listen(3000);
   * // 🚀 Application is running on http://localhost:3000
   * ```
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
   * Returns the underlying Elysia application instance.
   *
   * Use this when you need direct access to Elysia's API — for example, to attach
   * third-party Elysia plugins after the WynkJS build step.
   *
   * @returns The raw `Elysia` instance
   *
   * @example
   * ```typescript
   * const server = await app.build();
   * const elysia = app.getApp();
   * elysia.use(swagger());
   * ```
   */
  getApp(): any {
    return this.app;
  }

  /**
   * Handle a raw `Request` object and return a `Response`.
   *
   * This is useful for testing without starting an HTTP server, or for integrating
   * WynkJS into serverless environments that pass requests directly.
   * Calls `build()` automatically on the first invocation.
   *
   * @param request - A standard `Request` object
   * @returns A `Promise` that resolves to the `Response`
   *
   * @example
   * ```typescript
   * const res = await app.handle(new Request("http://localhost/users"));
   * const data = await res.json();
   * ```
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
    const instance: any = container.resolve(ControllerClass);
    const basePath = Reflect.getMetadata("basePath", ControllerClass) || "";

    const tag =
      this.controllerTags.get(ControllerClass) ||
      ControllerClass.name.replace(/Controller$/i, "");

    // Try reading from multiple locations
    const routes1 = Reflect.getMetadata("routes", ControllerClass) || [];
    const routes2 =
      Reflect.getMetadata("routes", ControllerClass.prototype) || [];
    const routes3 = Reflect.getMetadata("controller:routes", instance) || [];

    const routes =
      routes1.length > 0 ? routes1 : routes2.length > 0 ? routes2 : routes3;

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

      elysiaOptions.detail = { tags: [tag] };

      (this.app as any)[method](fullPath, finalHandler, elysiaOptions);
    }
  }
}

/**
 * Convenience factory function to create a `WynkFramework` instance.
 *
 * @param options - Application configuration options
 * @returns A new `WynkFramework` instance
 *
 * @example
 * ```typescript
 * const app = createApp({ cors: true });
 * app.registerControllers(UserController);
 * await app.listen(3000);
 * ```
 */
export function createApp(options: ApplicationOptions = {}): WynkFramework {
  return new WynkFramework(options);
}

/**
 * Primary application factory for WynkJS.
 *
 * `WynkFactory.create()` is the canonical way to bootstrap a WynkJS application.
 * It wires together controllers, providers, and modules before returning a ready-to-start
 * `WynkFramework` instance.
 *
 * @example
 * ```typescript
 * import { WynkFactory } from "wynkjs";
 *
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 *   providers: [DatabaseService],
 *   modules: [AuthModule],
 *   cors: true,
 *   globalPrefix: '/api',
 * });
 *
 * await app.listen(3000);
 * ```
 */
export class WynkFactory {
  static create(
    options: ApplicationOptions & {
      controllers?: any[];
      providers?: any[];
    } = {}
  ): WynkFramework {
    const effectiveControllers = [...(options.controllers || [])];
    const effectiveProviders = [...(options.providers || [])];
    const controllerTagMap = new Map<any, string>();

    if (options.modules) {
      for (const mod of options.modules) {
        const meta = Reflect.getMetadata("module:metadata", mod) as
          | { controllers?: any[]; providers?: any[] }
          | undefined;
        if (meta) {
          if (meta.controllers) {
            const tag = mod.name.replace(/Module$/i, "");
            for (const ctrl of meta.controllers) {
              effectiveControllers.push(ctrl);
              controllerTagMap.set(ctrl, tag);
            }
          }
          if (meta.providers) effectiveProviders.push(...meta.providers);
        }
      }
    }

    const mergedOptions = { ...options, providers: effectiveProviders };
    const app = new WynkFramework(mergedOptions);

    if (effectiveControllers.length > 0) {
      app.registerControllers(...effectiveControllers);
      for (const [ctrl, tag] of controllerTagMap) {
        app.setControllerTag(ctrl, tag);
      }
    }

    return app;
  }
}

// Export ElysiaFramework as alias for backwards compatibility
export { WynkFramework as ElysiaFramework };
