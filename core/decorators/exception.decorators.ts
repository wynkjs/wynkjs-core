import "reflect-metadata";
import { ExecutionContext } from "./guard.decorators";

/**
 * Exception Filter Decorators and Interfaces for WynkJS Framework
 * Exception filters for error handling
 */

/**
 * Wynk exception filter interface
 */
export interface WynkExceptionFilter<T = any> {
  catch(exception: T, context: ExecutionContext): any;
}

/**
 * @Catch decorator - Define which exceptions the filter catches
 * @param exceptions Exception types to catch
 * @example
 * @Catch(HttpException)
 * export class HttpWynkExceptionFilter implements WynkExceptionFilter {}
 *
 * @Catch() // Catches all exceptions
 * export class AllExceptionsFilter implements WynkExceptionFilter {}
 */
export function Catch(...exceptions: any[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata("catch:exceptions", exceptions, target);
    return target;
  };
}

/**
 * @UseFilters decorator - Apply exception filters
 * @param filters Filter classes to apply
 * @example
 * @UseFilters(HttpWynkExceptionFilter)
 * @Controller('/users')
 * export class UserController {}
 *
 * @Post()
 * @UseFilters(ValidationWynkExceptionFilter)
 * create(@Body() dto: CreateDto) {}
 */
export function UseFilters(
  ...filters: (Function | WynkExceptionFilter)[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey && descriptor) {
      // Method decorator
      const existing =
        Reflect.getMetadata("filters", target, propertyKey) || [];
      Reflect.defineMetadata(
        "filters",
        [...existing, ...filters],
        target,
        propertyKey
      );
      return descriptor;
    } else {
      // Class decorator
      const existing = Reflect.getMetadata("filters", target) || [];
      Reflect.defineMetadata("filters", [...existing, ...filters], target);
      return target;
    }
  };
}

/**
 * Built-in HTTP Exceptions
 */

export class HttpException extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly error?: string
  ) {
    super(message);
    this.name = "HttpException";
  }

  getStatus(): number {
    return this.statusCode;
  }

  getResponse(): any {
    return {
      statusCode: this.statusCode,
      message: this.message,
      error: this.error,
    };
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = "Bad Request") {
    super(message, 400, "Bad Request");
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "Unauthorized");
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden") {
    super(message, 403, "Forbidden");
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = "Not Found") {
    super(message, 404, "Not Found");
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(message: string = "Method Not Allowed") {
    super(message, 405, "Method Not Allowed");
  }
}

export class NotAcceptableException extends HttpException {
  constructor(message: string = "Not Acceptable") {
    super(message, 406, "Not Acceptable");
  }
}

export class RequestTimeoutException extends HttpException {
  constructor(message: string = "Request Timeout") {
    super(message, 408, "Request Timeout");
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = "Conflict") {
    super(message, 409, "Conflict");
  }
}

export class AlreadyExistsException extends HttpException {
  constructor(message: string = "Resource Already Exists") {
    super(message, 409, "Conflict");
  }
}

export class GoneException extends HttpException {
  constructor(message: string = "Gone") {
    super(message, 410, "Gone");
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message: string = "Payload Too Large") {
    super(message, 413, "Payload Too Large");
  }
}

export class UnsupportedMediaTypeException extends HttpException {
  constructor(message: string = "Unsupported Media Type") {
    super(message, 415, "Unsupported Media Type");
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string = "Unprocessable Entity") {
    super(message, 422, "Unprocessable Entity");
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string = "Internal Server Error") {
    super(message, 500, "Internal Server Error");
  }
}

export class NotImplementedException extends HttpException {
  constructor(message: string = "Not Implemented") {
    super(message, 501, "Not Implemented");
  }
}

export class BadGatewayException extends HttpException {
  constructor(message: string = "Bad Gateway") {
    super(message, 502, "Bad Gateway");
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string = "Service Unavailable") {
    super(message, 503, "Service Unavailable");
  }
}

export class GatewayTimeoutException extends HttpException {
  constructor(message: string = "Gateway Timeout") {
    super(message, 504, "Gateway Timeout");
  }
}

/**
 * Helper function to execute exception filters
 */
export async function executeExceptionFilters(
  filters: (Function | WynkExceptionFilter)[],
  exception: any,
  context: ExecutionContext
): Promise<any> {
  for (const filter of filters) {
    let filterInstance: WynkExceptionFilter;

    if (typeof filter === "function") {
      filterInstance = new (filter as any)();
    } else {
      filterInstance = filter;
    }

    // Check if filter handles this exception type
    const catchTypes = Reflect.getMetadata(
      "catch:exceptions",
      filterInstance.constructor
    );

    if (!catchTypes || catchTypes.length === 0) {
      // Catches all exceptions
      return filterInstance.catch(exception, context);
    }

    // Check if exception matches any of the catch types
    for (const catchType of catchTypes) {
      if (exception instanceof catchType) {
        return filterInstance.catch(exception, context);
      }
    }
  }

  // If no filter handles the exception, rethrow it
  throw exception;
}

/**
 * Built-in Exception Filters
 */

/**
 * Default HTTP exception filter
 */
@Catch(HttpException)
export class HttpWynkExceptionFilter
  implements WynkExceptionFilter<HttpException>
{
  catch(exception: HttpException, context: ExecutionContext) {
    const response = context.getResponse();
    const status = exception.getStatus();

    return {
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...exception.getResponse(),
    };
  }
}

/**
 * All exceptions filter - catches everything
 */
@Catch()
export class AllExceptionsFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        statusCode: status,
        timestamp: new Date().toISOString(),
        ...exception.getResponse(),
      };
    }

    // Unknown exception
    return {
      statusCode: 500,
      timestamp: new Date().toISOString(),
      message: exception.message || "Internal server error",
      error: "Internal Server Error",
    };
  }
}
