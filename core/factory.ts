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

/**
 * Application Factory for WynkJS Framework
 * Creates and configures Elysia app with all decorators support
 */

export interface ApplicationOptions {
  cors?: boolean | any;
  globalPrefix?: string;
  logger?: boolean;
  validationErrorFormatter?: ErrorFormatter;
}

export class WynkFramework {
  private app: Elysia;
  private controllers: any[] = [];
  private globalGuards: any[] = [];
  private globalInterceptors: any[] = [];
  private globalPipes: any[] = [];
  private globalFilters: any[] = [];
  private validationFormatter?: ErrorFormatter;

  constructor(options: ApplicationOptions = {}) {
    this.app = new Elysia();
    this.validationFormatter = options.validationErrorFormatter;

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

    // Apply CORS if enabled
    if (options.cors) {
      // CORS configuration would go here
    }

    // Apply global prefix if specified
    if (options.globalPrefix) {
      // Global prefix handling
    }

    return this;
  }

  /**
   * Static convenience creator to align with documentation examples
   */
  static create(
    options: ApplicationOptions & { controllers?: any[] } = {}
  ): WynkFramework {
    const app = new WynkFramework(options);
    if (options.controllers && options.controllers.length) {
      app.registerControllers(...options.controllers);
    }
    return app;
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
   * Build the application - register all routes
   */
  async build(): Promise<Elysia> {
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
    return this.app;
  }

  /**
   * Start listening on a port
   */
  async listen(port: number): Promise<void> {
    await this.build();
    this.app.listen(port);
    console.log(`🚀 Application is running on http://localhost:${port}`);
  }

  /**
   * Get the underlying Elysia instance
   */
  getApp(): Elysia {
    return this.app;
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
      const fullPath = basePath + route.path;
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

      // Combine guards, interceptors, pipes, filters (global -> controller -> method)
      const allGuards = [
        ...this.globalGuards,
        ...controllerGuards,
        ...methodGuards,
      ];
      const allInterceptors = [
        ...this.globalInterceptors,
        ...controllerInterceptors,
        ...methodInterceptors,
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

      // Create route handler
      const handler = async (ctx: any) => {
        try {
          // Create execution context
          const executionContext = createExecutionContext(
            ctx,
            instance[methodName],
            ControllerClass
          );

          // Execute guards
          if (allGuards.length > 0) {
            const canActivate = await executeGuards(
              allGuards,
              executionContext
            );
            if (!canActivate) {
              throw new HttpException("Forbidden", 403, "Access denied");
            }
          }

          // Prepare handler with parameters and pipes
          const executeHandler = async () => {
            // Build arguments for the controller method
            const args: any[] = [];

            if (params.length === 0) {
              // No parameter decorators, pass full context
              args.push(ctx);
            } else {
              // Sort params by index
              params.sort((a, b) => a.index - b.index);

              for (const param of params) {
                let value: any;

                // Extract value based on type
                switch (param.type) {
                  case "body":
                    value = param.data ? ctx.body?.[param.data] : ctx.body;
                    break;
                  case "param":
                    value = param.data ? ctx.params?.[param.data] : ctx.params;
                    break;
                  case "query":
                    value = param.data ? ctx.query?.[param.data] : ctx.query;
                    break;
                  case "headers":
                    value = param.data
                      ? ctx.headers?.get?.(param.data) ||
                        ctx.request?.headers?.get?.(param.data)
                      : ctx.headers || ctx.request?.headers;
                    break;
                  case "request":
                    value = ctx.request || ctx;
                    break;
                  case "response":
                    value = ctx.set || ctx.response;
                    break;
                  case "context":
                    if (param.data) {
                      // Access nested property like "session.userId"
                      const keys = param.data.split(".");
                      value = keys.reduce((obj, key) => obj?.[key], ctx);
                    } else {
                      value = ctx;
                    }
                    break;
                  case "user":
                    value = param.data ? ctx.user?.[param.data] : ctx.user;
                    break;
                  case "file":
                    value = ctx.body?.file || ctx.file;
                    break;
                  case "files":
                    value = ctx.body?.files || ctx.files;
                    break;
                }

                // Apply pipes if any
                if (param.pipes && param.pipes.length > 0) {
                  const metadata: ArgumentMetadata = {
                    type: param.type as any,
                    data: param.data,
                  };
                  value = await executePipes(param.pipes, value, metadata);
                }

                // Apply global/controller/method pipes
                if (allPipes.length > 0) {
                  const metadata: ArgumentMetadata = {
                    type: param.type as any,
                    data: param.data,
                  };
                  value = await executePipes(allPipes, value, metadata);
                }

                args[param.index] = value;
              }
            }

            // Call controller method
            return await instance[methodName].apply(instance, args);
          };

          // Execute interceptors
          let result: any;
          if (allInterceptors.length > 0) {
            result = await executeInterceptors(
              allInterceptors,
              executionContext,
              executeHandler
            );
          } else {
            result = await executeHandler();
          }

          // Handle redirect
          if (redirect) {
            ctx.set.redirect = redirect.url;
            ctx.set.status = redirect.statusCode;
            return;
          }

          // Set custom HTTP code
          if (httpCode) {
            ctx.set.status = httpCode;
          }

          // Set custom headers
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              ctx.set.headers[key] = value as string;
            });
          }

          return result;
        } catch (error) {
          console.log("🔴 ERROR CAUGHT IN FACTORY");
          console.log("allFilters.length:", allFilters.length);
          console.log("Error:", (error as any)?.message);

          // Execute exception filters
          if (allFilters.length > 0) {
            console.log("✅ Executing exception filters...");
            const executionContext = createExecutionContext(
              ctx,
              instance[methodName],
              ControllerClass
            );

            try {
              const result = await executeExceptionFilters(
                allFilters,
                error,
                executionContext
              );
              if (result) {
                if (result.statusCode) {
                  ctx.set.status = result.statusCode;
                }
                return result;
              }
            } catch (filterError) {
              // If filter doesn't handle it, continue to default error handling
              error = filterError;
            }
          } else {
            console.log("❌ No filters registered for this route");
          }

          // Default error handling
          if (error instanceof HttpException) {
            ctx.set.status = error.getStatus();
            return error.getResponse();
          }

          // Unknown error
          ctx.set.status = 500;
          return {
            statusCode: 500,
            message: (error as any).message || "Internal server error",
            error: "Internal Server Error",
          };
        }
      };

