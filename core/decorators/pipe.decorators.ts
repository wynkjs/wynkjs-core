import "reflect-metadata";

/**
 * Pipe Decorators and Interfaces for WynkJS Framework
 * Pipes for data validation and transformation
 */

/**
 * Interface that all WynkJS pipes must implement.
 *
 * Pipes transform or validate incoming values before they reach the route handler.
 * They are applied per-parameter via `@UsePipes()` or globally via
 * `app.useGlobalPipes()`.
 *
 * @template T - The input value type
 * @template R - The output (transformed) value type
 *
 * @example
 * ```typescript
 * export class UpperCasePipe implements WynkPipeTransform<string, string> {
 *   transform(value: string): string {
 *     return value.toUpperCase();
 *   }
 * }
 * ```
 */
export interface WynkPipeTransform<T = any, R = any> {
  /**
   * Transform or validate the value.
   *
   * @param value - The raw input value from the request
   * @param metadata - Context about where the value came from (body, query, param, custom)
   * @returns The transformed value, or a Promise resolving to it
   */
  transform(value: T, metadata?: ArgumentMetadata): R | Promise<R>;
}

/**
 * Metadata describing the source and type of a route handler parameter.
 *
 * Passed to `WynkPipeTransform.transform()` so pipes can make decisions
 * based on where the value came from.
 */
export interface ArgumentMetadata {
  /** Where the value was extracted from. */
  type: "body" | "query" | "param" | "custom";
  /** The TypeScript class/constructor of the parameter (if available via reflection). */
  metatype?: any;
  /** The key used to extract a specific field (e.g. `id` in `@Param('id')`). */
  data?: string;
}

/**
 * @UsePipes decorator - Apply pipes to routes, controllers, or parameters
 * @param pipes Pipe classes to apply
 * @example
 * @UsePipes(ValidationPipe)
 * @Controller('/users')
 * export class UserController {}
 *
 * @Post()
 * @UsePipes(ValidationPipe, TransformPipe)
 * create(@Body() dto: CreateDto) {}
 */
export function UsePipes(
  ...pipes: (Function | WynkPipeTransform)[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey && descriptor) {
      // Method decorator
      const existing = Reflect.getMetadata("pipes", target, propertyKey) || [];
      Reflect.defineMetadata(
        "pipes",
        [...existing, ...pipes],
        target,
        propertyKey
      );
      return descriptor;
    } else {
      // Class decorator
      const existing = Reflect.getMetadata("pipes", target) || [];
      Reflect.defineMetadata("pipes", [...existing, ...pipes], target);
      return target;
    }
  };
}

/**
 * Helper function to execute pipes
 */
export async function executePipes(
  pipes: (Function | WynkPipeTransform)[],
  value: any,
  metadata: ArgumentMetadata
): Promise<any> {
  let transformedValue = value;

  for (const pipe of pipes) {
    let pipeInstance: WynkPipeTransform;

    if (typeof pipe === "function") {
      pipeInstance = new (pipe as any)();
    } else {
      pipeInstance = pipe;
    }

    if (!pipeInstance.transform) {
      throw new Error(`Pipe must implement WynkPipeTransform interface`);
    }

    transformedValue = await pipeInstance.transform(transformedValue, metadata);
  }

  return transformedValue;
}

/**
 * Built-in Pipes
 */

/**
 * ValidationPipe - Validates and transforms input data
 * Supports custom error formatting via exceptionFactory
 *
 * @example
 * // Default formatting
 * @UsePipes(new ValidationPipe())
 * create(@Body() dto: CreateDto) {}
 *
 * @example
 * // Custom formatting with detailed errors
 * const customPipe = new ValidationPipe({
 *   exceptionFactory: (errors) => ({
 *     statusCode: 400,
 *     message: 'Validation failed',
 *     errors: errors
 *   })
 * });
 */
export class ValidationPipe implements WynkPipeTransform {
  private options: {
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    transform?: boolean;
    exceptionFactory?: (errors: any) => any;
  };

  constructor(
    options: {
      whitelist?: boolean;
      forbidNonWhitelisted?: boolean;
      transform?: boolean;
      exceptionFactory?: (errors: any) => any;
    } = {}
  ) {
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      ...options,
    };
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // If no metatype or primitive type, return as is
    if (!metadata.metatype || this.isPrimitive(metadata.metatype)) {
      return value;
    }

