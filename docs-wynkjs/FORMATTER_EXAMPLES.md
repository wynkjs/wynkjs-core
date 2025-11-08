# Validation Error Formatter Examples

## Custom Error Messages in DTOs

WynkJS supports custom error messages using the `error` property in your DTOs:

```typescript
import { DTO, CommonDTO } from "wynkjs";

export const UserUpdateDTO = DTO.Strict({
  email: DTO.Optional(
    DTO.String({
      format: "email",
      minLength: 5,
      error: "Please provide a valid email address with at least 5 characters",
    })
  ),
  age: DTO.Optional(
    DTO.Number({
      minimum: 18,
      error: "Age must be at least 18 years",
    })
  ),
});
```

When validation fails, your custom error messages will be displayed instead of the default TypeBox messages.

---

## Test Request

```bash
curl -X PATCH "http://localhost:3000/users/testid" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@demo1.","age":"notanumber"}'
```

## 1. Default Format (No Formatter)

```typescript
const app = WynkFactory.create({
  controllers: [UserController],
  // No validationErrorFormatter specified
});
```

**Response:**

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

---

## 2. FormatErrorFormatter (Object-based)

```typescript
import { FormatErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new FormatErrorFormatter(),
});
```

**Response:**

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

---

## 3. SimpleErrorFormatter (Array Format)

```typescript
import { SimpleErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new SimpleErrorFormatter(),
});
```

**Response:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Expected string to match 'email' format", "Expected number"]
}
```

---

## 4. DetailedErrorFormatter (Full Info)

```typescript
import { DetailedErrorFormatter } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter(),
});
```

**Response:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Expected string to match 'email' format"
    },
    {
      "field": "age",
      "message": "Expected number"
    }
  ]
}
```

---

## Key Differences

| Formatter                  | Format Type        | Use Case                                 |
| -------------------------- | ------------------ | ---------------------------------------- |
| **Default**                | Object with arrays | Best for most APIs, field-based grouping |
| **FormatErrorFormatter**   | Same as default    | Explicitly object-based format           |
| **SimpleErrorFormatter**   | Flat array         | Mobile apps, minimal response size       |
| **DetailedErrorFormatter** | Array of objects   | Development, debugging, detailed info    |

---

## All Formatters Tested ✅

- ✅ Default format: `{ email: [...], age: [...] }`
- ✅ FormatErrorFormatter: Same as default
- ✅ SimpleErrorFormatter: `["error1", "error2"]`
- ✅ DetailedErrorFormatter: `[{ field, message }, ...]`
- ✅ All collect multiple validation errors at once
- ✅ All return proper 400 status codes
- ✅ All integrate seamlessly with TypeBox validation

See [VALIDATION_FORMATTERS.md](./VALIDATION_FORMATTERS.md) for complete documentation.