      // Wrap handler with @Use() middleware if present
      // Combine controller and method middleware
      const allUses = [...controllerUses, ...methodUses];

      let finalHandler = handler;

      if (allUses.length > 0) {
        console.log(`🔗 Building middleware chain for ${method} ${fullPath}:`);
        console.log(`   Middleware count: ${allUses.length}`);
        allUses.forEach((m, i) =>
          console.log(`   [${i}] ${m.name || "anonymous"}`)
        );

        // Build middleware chain using reduce (O(n) complexity)
        // Builds from right to left: handler <- middleware[n-1] <- ... <- middleware[0]
        // Executes left to right: middleware[0] -> ... -> middleware[n-1] -> handler
        finalHandler = allUses.reduceRight((next, middleware, index) => {
          return async (ctx: any) => {
            console.log(
              `▶️ Executing middleware [${index}]: ${
                middleware.name || "anonymous"
              }`
            );
            return await middleware(ctx, () => next(ctx));
          };
        }, handler);
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
    options: ApplicationOptions & { controllers?: any[] } = {}
  ): WynkFramework {
    const app = new WynkFramework(options);

    if (options.controllers) {
      app.registerControllers(...options.controllers);
    }

    return app;
  }
}

// Export ElysiaFramework as alias for backwards compatibility
export { WynkFramework as ElysiaFramework };
