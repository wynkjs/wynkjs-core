import "reflect-metadata";

/**
 * Validation Pipe Interface
 * Transform and validate data before it reaches the controller
 */
export interface ValidationPipeTransform<T = any, R = any> {
  transform(value: T, metadata: ArgumentMetadata): R | Promise<R>;
}

/**
 * Metadata about the argument being validated
 */
export interface ArgumentMetadata {
  type: "body" | "query" | "param" | "custom";
  metatype?: any;
  data?: string;
}

/**
 * Validation Error structure (Elysia format)
 */
export interface ElysiaValidationError {
  type: "validation";
  on: "body" | "params" | "query" | "headers";
  property: string;
  message: string;
  summary?: string;
  value?: any;
  schema?: any;
  errors?: Array<{
    type: number;
    schema: any;
    path: string;
    value: any;
    message: string;
    summary: string;
  }>;
}

/**
 * Base Validation Pipe
 * Handles Elysia validation errors and formats them
 */
export class ValidationPipe implements ValidationPipeTransform {
  protected options: {
    exceptionFactory?: (errors: ElysiaValidationError) => any;
    transform?: boolean;
    whitelist?: boolean;
  };

  constructor(options?: {
    exceptionFactory?: (errors: ElysiaValidationError) => any;
    transform?: boolean;
    whitelist?: boolean;
  }) {
    this.options = options || {};
  }

  /**
   * Transform method (not used for Elysia validation, but required by interface)
   */
  transform(value: any, metadata: ArgumentMetadata): any {
    return value;
  }

  /**
   * Format Elysia validation error
   * This is called by the exception filter
   */
  formatError(exception: any): any {
    // Parse validation error from exception
    const validationError = this.parseValidationError(exception);

    // If user provided custom exception factory, use it
    if (this.options.exceptionFactory) {
      return this.options.exceptionFactory(validationError);
    }

    // Default formatting
    return this.defaultFormatError(validationError);
  }

  /**
   * Parse Elysia validation error from exception
   */
  protected parseValidationError(exception: any): ElysiaValidationError {
    let validationData: any;

    if (typeof exception.message === "string") {
      try {
        validationData = JSON.parse(exception.message);
      } catch {
        validationData = { type: "validation", message: exception.message };
      }
    } else {
      validationData = exception;
    }

    return validationData as ElysiaValidationError;
  }

  /**
   * Default error formatting
   */
  protected defaultFormatError(error: ElysiaValidationError): any {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err) => {
        errors.push({
          field: err.path?.replace(/^\//, "") || "unknown",
          message: err.summary || err.message,
          value: err.value,
        });
      });
    } else {
      errors.push({
        field: error.property?.replace(/^\//, "") || "unknown",
        message: error.summary || error.message,
        value: (error as any).value,
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
 * Custom Format Error Pipe (like NestJS example)
 * Formats validation errors as { [field]: [messages] }
 */
export class FormatErrorPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (error: ElysiaValidationError) => {
        const formattedErrors: Record<string, string[]> = {};

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
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
      },
    });
  }
}

/**
 * Simple Error Pipe
 * Returns flat array of error messages
 */
export class SimpleErrorPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (error: ElysiaValidationError) => {
        const messages: string[] = [];

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            messages.push(err.summary || err.message);
          });
        } else {
          messages.push(error.summary || error.message);
        }

        return {
          statusCode: 400,
          message: messages.join(", "),
          errors: messages,
        };
      },
    });
  }
}

/**
 * Detailed Error Pipe
 * Returns detailed information for each field
 */
export class DetailedErrorPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (error: ElysiaValidationError) => {
        const errors: Array<{
          field: string;
          message: string;
          value: any;
          expected?: string;
        }> = [];

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            errors.push({
              field: err.path?.replace(/^\//, "") || "unknown",
              message: err.summary || err.message,
              value: err.value,
              expected: err.schema?.format
                ? `${err.schema.type} (format: ${err.schema.format})`
                : err.schema?.type,
            });
          });
        }

        return {
          statusCode: 400,
          message: "Validation failed",
          errors,
        };
      },
    });
  }
}