    // Here you would integrate with class-validator
    // For now, basic validation
    if (value === undefined || value === null) {
      throw new Error(`Validation failed: Value is required`);
    }

    return value;
  }

  /**
   * Format WynkJS validation error
   * Called by ValidationExceptionFilter
   */
  formatError(exception: any): any {
    const validationError = this.parseValidationError(exception);

    // If user provided custom exception factory, use it
    if (this.options.exceptionFactory) {
      return this.options.exceptionFactory(validationError);
    }

    // Default formatting
    return this.defaultFormatError(validationError);
  }

  /**
   * Parse validation error from WynkJS exception
   */
  private parseValidationError(exception: any): any {
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

    return validationData;
  }

  /**
   * Default error formatting
   */
  private defaultFormatError(error: any): any {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err: any) => {
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
        value: error.value,
      });
    }

    return {
      statusCode: 400,
      message: "Validation failed",
      errors,
    };
  }

  private isPrimitive(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return types.includes(metatype);
  }
}

/**
 * ParseIntPipe - Transforms string to integer
 * @example
 * @Get('/:id')
 * findOne(@Param('id', ParseIntPipe) id: number) {}
 */
export class ParseIntPipe implements WynkPipeTransform<string, number> {
  async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new Error(`Validation failed: "${value}" is not an integer`);
    }
    return val;
  }
}

/**
 * ParseFloatPipe - Transforms string to float
 * @example
 * @Get()
 * search(@Query('price', ParseFloatPipe) price: number) {}
 */
export class ParseFloatPipe implements WynkPipeTransform<string, number> {
  async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
    const val = parseFloat(value);
    if (isNaN(val)) {
      throw new Error(`Validation failed: "${value}" is not a number`);
    }
    return val;
  }
}

/**
 * ParseBoolPipe - Transforms string to boolean
 * @example
 * @Get()
 * search(@Query('active', ParseBoolPipe) active: boolean) {}
 */
export class ParseBoolPipe implements WynkPipeTransform<string, boolean> {
  async transform(value: string, metadata: ArgumentMetadata): Promise<boolean> {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    throw new Error(`Validation failed: "${value}" is not a boolean`);
  }
}

/**
 * ParseArrayPipe - Transforms string to array
 * @example
 * @Get()
 * search(@Query('ids', ParseArrayPipe) ids: string[]) {}
 */
export class ParseArrayPipe implements WynkPipeTransform<string, string[]> {
  private separator: string;

  constructor(separator: string = ",") {
    this.separator = separator;
  }

  async transform(
    value: string,
    metadata: ArgumentMetadata
  ): Promise<string[]> {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.split(this.separator).map((item) => item.trim());
    }
    throw new Error(`Validation failed: "${value}" cannot be parsed to array`);
  }
}

/**
 * ParseUUIDPipe - Validates UUID format
 * @example
 * @Get('/:id')
 * findOne(@Param('id', ParseUUIDPipe) id: string) {}
 */
export class ParseUUIDPipe implements WynkPipeTransform<string, string> {
  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new Error(`Validation failed: "${value}" is not a valid UUID`);
    }

    return value;
  }
}

/**
 * ParseEnumPipe - Validates enum values
 * @example
 * enum Status { ACTIVE, INACTIVE }
 * @Get()
 * search(@Query('status', new ParseEnumPipe(Status)) status: Status) {}
 */
export class ParseEnumPipe<T = any> implements WynkPipeTransform<string, T> {
  constructor(private enumType: any) {}

  async transform(value: string, metadata: ArgumentMetadata): Promise<T> {
    const enumValues = Object.values(this.enumType);

    if (!enumValues.includes(value)) {
      throw new Error(
        `Validation failed: "${value}" is not a valid enum value. Valid values: ${enumValues.join(
          ", "
        )}`
      );
    }

    return value as T;
  }
}

/**
 * DefaultValuePipe - Provides default value if undefined
 * @example
 * @Get()
 * search(@Query('page', new DefaultValuePipe(1)) page: number) {}
 */
export class DefaultValuePipe<T = any> implements WynkPipeTransform<T, T> {
  constructor(private defaultValue: T) {}

