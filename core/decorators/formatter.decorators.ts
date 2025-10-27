import "reflect-metadata";

/**
 * Error Formatter Interface
 * Used by WynkFactory to format validation errors
 *
 * IMPORTANT: These formatters are passed to WynkFactory.create(), NOT to useGlobalFilters()!
 *
 * @example
 * // CORRECT usage:
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 *   validationErrorFormatter: new FormatErrorFormatter(), // ✅ Pass here
 * });
 *
 * // WRONG usage:
 * app.useGlobalFilters(
 *   new FormatErrorFormatter() // ❌ This is not a filter!
 * );
 */
export interface ErrorFormatter {
  format(validationError: any): any;
}

/**
 * FormatErrorFormatter - Formats as { field: [messages] } object structure
 *
 * Output example:
 * {
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "errors": {
 *     "email": ["Invalid email address"],
 *     "age": ["Must be at least 18"]
 *   }
 * }
 *
 * @example
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 *   validationErrorFormatter: new FormatErrorFormatter(),
 * });
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
 *
 * Output example:
 * {
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "errors": [
 *     "Invalid email address",
 *     "Must be at least 18"
 *   ]
 * }
 *
 * @example
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 *   validationErrorFormatter: new SimpleErrorFormatter(),
 * });
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
 *
 * Output example:
 * {
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "errors": [
 *     {
 *       "field": "email",
 *       "message": "Invalid email address",
 *       "value": "invalid-email",
 *       "expected": {...schema...}
 *     }
 *   ]
 * }
 *
 * @example
 * const app = WynkFactory.create({
 *   controllers: [UserController],
 *   validationErrorFormatter: new DetailedErrorFormatter(),
 * });
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
