import "reflect-metadata";

/**
 * HTTP Method Decorators for WynkJS Framework
 * RESTful route handlers with TypeScript decorators
 * Optimized for Elysia's performance on Bun runtime
 */

export interface RouteOptions {
  path?: string;
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  response?: any;
}

/**
 * Controller decorator - Defines a controller with a base path
 * @param path Base path for all routes in this controller
 * @example
 * @Controller('/users')
 * export class UserController {}
 */
export function Controller(path: string = ""): ClassDecorator {
  return (target: any) => {
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
 * Helper function to create route decorators
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
    console.log(
      `🔹 Storing route: ${method} ${path} on ${constructor.name}.${String(
        propertyKey
      )} (routes: ${routes.length})`
    );
    Reflect.defineMetadata("routes", routes, constructor.prototype);

    // Also store on constructor for compatibility
    Reflect.defineMetadata("routes", routes, constructor);

    // Verify it was stored
    const verify = Reflect.getMetadata("routes", constructor.prototype) || [];
    console.log(
      `✅ Verified ${verify.length} routes stored on ${constructor.name}.prototype`
    );

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
 * Redirect to a URL
 * @param url URL to redirect to
 * @param statusCode Redirect status code (default: 302)
 * @example
 * @Get('/old-url')
 * @Redirect('/new-url', 301)
 * redirect() {}
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
