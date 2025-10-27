import {
  HttpException,
  NotFoundException,
  WynkExceptionFilter,
} from "../decorators/exception.decorators";
import { ExecutionContext } from "../decorators/guard.decorators";

/**
 * Database Exception Filter - Handles database errors ONLY (not HttpExceptions)
 *
 * This filter catches actual database errors (like unique constraint violations,
 * foreign key errors, etc.) and converts them to user-friendly messages.
 *
 * It will NOT catch HttpException or its subclasses (ConflictException, etc.)
 * that you throw manually - those will pass through to be handled correctly.
 *
 * @example
 * // Use as global filter
 * app.useGlobalFilters(new DatabaseExceptionFilter());
 *
 * // Use on specific controller
 * @UseFilters(DatabaseExceptionFilter)
 * @Controller('/users')
 * export class UserController {
 *   @Post()
 *   async create(@Body() data: any) {
 *     // If you throw manually, it passes through:
 *     if (await this.userExists(data.email)) {
 *       throw new ConflictException('User with this email already exists'); // ✅ Works correctly
 *     }
 *
 *     // If database throws error, filter catches it:
 *     return await this.db.insert(users).values(data); // ❌ DB unique constraint error → caught by filter
 *   }
 * }
 *
 * Handles these database error codes:
 * - 23505: Unique constraint violation → 409 Conflict
 * - 23503: Foreign key constraint violation → 400 Bad Request
 * - 23502: Not null constraint violation → 400 Bad Request
 */
export class DatabaseExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();

    // Don't catch HttpException or its subclasses (like ConflictException)
    // These are intentionally thrown by the user
    if (exception instanceof HttpException) {
      throw exception;
    }

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
 * Not Found Exception Filter - Handles 404 errors with smart detection
 *
 * This filter is SMART - it only handles NotFoundExceptionFilter if:
 * 1. The exception is NotFoundException, AND
 * 2. No response data has been set (empty, null, empty array, or empty object)
 *
 * This allows it to be used globally without breaking routes that return
 * legitimate empty responses or have their own error handling.
 *
 * @example
 * // ✅ Can be used globally - smart filtering
 * app.useGlobalFilters(
 *   new NotFoundExceptionFilter(),  // Safe to use globally now!
 *   new GlobalExceptionFilter()
 * );
 *
 */

export class NotFoundExceptionFilter
  implements WynkExceptionFilter<NotFoundException>
{
  catch(exception: NotFoundException, context: ExecutionContext) {
    const response = context.getResponse();
    const request = context.getRequest();
    const hasResponseData = this.hasResponseData(response);

    if (hasResponseData) {
      throw exception;
    }

    return {
      statusCode: exception.statusCode,
      error: "Not Found",
      message: exception.message || "Resource not found",
      timestamp: new Date().toISOString(),
      path: request.url,
      suggestion: "Please check the resource ID or URL",
    };
  }

  /**
   * Check if response has meaningful data
   * Returns false for: null, undefined, {}, [], ""
   * Returns true for: anything else
   */
  private hasResponseData(response: any): boolean {
    if (response === null || response === undefined) {
      return false;
    }

    // Check for empty object
    if (typeof response === "object" && !Array.isArray(response)) {
      return Object.keys(response).length > 0;
    }

    // Check for empty array
    if (Array.isArray(response)) {
      return response.length > 0;
    }

    // Check for empty string
    if (typeof response === "string") {
      return response.length > 0;
    }

    // For numbers, booleans, etc. - consider them as having data
    return true;
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

    // Don't catch HttpException or its subclasses
    if (exception instanceof HttpException) {
      throw exception;
    }

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

/**
// ============================================================================
// KEY TAKEAWAYS
// ============================================================================
// 
// 1. Order matters: Specific → General
// 2. Filters can re-throw exceptions they don't handle
// 3. HttpException and subclasses should pass through specialized filters
// 4. Global filters catch everything not handled by controller/method filters
// 5. Always have a GlobalExceptionFilter as the last filter (catch-all)
// 
// ============================================================================
*/
