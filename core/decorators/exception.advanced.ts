import "reflect-metadata";
import { WynkExceptionFilter } from "./exception.decorators";
import { ExecutionContext } from "./guard.decorators";
import {
  HttpException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from "./exception.decorators";

/**
 * Advanced Exception Filters for WynkJS Framework
 * Specialized filters for different error scenarios
 */

/**
 * Error Formatter Interface
 * Used by ValidationExceptionFilter to format validation errors
 */
export interface ErrorFormatter {
  format(validationError: any): any;
}

/**
 * FormatErrorFormatter - Formats as { field: [messages] } like NestJS
 */
export class FormatErrorFormatter implements ErrorFormatter {
  format(error: any): any {
    const formattedErrors: Record<string, string[]> = {};

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err: any) => {
        const field = err.path?.replace(/^\//, "") || "unknown";
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.summary || err.message);
      });
    } else {
      const field = error.property?.replace(/^\//, "") || "unknown";
      formattedErrors[field] = [error.summary || error.message];
    }

    return {
      statusCode: 400,
      message: "Validation failed",
      errors: formattedErrors,
    };
  }
}

/**
 * SimpleErrorFormatter - Formats as simple array of messages
 */
export class SimpleErrorFormatter implements ErrorFormatter {
  format(error: any): any {
    const messages: string[] = [];

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err: any) => {
        messages.push(err.summary || err.message);
      });
    } else {
      messages.push(error.summary || error.message);
    }

    return {
      statusCode: 400,
      message: "Validation failed",
      errors: messages,
    };
  }
}

/**
 * DetailedErrorFormatter - Formats with detailed field info
 */
export class DetailedErrorFormatter implements ErrorFormatter {
  format(error: any): any {
    const errors: Array<{
      field: string;
      message: string;
      value?: any;
      expected?: any;
    }> = [];

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err: any) => {
        errors.push({
          field: err.path?.replace(/^\//, "") || "unknown",
          message: err.summary || err.message,
          value: err.value,
          expected: err.schema,
        });
      });
    } else {
      errors.push({
        field: error.property?.replace(/^\//, "") || "unknown",
        message: error.summary || error.message,
        value: error.found,
        expected: error.expected,
      });
    }

    return {
      statusCode: 400,
      message: "Validation failed",
      errors,
    };
  }
}

/**
 * Validation Exception Filter - Handles validation errors with customizable formatting
 * @example
 * // With FormatErrorFormatter (NestJS-style)
 * app.useGlobalFilters(new ValidationExceptionFilter(new FormatErrorFormatter()));
 *
 * // With SimpleErrorFormatter
 * app.useGlobalFilters(new ValidationExceptionFilter(new SimpleErrorFormatter()));
 *
 * // With DetailedErrorFormatter
 * app.useGlobalFilters(new ValidationExceptionFilter(new DetailedErrorFormatter()));
 *
 * // Without formatter (default detailed format)
 * app.useGlobalFilters(new ValidationExceptionFilter());
 */
export class ValidationExceptionFilter implements WynkExceptionFilter {
  private formatter: ErrorFormatter | null = null;

  constructor(formatter?: ErrorFormatter) {
    this.formatter = formatter || null;
  }

  catch(exception: any, context: ExecutionContext) {
    const request = context.getRequest();

    // Check if this is a validation error from Elysia
    const isValidationError = this.isValidationError(exception);

    if (!isValidationError) {
      // Not a validation error, re-throw to let other filters handle it
      throw exception;
    }

    // Parse the validation error
    let validationError: any;
    if (typeof exception.message === "string") {
      try {
        validationError = JSON.parse(exception.message);
      } catch {
        validationError = { message: exception.message };
      }
    } else {
      validationError = exception;
    }

    // Format the error using the provided formatter
    if (this.formatter) {
      return this.formatter.format(validationError);
    }

    // Default format (detailed)
    return new DetailedErrorFormatter().format(validationError);
  }

  private isValidationError(exception: any): boolean {
    if (!exception) return false;

    // Check if it's a validation error by looking at the error structure
    if (exception.message && typeof exception.message === "string") {
      try {
        const parsed = JSON.parse(exception.message);
        return parsed.type === "validation";
      } catch {
        return false;
      }
    }

    return (
      exception.type === "validation" || exception.code === "VALIDATION_ERROR"
    );
  }
}

/**
 * Database Exception Filter - Handles database errors
 * @example
 * @UseFilters(DatabaseExceptionFilter)
 * @Controller('/users')
 * export class UserController {}
 */
