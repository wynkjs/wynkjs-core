import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Injectable,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  DefaultValuePipe,
  TrimPipe,
  ParseDatePipe,
  SanitizePipe,
  TransformCasePipe,
  ParseJSONPipe,
  ValidateEmailPipe,
  ValidateLengthPipe,
  ValidateRangePipe,
  StripHTMLPipe,
  SlugifyPipe,
  ParseCommaSeparatedPipe,
  DTO,
} from "wynkjs";

enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue",
}

const EchoBodyDTO = DTO.Strict({
  message: DTO.String({ minLength: 1 }),
});

@Injectable()
@Controller("/pipes")
export class PipesController {
  @Get("/parse-int/:value")
  parseInt(@Param("value", ParseIntPipe) value: number) {
    return {
      value,
      type: typeof value,
      feature: "ParseIntPipe — converts ':value' string to integer",
    };
  }

  @Get("/parse-float/:value")
  parseFloat(@Param("value", ParseFloatPipe) value: number) {
    return {
      value,
      type: typeof value,
      feature: "ParseFloatPipe — converts ':value' string to float",
    };
  }

  @Get("/parse-bool/:value")
  parseBool(@Param("value", ParseBoolPipe) value: boolean) {
    return {
      value,
      type: typeof value,
      feature: "ParseBoolPipe — converts 'true'/'false' string to boolean",
    };
  }

  @Get("/parse-array")
  parseArray(@Query("items", ParseArrayPipe) items: string[]) {
    return {
      items,
      count: Array.isArray(items) ? items.length : 0,
      feature: "ParseArrayPipe — parses comma-separated query param into array. Try ?items=a,b,c",
    };
  }

  @Get("/parse-uuid/:id")
  parseUUID(@Param("id", ParseUUIDPipe) id: string) {
    return {
      id,
      feature: "ParseUUIDPipe — validates UUID format. Try a valid UUID like 550e8400-e29b-41d4-a716-446655440000",
    };
  }

  @Get("/parse-enum/:color")
  parseEnum(@Param("color", new ParseEnumPipe(Color)) color: Color) {
    return {
      color,
      validValues: Object.values(Color),
      feature: "ParseEnumPipe — validates value is in enum. Try: red, green, blue",
    };
  }

  @Get("/default-value")
  defaultValue(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return {
      page,
      limit,
      feature: "DefaultValuePipe — returns default when query param is absent. Try without ?page or ?limit",
    };
  }

  @Get("/trim/:text")
  @UsePipes(TrimPipe)
  trim(@Param("text") text: string) {
    return {
      text,
      feature: "TrimPipe — trims whitespace from string values",
    };
  }

  @Post("/validate")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  validate(@Body() body: { message: string }) {
    return {
      body,
      feature: "ValidationPipe — validates and whitelists request body",
    };
  }

  @Get("/parse-date/:date")
  parseDate(@Param("date", ParseDatePipe) date: Date) {
    return {
      date,
      iso: date instanceof Date ? date.toISOString() : date,
      feature: "ParseDatePipe — parses date string into Date object. Try: 2025-01-15",
    };
  }

  @Get("/sanitize/:text")
  @UsePipes(SanitizePipe)
  sanitize(@Param("text") text: string) {
    return {
      text,
      feature: "SanitizePipe — sanitizes string input",
    };
  }

  @Get("/transform-case/:text")
  @UsePipes(new TransformCasePipe("upper"))
  transformCase(@Param("text") text: string) {
    return {
      text,
      feature: "TransformCasePipe('upper') — transforms string to uppercase",
    };
  }

  @Get("/parse-json")
  parseJSON(@Query("data", ParseJSONPipe) data: any) {
    return {
      data,
      feature: "ParseJSONPipe — parses JSON string from query param. Try: ?data={\"key\":\"value\"}",
    };
  }

  @Get("/validate-email/:email")
  validateEmail(@Param("email", ValidateEmailPipe) email: string) {
    return {
      email,
      feature: "ValidateEmailPipe — validates email format. Try: user@example.com",
    };
  }

  @Get("/validate-length/:text")
  validateLength(
    @Param("text", new ValidateLengthPipe({ min: 3, max: 50 })) text: string
  ) {
    return {
      text,
      length: text.length,
      feature: "ValidateLengthPipe(min:3, max:50) — validates string length",
    };
  }

  @Get("/validate-range/:num")
  validateRange(
    @Param("num", ParseIntPipe, new ValidateRangePipe({ min: 1, max: 100 })) num: number
  ) {
    return {
      num,
      feature: "ValidateRangePipe(min:1, max:100) — validates numeric range. Try values 1-100",
    };
  }

  @Get("/strip-html/:text")
  @UsePipes(StripHTMLPipe)
  stripHTML(@Param("text") text: string) {
    return {
      text,
      feature: "StripHTMLPipe — strips HTML tags from input",
    };
  }

  @Get("/slugify/:text")
  @UsePipes(SlugifyPipe)
  slugify(@Param("text") text: string) {
    return {
      text,
      feature: "SlugifyPipe — converts text to URL-friendly slug. Try 'Hello World'",
    };
  }

  @Get("/comma-separated")
  commaSeparated(
    @Query("tags", ParseCommaSeparatedPipe) tags: string[]
  ) {
    return {
      tags,
      count: Array.isArray(tags) ? tags.length : 0,
      feature: "ParseCommaSeparatedPipe — splits comma-separated string. Try: ?tags=js,ts,bun",
    };
  }

  @Get("/combined/:text")
  combined(
    @Param("text", TrimPipe, new TransformCasePipe("lower"), SlugifyPipe) text: string
  ) {
    return {
      text,
      feature: "Chained pipes on one param: TrimPipe → TransformCasePipe('lower') → SlugifyPipe",
    };
  }
}
