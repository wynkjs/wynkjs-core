import { Catch, ValidationPipe, WynkExceptionFilter } from "wynkjs";

@Catch() // Catch validation errors
export class ValidationExceptionFilter implements WynkExceptionFilter {
  private validationPipe: ValidationPipe | null = null;

  constructor(validationPipe?: ValidationPipe) {
    this.validationPipe = validationPipe || null;
  }

  catch(exception: any, context: any) {
    const isDev = true;
    const ctx = context.getContext();

    // Check if this is a validation error
    if (!this.isValidationError(exception)) {
      // Not a validation error, let other filters handle it
      throw exception;
    }

    console.error("\n" + "=".repeat(80));
    console.error(`✋ VALIDATION ERROR`);
    console.error("=".repeat(80));

    // Log error details

    console.error("=".repeat(80) + "\n");

    // Format response using ValidationPipe if available
    let response: any;
    if (this.validationPipe) {
      response = this.validationPipe.formatError(exception);
    } else {
      response = this.defaultFormat(exception);
    }

    // Add stack trace in development
    if (isDev && exception.stack) {
      response.stack = exception.stack;
    }

    ctx.set.status = response.statusCode || 400;
    return response;
  }

  private isValidationError(exception: any): boolean {
    if (!exception) return false;

    // Check if it's a validation error by looking at the error structure
    // Elysia validation errors have a specific message format
    if (exception.message && typeof exception.message === "string") {
      // Try to parse the message as JSON
      try {
        const parsed = JSON.parse(exception.message);
        return parsed.type === "validation";
      } catch {
        // Not JSON, check if message contains validation keywords
        return false;
      }
    }

    // Check if it's already a validation object
    return (
      exception.type === "validation" || exception.code === "VALIDATION_ERROR"
    );
  }

  private defaultFormat(exception: any): any {
    let validationData: any;

    if (typeof exception.message === "string") {
      try {
        validationData = JSON.parse(exception.message);
      } catch {
        validationData = { message: exception.message };
      }
    } else {
      validationData = exception;
    }

    const errors: Array<{ field: string; message: string; value?: any }> = [];

    if (validationData.errors && validationData.errors.length > 0) {
      validationData.errors.forEach((err: any) => {
        errors.push({
          field: err.path?.replace(/^\//, "") || "unknown",
          message: err.summary || err.message,
          value: err.value,
        });
      });
    } else {
      errors.push({
        field: validationData.property?.replace(/^\//, "") || "unknown",
        message: validationData.summary || validationData.message,
        value: validationData.value,
      });
    }

    return {
      statusCode: 400,
      message:
        validationData.summary || validationData.message || "Validation failed",
      errors,
    };
  }
}
