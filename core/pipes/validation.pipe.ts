import "reflect-metadata";
import { schemaRegistry } from "../schema-registry";

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
 * Validation Error structure (WynkJS format)
 */
export interface WynkJSValidationError {
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
 * Handles WynkJS validation errors and formats them
 */
export class ValidationPipe implements ValidationPipeTransform {
  protected options: {
    exceptionFactory?: (errors: WynkJSValidationError) => any;
    transform?: boolean;
    whitelist?: boolean;
  };

  constructor(options?: {
    exceptionFactory?: (errors: WynkJSValidationError) => any;
    transform?: boolean;
    whitelist?: boolean;
  }) {
    this.options = options || {};
  }

  /**
   * Transform method (not used for WynkJS validation, but required by interface)
   */
  transform(value: any, metadata: ArgumentMetadata): any {
    return value;
  }

  /**
   * Format WynkJS validation error
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
   * Parse WynkJS validation error from exception
   */
  protected parseValidationError(exception: any): WynkJSValidationError {
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

    return validationData as WynkJSValidationError;
  }

  /**
   * Default error formatting with custom errorMessage support
   */
  protected defaultFormatError(
    error: WynkJSValidationError,
    schemaKey?: string
  ): any {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err) => {
        const fieldPath = err.path?.replace(/^\//, "") || "unknown";

        // Try to get custom message from schema registry first
        let message = err.summary || err.message;
        if (schemaKey) {
          const customMessage = schemaRegistry.getErrorMessage(
            schemaKey,
            fieldPath
          );
          if (customMessage) {
            message = customMessage;
          }
        }

        errors.push({
          field: fieldPath,
          message: message,
          value: err.value,
        });
      });
    } else {
      // Check schema for custom errorMessage
      const customMessage = (error as any).schema?.errorMessage;
      const message = customMessage || error.summary || error.message;

      errors.push({
        field: error.property?.replace(/^\//, "") || "unknown",
        message: message,
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
 * Custom Format Error Pipe
 * Formats validation errors as { [field]: [messages] }
 */
export class FormatErrorPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (error: WynkJSValidationError) => {
        const formattedErrors: Record<string, string[]> = {};

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            const field = err.path?.replace(/^\//, "") || "unknown";
            if (!formattedErrors[field]) {
              formattedErrors[field] = [];
            }
            // Use custom errorMessage if available
            const customMessage = err.schema?.errorMessage;
            const message = customMessage || err.summary || err.message;
            formattedErrors[field].push(message);
          });
        } else {
          const field = error.property?.replace(/^\//, "") || "unknown";
          // Use custom errorMessage if available
          const customMessage = (error as any).schema?.errorMessage;
          const message = customMessage || error.summary || error.message;
          formattedErrors[field] = [message];
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
      exceptionFactory: (error: WynkJSValidationError) => {
        const messages: string[] = [];

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            // Use custom errorMessage if available
            const customMessage = err.schema?.errorMessage;
            const message = customMessage || err.summary || err.message;
            messages.push(message);
          });
        } else {
          // Use custom errorMessage if available
          const customMessage = (error as any).schema?.errorMessage;
          const message = customMessage || error.summary || error.message;
          messages.push(message);
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
      exceptionFactory: (error: WynkJSValidationError) => {
        const errors: Array<{
          field: string;
          message: string;
          value: any;
          expected?: string;
        }> = [];

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            // Use custom errorMessage if available
            const customMessage = err.schema?.errorMessage;
            const message = customMessage || err.summary || err.message;

            errors.push({
              field: err.path?.replace(/^\//, "") || "unknown",
              message: message,
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
