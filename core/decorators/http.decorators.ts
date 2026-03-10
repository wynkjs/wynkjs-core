import "reflect-metadata";

/**
 * HTTP Method Decorators for WynkJS Framework
 * RESTful route handlers with TypeScript decorators
 * Optimized for WynkJS's performance on Bun runtime
 */

/**
 * Options accepted by HTTP method decorators when passed as an object.
 *
 * @example
 * @Post({ path: '/users', body: CreateUserDTO, query: PaginationDTO })
 * create(@Body() dto: CreateUserType, @Query() q: PaginationQuery) {}
 */
export interface RouteOptions {
  /** Route path (e.g. `'/'`, `'/:id'`). Defaults to `''`. */
  path?: string;
  /** TypeBox schema used to validate and type the request body. */
  body?: any;
  /** TypeBox schema used to validate route path parameters. */
  params?: any;
  /** TypeBox schema used to validate query string parameters. */
  query?: any;
  /** TypeBox schema used to validate request headers. */
  headers?: any;
  /** TypeBox schema describing the response shape (informational / Swagger). */
  response?: any;
}

/**
 * Controller decorator - Defines a controller with a base path
 * @param pathOrOptions Base path string or options object with path
 * @example
 * @Controller('/users')
 * export class UserController {}
 *
 * @Controller({ path: '/users' })
 * export class UserController {}
 */
export function Controller(
  pathOrOptions?: string | { path?: string }
): ClassDecorator {
  return (target: any) => {
    // Handle both string and object formats
    const path =
      typeof pathOrOptions === "string"
        ? pathOrOptions
        : pathOrOptions?.path || "";

    Reflect.defineMetadata("basePath", path, target);
    Reflect.defineMetadata("routes", [], target);
  };
}

/**
 * HTTP GET decorator
 * @param pathOrOptions Route path or options with DTO
 * @example
 * @Get('/profile')
 * async getProfile() {}
 *
 * @Get({ path: '/:id', params: UserIdDTO, query: QueryDTO })
 * async findOne(@Param('id') id: string, @Query() query: any) {}
 */
export function Get(pathOrOptions?: string | RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("GET", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("GET", options.path || "", options);
}

/**
 * @Post decorator - Define a POST route
 * @param pathOrOptions Optional route path or options with DTO
 * @example
 * @Post()
 * create(@Body() data: any) {}
 *
 * @Post('/new')
 * createNew(@Body() data: any) {}
 *
 * @Post({ path: '/users', body: UserDTO })
 * createUser(@Body() data: any) {}
 */
export function Post(pathOrOptions?: string | RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("POST", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("POST", options.path || "", options);
}

/**
 * HTTP PUT decorator
 * @param pathOrOptions Route path or options with DTO
 * @example
 * @Put('/:id')
 * async update(@Param('id') id: string, @Body() dto: UpdateDto) {}
 *
 * @Put({ path: '/:id', body: UpdateUserDTO })
 * async update(@Param('id') id: string, @Body() dto: any) {}
 */
export function Put(pathOrOptions?: string | RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("PUT", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("PUT", options.path || "", options);
}

/**
 * HTTP PATCH decorator
 * @param pathOrOptions Route path or options with DTO
 * @example
 * @Patch('/:id')
 * async partialUpdate(@Param('id') id: string, @Body() dto: PartialDto) {}
 *
 * @Patch({ path: '/:id', body: PatchUserDTO })
 * async patch(@Param('id') id: string, @Body() dto: any) {}
 */
export function Patch(pathOrOptions?: string | RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("PATCH", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("PATCH", options.path || "", options);
}

/**
 * HTTP DELETE decorator
 * @param pathOrOptions Route path or options with DTO
 * @example
 * @Delete('/:id')
 * async remove(@Param('id') id: string) {}
 *
 * @Delete({ path: '/:id', params: UserIdDTO })
 * async remove(@Param('id') id: string) {}
 */
export function Delete(pathOrOptions?: string | RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("DELETE", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("DELETE", options.path || "", options);
}

/**
 * HTTP OPTIONS decorator
 * @param pathOrOptions Route path or options with DTO
 */
export function Options(
  pathOrOptions?: string | RouteOptions
): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("OPTIONS", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("OPTIONS", options.path || "", options);
}

/**
 * HTTP HEAD decorator
 * @param pathOrOptions Route path or options with DTO
 */
export function Head(pathOrOptions?: string | RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === "string") {
    return createRouteDecorator("HEAD", pathOrOptions);
  }
  const options = pathOrOptions || {};
  return createRouteDecorator("HEAD", options.path || "", options);
}

/**
 * Create a method decorator that registers route metadata for a controller method.
 *
 * @param method - The HTTP method (e.g., "GET", "POST") to associate with the route
 * @param path - The route path relative to the controller's base path
 * @param options - Optional route configuration such as body, params, query, headers, response, or flags like `sse`
 * @returns A MethodDecorator that stores route metadata (method, path, options) on the target method and the controller constructor
 */
function createRouteDecorator(
  method: string,
  path: string,
  options?: RouteOptions
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    // Store route metadata on the prototype
    const constructor = target.constructor;
    const routes = Reflect.getMetadata("routes", constructor.prototype) || [];
    routes.push({
      method,
      path,
      methodName: propertyKey,
      options,
    });
    Reflect.defineMetadata("routes", routes, constructor.prototype);

    // Also store on constructor for compatibility
    Reflect.defineMetadata("routes", routes, constructor);

    // Store method-specific metadata
    Reflect.defineMetadata("route:method", method, target, propertyKey);
    Reflect.defineMetadata("route:path", path, target, propertyKey);
    if (options) {
      Reflect.defineMetadata("route:options", options, target, propertyKey);
    }

    return descriptor;
  };
}

/**
 * Set custom HTTP status code for a route
 * @param code HTTP status code
 * @example
 * @Post()
 * @HttpCode(201)
 * async create() {}
 */
export function HttpCode(code: number): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata("route:httpCode", code, target, propertyKey);
    return descriptor;
  };
}

/**
 * Set custom headers for a route response
 * @param headers Headers object
 * @example
 * @Get()
 * @Header('Cache-Control', 'max-age=3600')
 * async getData() {}
 */
export function Header(name: string, value: string): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const headers =
      Reflect.getMetadata("route:headers", target, propertyKey) || {};
    headers[name] = value;
    Reflect.defineMetadata("route:headers", headers, target, propertyKey);
    return descriptor;
  };
}

