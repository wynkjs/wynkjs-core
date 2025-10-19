import "reflect-metadata";
import { WynkInterceptor, CallHandler } from "./interceptor.decorators";
import { ExecutionContext } from "./guard.decorators";

/**
 * Advanced Interceptors for WynkJS Framework
 * Additional interceptors for common use cases
 */

/**
 * Response Interceptor - Wraps all responses in a standard format
 * @example
 * @UseInterceptors(ResponseInterceptor)
 * @Controller('/api')
 * export class ApiController {}
 */
export class ResponseInterceptor implements WynkInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const startTime = Date.now();

    try {
      const data = await next.handle();
      const duration = Date.now() - startTime;

      return {
        success: true,
        statusCode: 200,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          path: request.url,
          method: request.method,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        statusCode: error.statusCode || 500,
        error: {
          message: error.message,
          code: error.code,
        },
        meta: {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          path: request.url,
          method: request.method,
        },
      };
    }
  }
}

/**
 * Error Handling Interceptor - Catches and transforms errors
 * @example
 * @UseInterceptors(ErrorHandlingInterceptor)
 * @Get()
 * async getData() {}
 */
export class ErrorHandlingInterceptor implements WynkInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    try {
      return await next.handle();
    } catch (error: any) {
      console.error(
        `❌ Error in ${context.getRequest().method} ${context.getRequest().url}:`,
        error
      );

      // Transform error to a consistent format
      throw {
        statusCode: error.statusCode || 500,
        message: error.message || "Internal server error",
        error: error.name || "Error",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Compression Interceptor - Simulates response compression metadata
 * @example
 * @UseInterceptors(CompressionInterceptor)
 * @Get()
 * async getLargeData() {}
 */
export class CompressionInterceptor implements WynkInterceptor {
  constructor(private threshold: number = 1024) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const data = await next.handle();
    const dataSize = JSON.stringify(data).length;

    if (dataSize > this.threshold) {
      // In a real implementation, you'd compress the data here
      console.log(
        `📦 Response size: ${dataSize} bytes (compression recommended)`
      );
    }

    return data;
  }
}

/**
 * Rate Limit Interceptor - Basic rate limiting
 * @example
 * @UseInterceptors(new RateLimitInterceptor(100, 60000))
 * @Post()
 * async create() {}
 */
export class RateLimitInterceptor implements WynkInterceptor {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const clientIp = request.headers?.get?.("x-forwarded-for") || "unknown";
    const now = Date.now();

    // Get or create request history for this IP
    let history = this.requests.get(clientIp) || [];

    // Filter out old requests outside the window
    history = history.filter((timestamp) => now - timestamp < this.windowMs);

    // Check if rate limit exceeded
    if (history.length >= this.maxRequests) {
      throw {
        statusCode: 429,
        message: "Too many requests",
        error: "Rate limit exceeded",
      };
    }

    // Add current request
    history.push(now);
    this.requests.set(clientIp, history);

    return next.handle();
  }
}

/**
 * CORS Interceptor - Add CORS headers to responses
 * @example
 * @UseInterceptors(CorsInterceptor)
 * @Controller('/api')
 * export class ApiController {}
 */
export class CorsInterceptor implements WynkInterceptor {
  constructor(
    private options: {
      origin?: string | string[];
      methods?: string[];
      credentials?: boolean;
    } = {}
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const response = context.getResponse();
    const origin = this.options.origin || "*";
    const methods = this.options.methods || [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
    ];

    // Set CORS headers
    if (response.headers) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        Array.isArray(origin) ? origin[0] : origin
      );
      response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      if (this.options.credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }
    }

    return next.handle();
  }
}

/**
 * Sanitize Interceptor - Sanitizes response data
 * @example
 * @UseInterceptors(SanitizeInterceptor)
 * @Get('/users')
 * async getUsers() {}
 */
export class SanitizeInterceptor implements WynkInterceptor {
  private fieldsToRemove: string[];

  constructor(fieldsToRemove: string[] = ["password", "secret", "token"]) {
    this.fieldsToRemove = fieldsToRemove;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const data = await next.handle();
    return this.sanitize(data);
  }

  private sanitize(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (data && typeof data === "object") {
      const sanitized: any = {};

      for (const key in data) {
        if (!this.fieldsToRemove.includes(key)) {
          sanitized[key] = this.sanitize(data[key]);
        }
      }

      return sanitized;
    }

    return data;
  }
}

/**
 * Pagination Interceptor - Adds pagination metadata
 * @example
 * @UseInterceptors(PaginationInterceptor)
 * @Get('/users')
 * async getUsers(@Query('page') page: number, @Query('limit') limit: number) {}
 */
export class PaginationInterceptor implements WynkInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const url = new URL(
      request.url,
      `http://${request.headers?.get?.("host")}`
    );

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const data = await next.handle();

    // If data is an array, add pagination
    if (Array.isArray(data)) {
      return {
        items: data,
        pagination: {
          page,
          limit,
          total: data.length,
          hasMore: data.length >= limit,
        },
      };
    }

    return data;
  }
}
