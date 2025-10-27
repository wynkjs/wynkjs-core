import {
  WynkExceptionFilter,
  ExecutionContext,
  Catch,
  HttpException,
} from "wynkjs";

/**
 * Error Response DTO structure
 */
interface ErrorResponseDto {
  statusCode: number;
  message: string;
  error?: string;
  name?: string;
  errors?: any;
  stack?: string;
  timestamp?: string;
  path?: string;
}

/**
 * Custom Global Exception Filter
 * Handles all HttpException instances and unknown errors
 * Provides different responses for production vs development
 *
 * Based on modern exception filter patterns with:
 * - 4xx Client Errors handling
 * - 5xx Server Errors handling
 * - Production vs Development modes
 * - Comprehensive error logging
 */
@Catch() // Catches all exceptions
export class CustomExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const ctx = context.getContext();
    const request = context.getRequest();
    const isProduction = process.env.NODE_ENV === "production";

    let status: number;
    const errorResponse: ErrorResponseDto = {} as ErrorResponseDto;

    // Handle HttpException (known errors)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 4xx Client Errors (400-499)
      if (status >= 400 && status < 500) {
        errorResponse.statusCode = status;
        errorResponse.message =
          (exceptionResponse as any).message || "Client Error";
        errorResponse.errors = (exceptionResponse as any).errors;

        if (!isProduction) {
          errorResponse.error =
            (exceptionResponse as any).error || exception.name;
          errorResponse.name = exception.name;
        }
      }
      // 5xx Server Errors (500-599)
      else if (status >= 500) {
        errorResponse.statusCode = status;
        errorResponse.message = isProduction
          ? "Something went wrong"
          : (exceptionResponse as any).message || "Server Error";

        if (!isProduction) {
          errorResponse.errors = (exceptionResponse as any).errors;
          errorResponse.error =
            (exceptionResponse as any).error || exception.name;
          errorResponse.name = exception.name;
          errorResponse.stack = exception.stack || "No stack trace available";
        }
      }

      // Log the error
      this.logError(errorResponse, "CustomExceptionFilter");
    }
    // Handle unknown errors (treated as 500)
    else {
      status = 500;
      errorResponse.statusCode = status;
      errorResponse.message = isProduction
        ? "Something went wrong"
        : exception.message || "Internal Server Error";

      if (!isProduction) {
        errorResponse.error =
          exception.error || exception.message || "Internal Server Error";
        errorResponse.name = exception.name || "Error";
        errorResponse.errors =
          exception.errors ||
          exception.message ||
          "No additional error information";
        errorResponse.stack = exception.stack || "No stack trace available";
      }

      // Log unknown errors with full details
      const loggerResponse: ErrorResponseDto = {
        statusCode: errorResponse.statusCode,
        message: errorResponse.message,
        error: errorResponse.error,
        name: errorResponse.name,
        errors: errorResponse.errors,
      };
      this.logError(
        loggerResponse,
        "CustomExceptionFilter - UnknownError",
        exception.stack
      );
    }

    // Add timestamp and path to all responses
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = request.url;

    // Set HTTP status code on response
    ctx.set.status = status;

    return errorResponse;
  }

  /**
   * Logger method - customize this for your logging needs
   * Can be replaced with Winston, Pino, or any logger
   */
  private logError(
    errorResponse: ErrorResponseDto,
    filterName: string,
    stack?: string
  ): void {
    const logLevel =
      errorResponse.statusCode >= 500 ? "🔴 ERROR" : "⚠️  WARNING";

    console.error(`\n${"=".repeat(80)}`);
    console.error(`${logLevel} [${filterName}]`);
    console.error(`${"=".repeat(80)}`);
    console.error("Status Code:", errorResponse.statusCode);
    console.error("Message:", errorResponse.message);

    if (errorResponse.error) {
      console.error("Error Type:", errorResponse.error);
    }

    if (errorResponse.name) {
      console.error("Exception Name:", errorResponse.name);
    }

    if (errorResponse.errors) {
      console.error(
        "Validation Errors:",
        JSON.stringify(errorResponse.errors, null, 2)
      );
    }

    if (stack) {
      console.error("Stack Trace:\n", stack);
    }

    console.error("Timestamp:", errorResponse.timestamp);
    console.error("Path:", errorResponse.path);
    console.error(`${"=".repeat(80)}\n`);

    // TODO: Add your custom logging integrations here:
    // - Sentry: Sentry.captureException(exception)
    // - Datadog: logger.error(errorResponse)
    // - CloudWatch: cloudwatch.putLogEvents(errorResponse)
    // - Custom monitoring service
    // - Database error logging
    // - Email alerts for critical errors
  }
}