export class DatabaseExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    // Check for common database errors
    let message = "Database error occurred";
    let statusCode = 500;

    if (exception.code === "23505" || exception.message?.includes("unique")) {
      message = "Resource already exists";
      statusCode = 409; // Conflict
    } else if (
      exception.code === "23503" ||
      exception.message?.includes("foreign key")
    ) {
      message = "Referenced resource does not exist";
      statusCode = 400;
    } else if (
      exception.code === "23502" ||
      exception.message?.includes("not null")
    ) {
      message = "Required field is missing";
      statusCode = 400;
    }

    return {
      statusCode,
      error: "Database Error",
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }
}

/**
 * Authentication Exception Filter - Handles auth errors
 * @example
 * @UseFilters(AuthenticationExceptionFilter)
 * @Controller('/auth')
 * export class AuthController {}
 */
export class AuthenticationExceptionFilter
  implements WynkExceptionFilter<UnauthorizedException>
{
  catch(exception: UnauthorizedException, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    return {
      statusCode: exception.statusCode,
      error: "Authentication Failed",
      message: exception.message || "Invalid credentials",
      timestamp: new Date().toISOString(),
      path: request.url,
      hint: "Please check your authentication token or credentials",
    };
  }
}

/**
 * Authorization Exception Filter - Handles permission errors
 * @example
 * @UseFilters(AuthorizationExceptionFilter)
 * @Controller('/admin')
 * export class AdminController {}
 */
export class AuthorizationExceptionFilter
  implements WynkExceptionFilter<ForbiddenException>
{
  catch(exception: ForbiddenException, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    return {
      statusCode: exception.statusCode,
      error: "Authorization Failed",
      message:
        exception.message ||
        "You don't have permission to access this resource",
      timestamp: new Date().toISOString(),
      path: request.url,
      requiredPermissions: (exception as any).requiredPermissions || [],
    };
  }
}

/**
 * Not Found Exception Filter - Handles 404 errors
 * @example
 * @UseFilters(NotFoundExceptionFilter)
 * @Get('/:id')
 * async findOne(@Param('id') id: string) {}
 */
export class NotFoundExceptionFilter
  implements WynkExceptionFilter<NotFoundException>
{
  catch(exception: NotFoundException, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    return {
      statusCode: exception.statusCode,
      error: "Not Found",
      message: exception.message || "Resource not found",
      timestamp: new Date().toISOString(),
      path: request.url,
      suggestion: "Please check the resource ID or URL",
    };
  }
}

/**
 * Rate Limit Exception Filter - Handles rate limit errors
 * @example
 * @UseFilters(RateLimitExceptionFilter)
 * @Post()
 * async create() {}
 */
export class RateLimitExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: exception.message || "Rate limit exceeded",
      timestamp: new Date().toISOString(),
      path: request.url,
      retryAfter: exception.retryAfter || 60,
      hint: "Please wait before making another request",
    };
  }
}

/**
 * Business Logic Exception Filter - Handles business rule violations
 * @example
 * @UseFilters(BusinessLogicExceptionFilter)
 * @Post('/transfer')
 * async transfer(@Body() data: any) {}
 */
export class BusinessLogicExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    return {
      statusCode: exception.statusCode || 422,
      error: "Business Rule Violation",
      message: exception.message || "Business logic constraint violated",
      timestamp: new Date().toISOString(),
      path: request.url,
      rule: exception.rule || "unknown",
      details: exception.details || {},
    };
  }
}

/**
 * File Upload Exception Filter - Handles file upload errors
 * @example
 * @UseFilters(FileUploadExceptionFilter)
 * @Post('/upload')
 * async upload(@UploadedFile() file: any) {}
 */
export class FileUploadExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    let message = "File upload failed";

    if (exception.message?.includes("size")) {
      message = "File size exceeds limit";
    } else if (exception.message?.includes("type")) {
      message = "Invalid file type";
    } else if (exception.message?.includes("required")) {
      message = "File is required";
    }

    return {
      statusCode: 400,
      error: "File Upload Error",
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }
}

/**
 * Global Exception Filter - Catches all unhandled exceptions
 * @example
 * app.useGlobalFilters(new GlobalExceptionFilter());
 */
export class GlobalExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    const statusCode = exception.statusCode || 500;
    const message = exception.message || "Internal server error";

    // Log the error for debugging
    console.error("❌ Unhandled exception:", {
      statusCode,
      message,
      path: request.url,
      method: request.method,
      stack: exception.stack,
    });

    return {
      statusCode,
      error: exception.name || "Error",
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV === "development" && {
        stack: exception.stack,
      }),
    };
  }
}