  async transform(value: T, metadata: ArgumentMetadata): Promise<T> {
    if (value === undefined || value === null) {
      return this.defaultValue;
    }
    return value;
  }
}

/**
 * TrimPipe - Trims whitespace from strings
 * @example
 * @Post()
 * create(@Body('name', TrimPipe) name: string) {}
 */
export class TrimPipe implements WynkPipeTransform<string, string> {
  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    if (typeof value !== "string") {
      return value;
    }
    return value.trim();
  }
}

/**
 * FormatErrorPipe - Formats validation errors as { [field]: [messages] }
 * Object format with field names as keys
 *
 * @example
 * // In index.ts or controller
 * app.useGlobalPipes(new FormatErrorPipe());
 *
 * @example
 * // Response format:
 * {
 *   statusCode: 400,
 *   message: "Validation failed",
 *   errors: {
 *     email: ["Property 'email' should be email"],
 *     mobile: ["Expected string to match '^[6-9]{1}[0-9]{9}$'"]
 *   }
 * }
 */
export class FormatErrorPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (error: any) => {
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
      },
    });
  }
}

/**
 * SimpleErrorPipe - Returns flat array of error messages
 *
 * @example
 * app.useGlobalPipes(new SimpleErrorPipe());
 *
 * @example
 * // Response format:
 * {
 *   statusCode: 400,
 *   message: "Property 'email' should be email, Invalid mobile number",
 *   errors: [
 *     "Property 'email' should be email",
 *     "Invalid mobile number"
 *   ]
 * }
 */
export class SimpleErrorPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (error: any) => {
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
          message: messages.join(", "),
          errors: messages,
        };
      },
    });
  }
}

/**
 * DetailedErrorPipe - Returns detailed information for each field
 *
 * @example
 * app.useGlobalPipes(new DetailedErrorPipe());
 *
 * @example
 * // Response format:
 * {
 *   statusCode: 400,
 *   message: "Validation failed",
 *   errors: [{
 *     field: "email",
 *     message: "Property 'email' should be email",
 *     value: "demo@demo.",
 *     expected: "string (format: email)"
 *   }]
 * }
 */
export class DetailedErrorPipe extends ValidationPipe {
  constructor() {
    super({
      exceptionFactory: (error: any) => {
        const errors: Array<{
          field: string;
          message: string;
          value: any;
          expected?: string;
        }> = [];

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err: any) => {
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

/**
 * Built-in pipe that validates uploaded files by MIME type and/or file size.
 *
 * Throws a `BadRequestException`-style error when a file's type or size
 * does not satisfy the configured constraints.
 *
 * @example
 * ```typescript
 * @Post('/upload')
 * uploadFile(@UploadedFile(new ParseFilePipe({ fileType: 'image/jpeg', maxSize: 5_000_000 })) file: File) {}
 * ```
 */
export class ParseFilePipe implements WynkPipeTransform<File | File[], File | File[]> {
  constructor(
    private readonly options: {
      /**
       * Expected MIME type (e.g. `'image/jpeg'`).
       * Throws if the uploaded file's `type` does not match.
       */
      fileType?: string;
      /**
       * Maximum allowed file size in **bytes**.
       * Throws if the uploaded file's `size` exceeds this value.
       */
      maxSize?: number;
    } = {}
  ) {}

  /**
   * Validates the uploaded file(s) against the configured constraints.
   *
   * @param value - The uploaded `File` or `File[]` from the request.
   * @param _metadata - Argument metadata (unused but required by interface).
   * @returns The original value when validation passes.
   * @throws `Error` when no file is provided, the file type is wrong, or the file exceeds the max size.
   */
  async transform(value: any, _metadata?: ArgumentMetadata): Promise<any> {
    if (value === undefined || value === null) {
      throw new Error("Validation failed: No file uploaded");
    }

    const files: any[] = Array.isArray(value) ? value : [value];

    for (const file of files) {
      if (this.options.fileType && file.type !== this.options.fileType) {
        throw new Error(
          `Validation failed: File type "${file.type}" is not allowed. Expected "${this.options.fileType}"`
        );
      }
      if (this.options.maxSize !== undefined && file.size > this.options.maxSize) {
        throw new Error(
          `Validation failed: File size ${file.size} bytes exceeds the maximum of ${this.options.maxSize} bytes`
        );
      }
    }

    return value;
  }
}
