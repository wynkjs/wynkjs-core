# Validation Error Formatters

WynkJS provides multiple built-in formatters for validation errors, allowing you to choose the format that best fits your API design.

## Available Formatters

### 1. Default Format (No Formatter)

**Format**: `{ statusCode, message, errors: { field: [messages] } }`

```typescript
const app = WynkFactory.create({
  controllers: [UserController],
  // No validationErrorFormatter specified
});
```

**Example Response**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Expected string to match 'email' format"],
    "age": ["Expected number"]
  }
}
```

### 2. FormatErrorFormatter (Object-based)

**Format**: `{ statusCode, message, errors: { field: [messages] } }`

Same as default but explicitly using the formatter class.

```typescript
import { WynkFactory, FormatErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new FormatErrorFormatter(),
});
```

**Example Response**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Expected string to match 'email' format"],
    "age": ["Expected number"]
  }
}
```

### 3. SimpleErrorFormatter

**Format**: `{ statusCode, message, errors: [messages] }`

Returns validation errors as a simple array of error messages.

```typescript
import { WynkFactory, SimpleErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new SimpleErrorFormatter(),
});
```

**Example Response**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Expected string to match 'email' format", "Expected number"]
}
```

### 4. DetailedErrorFormatter

**Format**: `{ statusCode, message, errors: [{ field, message, value, expected }] }`

Returns detailed information about each validation error including the invalid value and expected schema.

```typescript
import { WynkFactory, DetailedErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter(),
});
```

**Example Response**:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Expected string to match 'email' format",
      "value": "demo@demo1.",
      "expected": { "type": "string", "format": "email" }
    },
    {
      "field": "age",
      "message": "Expected number",
      "value": "notanumber",
      "expected": { "type": "number", "minimum": 18 }
    }
  ]
}
```

## Custom Formatter

You can create your own custom formatter by implementing the `ErrorFormatter` interface:

```typescript
import { ErrorFormatter } from "wynkjs";

class MyCustomFormatter implements ErrorFormatter {
  format(error: any): any {
    // Transform the error object to your desired format
    return {
      success: false,
      code: 400,
      data: null,
      errors: error.errors.map((err: any) => ({
        field: err.path?.replace(/^\//, ""),
        reason: err.summary || err.message,
      })),
    };
  }
}

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new MyCustomFormatter(),
});
```

## Complete Example

```typescript
import {
  WynkFactory,
  FormatErrorFormatter,
  SimpleErrorFormatter,
  DetailedErrorFormatter,
} from "wynkjs";
import { UserController } from "./user.controller";

async function bootstrap() {
  // Choose one of the following:

  // Option 1: Default format (recommended for most APIs)
  const app = WynkFactory.create({
    controllers: [UserController],
    cors: true,
    logger: true,
  });

  // Option 2: Object-based format
  // const app = WynkFactory.create({
  //   controllers: [UserController],
  //   cors: true,
  //   logger: true,
  //   validationErrorFormatter: new FormatErrorFormatter(),
  // });

  // Option 3: Simple array format
  // const app = WynkFactory.create({
  //   controllers: [UserController],
  //   cors: true,
  //   logger: true,
  //   validationErrorFormatter: new SimpleErrorFormatter(),
  // });

  // Option 4: Detailed format with field info
  // const app = WynkFactory.create({
  //   controllers: [UserController],
  //   cors: true,
  //   logger: true,
  //   validationErrorFormatter: new DetailedErrorFormatter(),
  // });

  await app.listen(3000);
  console.log("🎉 Application running on http://localhost:3000");
}

bootstrap();
```

## Testing Different Formats

Test with invalid data to see the different formats:

```bash
curl -X PATCH "http://localhost:3000/users/123" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","age":"notanumber"}'
```

## Best Practices

1. **Default Format**: Use for most REST APIs - provides structured field-based errors
2. **SimpleErrorFormatter**: Use for mobile apps or when you want minimal response size
3. **DetailedErrorFormatter**: Use during development or when debugging client-side validation
4. **Custom Formatter**: Use when you have specific API standards or need to match existing error formats

## Note

The `validationErrorFormatter` option only affects **validation errors** (400 status codes). For other error types (500, 404, etc.), use `app.useGlobalFilters()` with appropriate exception filters like:

```typescript
import { GlobalExceptionFilter, DatabaseExceptionFilter } from "wynkjs";

app.useGlobalFilters(
  new DatabaseExceptionFilter(),
  new GlobalExceptionFilter()
);
```
