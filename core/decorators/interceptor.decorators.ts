import "reflect-metadata";
import { InterceptorContext } from "../interfaces/interceptor.interface";
import { container } from "tsyringe";

// Alias for backward compatibility
type ExecutionContext = InterceptorContext;

// Store singleton interceptor instances
const interceptorInstances = new Map<Function, WynkInterceptor>();

/**
 * Interceptor Decorators and Interfaces for WynkJS Framework
 * Interceptors for request/response transformation
 */

/**
 * Call handler interface for interceptors
 */
export interface CallHandler<T = any> {
  handle(): Promise<T>;
}

/**
 * WynkInterceptor interface - All interceptors must implement this
 */
export interface WynkInterceptor {
  intercept(context: ExecutionContext, next: () => Promise<any>): Promise<any>;
}

/**
 * @UseInterceptors decorator - Apply interceptors to routes or controllers
 * @param interceptors Interceptor classes to apply
 * @example
 * @UseInterceptors(LoggingInterceptor, TransformInterceptor)
 * @Controller('/users')
 * export class UserController {}
 *
 * @Get()
 * @UseInterceptors(CacheInterceptor)
 * findAll() {}
 */
export function UseInterceptors(
  ...interceptors: (Function | WynkInterceptor)[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey && descriptor) {
      // Method decorator
      const existing =
        Reflect.getMetadata("interceptors", target, propertyKey) || [];
      Reflect.defineMetadata(
        "interceptors",
        [...existing, ...interceptors],
        target,
        propertyKey
      );
      return descriptor;
    } else {
      // Class decorator
      const existing = Reflect.getMetadata("interceptors", target) || [];
      Reflect.defineMetadata(
        "interceptors",
        [...existing, ...interceptors],
        target
      );
      return target;
    }
  };
}

/**
 * Helper function to execute interceptors
 */
export async function executeInterceptors(
  interceptors: (Function | WynkInterceptor)[],
  context: InterceptorContext,
  handler: () => Promise<any>
): Promise<any> {
  // Build interceptor chain
  // First interceptor in array is innermost (transforms first, closest to handler)
  // Last interceptor in array is outermost (transforms last, farthest from handler)
  let next = handler;

  // Apply interceptors in FORWARD order
  // First wraps handler, second wraps first, etc.
  for (let i = 0; i < interceptors.length; i++) {
    const interceptor = interceptors[i];
    const currentNext = next; // Capture current next in closure

    let interceptorInstance: WynkInterceptor;
    if (typeof interceptor === "function") {
      // Always use singleton pattern - cache all interceptor instances by class
      if (!interceptorInstances.has(interceptor)) {
        try {
          interceptorInstances.set(
            interceptor,
            container.resolve(interceptor as any)
          );
        } catch {
          interceptorInstances.set(interceptor, new (interceptor as any)());
        }
      }
      interceptorInstance = interceptorInstances.get(interceptor)!;
    } else {
      interceptorInstance = interceptor;
    }

    if (!interceptorInstance.intercept) {
      throw new Error(`Interceptor must implement WynkInterceptor interface`);
    }

    // Wrap in a function that calls the interceptor
    next = async () => {
      return interceptorInstance.intercept(context, currentNext);
    };
  }

  return next();
}

/**
 * Common interceptor utilities
 */

/**
 * Transform interceptor decorator - Wraps response in a specific structure
 * @param transformFn Transformation function
 * @example
 * @UseInterceptors(TransformInterceptor)
 * @Get()
 * async getData() {
 *   return { data: 'value' };
 * }
 * // Response: { data: { data: 'value' }, statusCode: 200 }
 */
export class TransformInterceptor implements WynkInterceptor {
  constructor(private transformFn?: (data: any) => any) {}

  async intercept(
    context: InterceptorContext,
    next: () => Promise<any>
  ): Promise<any> {
    const data = await next();

    if (this.transformFn) {
      return this.transformFn(data);
    }

    return {
      data,
      statusCode: context.getResponse().status || 200,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Timeout interceptor - Adds timeout to requests
 * @param timeout Timeout in milliseconds
 * @example
 * @UseInterceptors(new TimeoutInterceptor(5000))
 * @Get()
 * async getData() {}
 */
export class TimeoutInterceptor implements WynkInterceptor {
  constructor(private timeout: number = 5000) {}

  async intercept(
    context: InterceptorContext,
    next: () => Promise<any>
  ): Promise<any> {
    return Promise.race([
      next(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), this.timeout)
      ),
    ]);
  }
}

/**
 * Cache interceptor - Caches responses
 * @example
 * @UseInterceptors(CacheInterceptor)
 * @Get()
 * async getData() {}
 */
export class CacheInterceptor implements WynkInterceptor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 60000) {
    this.ttl = ttl;
  }

  async intercept(
    context: InterceptorContext,
    next: () => Promise<any>
  ): Promise<any> {
    const request = context.getRequest();
    const cacheKey = `${request.method}:${request.url}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    // Execute handler and cache result
    const data = await next();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }
}

/**
 * Logging interceptor - Logs requests and responses
 * @example
 * @UseInterceptors(LoggingInterceptor)
 * @Controller()
 * export class AppController {}
 */
export class LoggingInterceptor implements WynkInterceptor {
  async intercept(
    context: InterceptorContext,
    next: () => Promise<any>
  ): Promise<any> {
    const request = context.getRequest();
    const startTime = Date.now();

    console.log(`📥 ${request.method} ${request.url} - Started`);

    try {
      const data = await next();
      const duration = Date.now() - startTime;
      console.log(
        `📤 ${request.method} ${request.url} - Completed in ${duration}ms`
      );
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(
        `❌ ${request.method} ${request.url} - Failed in ${duration}ms`
      );
      throw error;
    }
  }
}
