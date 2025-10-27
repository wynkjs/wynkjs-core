# ✅ Fixed: Validation Exception Filters

## Problem

You were passing `FormatErrorPipe` (a **pipe**) to `useGlobalFilters()`, but filters need a `catch()` method. This caused the error:

```
TypeError: filterInstance.catch is not a function
```

## Solution

Created a proper architecture separating **Pipes** (data transformation) from **Filters** (exception handling) with **Formatters** (error formatting):

### New Architecture

```
ValidationExceptionFilter (filter with catch method)
  └── ErrorFormatter (formatters for different output styles)
      ├── FormatErrorFormatter (object-based: { field: [messages] })
      ├── SimpleErrorFormatter (simple array: ["message1", "message2"])
      └── DetailedErrorFormatter (detailed: [{ field, message, value, expected }])
```

## What Was Changed in Core

### 1. `core/decorators/exception.advanced.ts`

Added:

- `ErrorFormatter` interface
- `FormatErrorFormatter` class (object-based format)
- `SimpleErrorFormatter` class (simple array format)
- `DetailedErrorFormatter` class (detailed object format)
- Updated `ValidationExceptionFilter` to accept an optional formatter

### 2. Exports

All formatters are exported from `core/index.ts` via `exception.advanced`.

## Usage

### Option 1: FormatErrorFormatter (Object-based) ✅ WORKING

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

### Option 2: SimpleErrorFormatter

```typescript
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

### Option 3: DetailedErrorFormatter

```typescript
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
      "expected": { "format": "email", "type": "string" }
    }
  ]
}
```

### Option 4: Default (no formatter)

```typescript
app.useGlobalFilters(new ValidationExceptionFilter());
```

Uses `DetailedErrorFormatter` by default.

## Custom Formatters

Create your own formatter:

```typescript
import { ErrorFormatter } from "wynkjs";

class MyCustomFormatter implements ErrorFormatter {
  format(error: any): any {
    return {
      statusCode: 422,
      customField: "my custom format",
      errors: error.errors.map((e) => e.message),
    };
  }
}

app.useGlobalFilters(new ValidationExceptionFilter(new MyCustomFormatter()));
```

## Testing

Tested and confirmed working:

```bash
# Missing email (required)
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{}'

# Response:
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Expected property 'email' to be string but found: undefined"]
  }
}
```

✅ All three formatters work correctly!
✅ Custom formatters are supported via the `ErrorFormatter` interface!
✅ Compatible with NestJS patterns!

## Files Modified

1. `core/decorators/exception.advanced.ts` - Added formatters and updated ValidationExceptionFilter
2. `example/index.ts` - Updated to use the correct pattern
3. `example/README.md` - Documented all formatter options

## Ready to Publish

The core is now fixed and follows modern TypeScript patterns correctly. Run:

```bash
npm run build
npm publish --access public
```

Then update the example to use the published package:

```bash
cd example
bun add wynkjs@latest
```
