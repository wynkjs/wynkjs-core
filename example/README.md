# WynkJS Example - Validation Error Formatting

This example demonstrates the three built-in error formatters for validation errors.

## Quick Start

```bash
# Install dependencies
npm install

# Run the server
bun index.ts
```

## Error Formatters

### 1. FormatErrorFormatter (NestJS-style)

Returns errors as `{ field: [messages] }` format.

**Code:**

```typescript
import { ValidationExceptionFilter, FormatErrorFormatter } from "wynkjs";

app.useGlobalFilters(new ValidationExceptionFilter(new FormatErrorFormatter()));
```

**Response:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Expected property 'email' to be string but found: undefined"],
    "name": ["Expected string length greater or equal to 2"]
  }
}
```

### 2. SimpleErrorFormatter

Returns errors as a simple array of messages.

**Code:**

```typescript
import { ValidationExceptionFilter, SimpleErrorFormatter } from "wynkjs";

app.useGlobalFilters(new ValidationExceptionFilter(new SimpleErrorFormatter()));
```

**Response:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Expected property 'email' to be string but found: undefined",
    "Expected string length greater or equal to 2"
  ]
}
```

### 3. DetailedErrorFormatter

Returns detailed information including field, message, value, and expected schema.

**Code:**

```typescript
import { ValidationExceptionFilter, DetailedErrorFormatter } from "wynkjs";

app.useGlobalFilters(
  new ValidationExceptionFilter(new DetailedErrorFormatter())
);
```

**Response:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Expected property 'email' to be string but found: undefined",
      "value": undefined,
      "expected": {
        "format": "email",
        "description": "User email address",
        "type": "string"
      }
    },
    {
      "field": "name",
      "message": "Expected string length greater or equal to 2",
      "value": "A",
      "expected": {
        "minLength": 2,
        "maxLength": 50,
        "type": "string"
      }
    }
  ]
}
```

## Testing

Run the test script to see all formatters in action:

```bash
./test-formats.sh
```

Or test manually:

```bash
# Missing required field (email)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid email format
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"invalid"}'

# Short name (min 2 chars required)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"alice@example.com"}'

# Valid request
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'
```

## Custom Formatter

You can create your own formatter by implementing the `ErrorFormatter` interface:

```typescript
import { ErrorFormatter, ValidationExceptionFilter } from "wynkjs";

class MyCustomFormatter implements ErrorFormatter {
  format(error: any): any {
    // Your custom formatting logic
    return {
      statusCode: 422,
      myCustomFormat: {
        // ... your format
      },
    };
  }
}

app.useGlobalFilters(new ValidationExceptionFilter(new MyCustomFormatter()));
```

## Multiple Filters

You can register multiple filters for different error types:

```typescript
import {
  ValidationExceptionFilter,
  FormatErrorFormatter,
  DatabaseExceptionFilter,
  GlobalExceptionFilter,
} from "wynkjs";

app.useGlobalFilters(
  // Order matters: most specific first
  new ValidationExceptionFilter(new FormatErrorFormatter()),
  new DatabaseExceptionFilter(),
  new GlobalExceptionFilter()
);
```

## API Endpoints

- `GET /users` - List all users
- `POST /users` - Create a user (validates against CreateUserDTO)
- `GET /users/:id` - Get user by ID