/**
 * Configure a route to redirect clients to the given URL.
 *
 * @param url - Destination URL for the redirect.
 * @param statusCode - HTTP status code to use for the redirect; defaults to 302.
 * @returns A MethodDecorator that stores redirect metadata `{ url, statusCode }` for the route.
 */
export function Redirect(
  url: string,
  statusCode: number = 302
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(
      "route:redirect",
      { url, statusCode },
      target,
      propertyKey
    );
    return descriptor;
  };
}

/**
 * Register a GET route configured for Server-Sent Events (SSE).
 *
 * The created decorator marks the route as SSE and sets the route options so the framework will use
 * `Content-Type: text/event-stream` and stream the handler's output. Handlers should return an
 * AsyncIterable or an object that exposes `subscribe()` (e.g., an Observable) to stream events.
 *
 * @param pathOrOptions - Route path string or a {@link RouteOptions} object; when an object is provided its `sse` flag is set automatically
 * @returns The method decorator that registers the SSE GET route
 *
 * @example
 * ```typescript
 * @Sse('/events')
 * streamEvents(): AsyncIterable<MessageEvent> {
 *   return new Observable(observer => {
 *     const interval = setInterval(() => observer.next({ data: { time: Date.now() } }), 1000);
 *     return () => clearInterval(interval);
 *   });
 * }
 * ```
 */
export function Sse(pathOrOptions?: string | RouteOptions): MethodDecorator {
  const path =
    typeof pathOrOptions === "string"
      ? pathOrOptions
      : pathOrOptions?.path || "";
  const options: RouteOptions & { sse?: boolean } =
    typeof pathOrOptions === "object" && pathOrOptions !== null
      ? { ...pathOrOptions, sse: true }
      : { sse: true };

  return createRouteDecorator("GET", path, options);
}

/**
 * Use decorator - Apply middleware to controller or method
 * Simple middleware pattern like your working code
 * @param middlewares Middleware functions to apply
 * @example
 * @Controller('/users')
 * @Use(authMiddleware, loggingMiddleware)
 * export class UserController {}
 *
 * @Get('/')
 * @Use(cacheMiddleware)
 * async findAll() {}
 */
export function Use(...middlewares: any[]): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      // Method decorator
      const existingUses =
        Reflect.getMetadata("uses", target, propertyKey) || [];
      Reflect.defineMetadata(
        "uses",
        [...existingUses, ...middlewares],
        target,
        propertyKey
      );
    } else {
      // Class decorator
      const existingUses = Reflect.getMetadata("uses", target) || [];
      Reflect.defineMetadata("uses", [...existingUses, ...middlewares], target);
    }
    return descriptor as any;
  };
}
