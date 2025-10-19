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
 * Validation Exception Filter - Handles validation errors
 * @example
 * @UseFilters(ValidationExceptionFilter)
 * @Post()
 * async create(@Body() data: any) {}
 */
export class ValidationExceptionFilter
  implements WynkExceptionFilter<BadRequestException>
{
  catch(exception: BadRequestException, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    return {
      statusCode: exception.statusCode,
      error: "Validation Error",
      message: exception.message,
      errors: (exception as any).errors || [],
      timestamp: new Date().toISOString(),
      path: request.url,
    };
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
