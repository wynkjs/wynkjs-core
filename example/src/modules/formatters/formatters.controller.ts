import {
  Controller,
  Get,
  Post,
  Body,
  Injectable,
  FormatErrorFormatter,
  SimpleErrorFormatter,
  DetailedErrorFormatter,
  DTO,
} from "wynkjs";

const SampleDTO = DTO.Strict({
  email: DTO.String({ format: "email", error: "Must be a valid email" }),
  age: DTO.Number({ minimum: 18, error: "Must be at least 18" }),
});

@Injectable()
@Controller("/formatters")
export class FormattersController {
  @Get("/")
  index() {
    return {
      feature: "FormattersController — demonstrates FormatErrorFormatter, SimpleErrorFormatter, DetailedErrorFormatter",
      note: "Formatters are configured at WynkFactory.create({ validationErrorFormatter: ... }). This app uses DetailedErrorFormatter. POST to /formatters/validate with invalid body to see formatted validation errors.",
      available: {
        FormatErrorFormatter: 'Object-based: { field: ["messages"] }',
        SimpleErrorFormatter: 'Simple array: ["message1", "message2"]',
        DetailedErrorFormatter: "Detailed: [{ field, message, value }]",
      },
      formatter_instances: {
        FormatErrorFormatter: new FormatErrorFormatter(),
        SimpleErrorFormatter: new SimpleErrorFormatter(),
        DetailedErrorFormatter: new DetailedErrorFormatter(),
      },
    };
  }

  @Post({ path: "/validate", body: SampleDTO })
  validate(@Body() body: { email: string; age: number }) {
    return {
      feature: "Validation passed — send invalid body (bad email or age < 18) to see DetailedErrorFormatter output",
      received: body,
    };
  }

  @Get("/formatter-info")
  formatterInfo() {
    const format = new FormatErrorFormatter();
    const simple = new SimpleErrorFormatter();
    const detailed = new DetailedErrorFormatter();
    return {
      feature: "All 3 error formatter instances created and resolved successfully",
      formatters: [
        { name: "FormatErrorFormatter", type: typeof format },
        { name: "SimpleErrorFormatter", type: typeof simple },
        { name: "DetailedErrorFormatter", type: typeof detailed },
      ],
      usage: "Pass to WynkFactory.create({ validationErrorFormatter: new DetailedErrorFormatter() })",
    };
  }
}
