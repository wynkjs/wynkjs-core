import "reflect-metadata";
import { WynkPipeTransform, ArgumentMetadata } from "./pipe.decorators";
import { BadRequestException } from "./exception.decorators";

/**
 * Advanced Pipes for WynkJS Framework
 * Additional pipes for common transformations and validations
 */

/**
 * Parse Date Pipe - Converts string to Date object
 * @example
 * @Get('/:date')
 * async getByDate(@Param('date', ParseDatePipe) date: Date) {}
 */
export class ParseDatePipe implements WynkPipeTransform<string, Date> {
  transform(value: string, metadata?: ArgumentMetadata): Date {
    if (!value) {
      throw new BadRequestException("Date value is required");
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(`"${value}" is not a valid date`);
    }

    return date;
  }
}

/**
 * Parse File Pipe - Validates and transforms file uploads
 * @example
 * @Post('/upload')
 * async uploadFile(@UploadedFile(ParseFilePipe) file: any) {}
 */
export class ParseFilePipe implements WynkPipeTransform<any, any> {
  constructor(
    private options?: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      required?: boolean;
    }
  ) {}

  transform(value: any, metadata?: ArgumentMetadata): any {
    if (!value) {
      if (this.options?.required) {
        throw new BadRequestException("File is required");
      }
      return null;
    }

    // Check file size
    if (this.options?.maxSize && value.size > this.options.maxSize) {
      const maxSizeMB = (this.options.maxSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type
    if (
      this.options?.allowedTypes &&
      !this.options.allowedTypes.includes(value.type)
    ) {
      throw new BadRequestException(
        `File type must be one of: ${this.options.allowedTypes.join(", ")}`
      );
    }

    return value;
  }
}

/**
 * Sanitize Pipe - Sanitizes input by removing dangerous characters
 * @example
 * @Post()
 * async create(@Body(SanitizePipe) data: any) {}
 */
export class SanitizePipe implements WynkPipeTransform {
  private dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  transform(value: any, metadata?: ArgumentMetadata): any {
    if (typeof value === "string") {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item, metadata));
    }

    if (value && typeof value === "object") {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = this.transform(value[key], metadata);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    let sanitized = str;

    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, "");
    }

    return sanitized;
  }
}

/**
 * Transform Case Pipe - Transforms string case
 * @example
 * @Post()
 * async create(@Body('email', new TransformCasePipe('lower')) email: string) {}
 */
export class TransformCasePipe implements WynkPipeTransform<string, string> {
  constructor(private caseType: "lower" | "upper" | "title" = "lower") {}

  transform(value: string, metadata?: ArgumentMetadata): string {
    if (typeof value !== "string") {
      return value;
    }

    switch (this.caseType) {
      case "lower":
        return value.toLowerCase();
      case "upper":
        return value.toUpperCase();
      case "title":
        return value.replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      default:
        return value;
    }
  }
}

/**
 * Parse JSON Pipe - Parses JSON strings
 * @example
 * @Post()
 * async create(@Body('metadata', ParseJSONPipe) metadata: any) {}
 */
export class ParseJSONPipe implements WynkPipeTransform<string, any> {
  transform(value: string, metadata?: ArgumentMetadata): any {
    if (!value || typeof value !== "string") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException("Invalid JSON format");
    }
  }
}

/**
 * Validate Email Pipe - Validates email format
 * @example
 * @Post()
 * async create(@Body('email', ValidateEmailPipe) email: string) {}
 */
export class ValidateEmailPipe implements WynkPipeTransform<string, string> {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  transform(value: string, metadata?: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException("Email is required");
    }

    if (!this.emailRegex.test(value)) {
      throw new BadRequestException("Invalid email format");
    }

    return value.toLowerCase();
  }
}

/**
 * Validate Length Pipe - Validates string/array length
 * @example
 * @Post()
 * async create(@Body('username', new ValidateLengthPipe(3, 20)) username: string) {}
 */
export class ValidateLengthPipe implements WynkPipeTransform {
  constructor(
    private min?: number,
    private max?: number
  ) {}

  transform(value: any, metadata?: ArgumentMetadata): any {
    if (!value) {
      return value;
    }

    const length =
      typeof value === "string" || Array.isArray(value) ? value.length : 0;

    if (this.min !== undefined && length < this.min) {
      throw new BadRequestException(
        `Length must be at least ${this.min} characters`
      );
    }

    if (this.max !== undefined && length > this.max) {
      throw new BadRequestException(
        `Length must not exceed ${this.max} characters`
      );
    }

    return value;
  }
}

/**
 * Validate Range Pipe - Validates number is within range
 * @example
 * @Get()
 * async getData(@Query('page', new ValidateRangePipe(1, 100)) page: number) {}
 */
export class ValidateRangePipe implements WynkPipeTransform<number, number> {
  constructor(
    private min?: number,
    private max?: number
  ) {}

  transform(value: number, metadata?: ArgumentMetadata): number {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) {
      throw new BadRequestException("Value must be a number");
    }

    if (this.min !== undefined && num < this.min) {
      throw new BadRequestException(`Value must be at least ${this.min}`);
    }

    if (this.max !== undefined && num > this.max) {
      throw new BadRequestException(`Value must not exceed ${this.max}`);
    }

    return num;
  }
}

/**
 * Strip HTML Pipe - Removes HTML tags from string
 * @example
 * @Post()
 * async create(@Body('comment', StripHTMLPipe) comment: string) {}
 */
export class StripHTMLPipe implements WynkPipeTransform<string, string> {
  transform(value: string, metadata?: ArgumentMetadata): string {
    if (typeof value !== "string") {
      return value;
    }

    return value.replace(/<[^>]*>/g, "");
  }
}

/**
 * Slugify Pipe - Converts string to URL-friendly slug
 * @example
 * @Post()
 * async create(@Body('title', SlugifyPipe) slug: string) {}
 */
export class SlugifyPipe implements WynkPipeTransform<string, string> {
  transform(value: string, metadata?: ArgumentMetadata): string {
    if (typeof value !== "string") {
      return value;
    }

    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

/**
 * Parse Comma Separated Pipe - Converts comma-separated string to array
 * @example
 * @Get()
 * async search(@Query('tags', ParseCommaSeparatedPipe) tags: string[]) {}
 */
export class ParseCommaSeparatedPipe
  implements WynkPipeTransform<string, string[]>
{
  constructor(private trim: boolean = true) {}

  transform(value: string, metadata?: ArgumentMetadata): string[] {
    if (!value || typeof value !== "string") {
      return [];
    }

    const items = value.split(",");

    return this.trim ? items.map((item) => item.trim()) : items;
  }
}
