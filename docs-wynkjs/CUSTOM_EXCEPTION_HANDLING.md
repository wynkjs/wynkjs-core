# Custom Exception Handling Guide

This guide shows how to implement custom exception handling in WynkJS for specific scenarios like email sending, payment processing, external API calls, etc.

## Problem

When your application interacts with external services (email providers, payment gateways, APIs), errors can occur. You need a clean way to:

1. Catch and handle these errors
2. Provide meaningful error messages to clients
3. Log errors for monitoring
4. Add custom business logic (retry, alerts, etc.)

## Solution: Custom Exception Classes + Filters

### Step 1: Create Custom Exception Classes

```typescript
// email.exceptions.ts
import { HttpException } from "wynkjs";

export class EmailException extends HttpException {
  constructor(message: string, public readonly emailAddress?: string) {
    super(message, 500, "Email Service Error");
  }
}

export class EmailSendFailedException extends EmailException {
  constructor(emailAddress: string, reason?: string) {
    super(reason || "Failed to send email", emailAddress);
  }
}

export class InvalidEmailException extends HttpException {
  constructor(emailAddress: string) {
    super(`Invalid email address: ${emailAddress}`, 400, "Invalid Email");
  }
}

export class EmailQuotaExceededException extends HttpException {
  constructor() {
    super(
      "Email quota exceeded. Please try again later.",
      429,
      "Quota Exceeded"
    );
  }
}
```

### Step 2: Create Custom Exception Filter

```typescript
// email.filter.ts
import { WynkExceptionFilter, ExecutionContext } from "wynkjs";
import { EmailException } from "./email.exceptions";

export class EmailExceptionFilter implements WynkExceptionFilter {
  catch(exception: EmailException, context: ExecutionContext) {
    const request = context.getRequest();

    // Log for monitoring
    console.error("📧 Email Error:", {
      message: exception.message,
      emailAddress: exception.emailAddress,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    // Custom logic: Send to error tracking, retry, alert admin, etc.

    return {
      statusCode: exception.statusCode || 500,
      error: "Email Service Error",
      message: exception.message,
      emailAddress: exception.emailAddress,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(exception.statusCode === 429 && {
        retryAfter: 3600,
        hint: "Please try again later",
      }),
    };
  }
}
```

### Step 3: Create Service That Throws Exceptions

```typescript
// email.service.ts
import { Injectable } from "wynkjs";
import {
  EmailSendFailedException,
  InvalidEmailException,
  EmailQuotaExceededException,
} from "./email.exceptions";

@Injectable()
export class EmailService {
  private sentCount = 0;
  private readonly DAILY_LIMIT = 100;

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    // Validate email
    if (!this.isValidEmail(email)) {
      throw new InvalidEmailException(email);
    }

    // Check quota
    if (this.sentCount >= this.DAILY_LIMIT) {
      throw new EmailQuotaExceededException();
    }

    try {
      // Call external email service (SendGrid, AWS SES, etc.)
      await this.sendEmail(email, "Welcome!", `Hello ${userName}!`);
      this.sentCount++;
    } catch (error) {
      // Wrap external errors in custom exception
      throw new EmailSendFailedException(
        email,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async sendEmail(to: string, subject: string, body: string) {
    // External service call
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### Step 4: Use in Controller (No try-catch needed!)

```typescript
// user.controller.ts
import { Controller, Post, Body, Param, Injectable } from "wynkjs";
import { EmailService } from "./email.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private emailService: EmailService) {}

  @Post({ path: "/:id/send-reset-email" })
  async sendPasswordReset(
    @Param("id") id: string,
    @Body() body: { email: string }
  ) {
    // Just call the service - EmailExceptionFilter handles errors automatically!
    await this.emailService.sendPasswordResetEmail(
      body.email,
      "reset-token-123"
    );

    return {
      message: "Password reset email sent",
      email: body.email,
    };
  }
}
```

### Step 5: Register Filter in Application

```typescript
// index.ts
import { WynkFactory, GlobalExceptionFilter } from "wynkjs";
import { EmailExceptionFilter } from "./email.filter";
import { UserController } from "./user.controller";

const app = WynkFactory.create({
  controllers: [UserController],
});

// Register filters: specific first, generic last
app.useGlobalFilters(
  new EmailExceptionFilter(), // Handles EmailException
  new GlobalExceptionFilter() // Handles everything else
);

await app.listen(3000);
```

## Testing

### Test Invalid Email

```bash
curl -X POST "http://localhost:3000/users/123/send-reset-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
```

Response:

```json
{
  "statusCode": 400,
  "error": "Email Service Error",
  "message": "Invalid email address: invalid-email",
  "emailAddress": "invalid-email",
  "timestamp": "2025-10-21T21:30:00.000Z",
  "path": "http://localhost:3000/users/123/send-reset-email"
}
```

### Test Email Send Failure

```bash
curl -X POST "http://localhost:3000/users/123/send-reset-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

Response (if external service fails):

```json
{
  "statusCode": 500,
  "error": "Email Service Error",
  "message": "Failed to send email",
  "emailAddress": "user@example.com",
  "timestamp": "2025-10-21T21:30:00.000Z",
  "path": "http://localhost:3000/users/123/send-reset-email"
}
```

## More Examples

### Payment Processing

```typescript
// payment.exceptions.ts
export class PaymentException extends HttpException {
  constructor(message: string, public readonly transactionId?: string) {
    super(message, 402, "Payment Failed");
  }
}

export class InsufficientFundsException extends PaymentException {
  constructor(transactionId: string) {
    super("Insufficient funds", transactionId);
  }
}

// payment.filter.ts
export class PaymentExceptionFilter implements WynkExceptionFilter {
  catch(exception: PaymentException, context: ExecutionContext) {
    // Log to payment monitoring system
    // Send alert for failed payments
    // Trigger refund workflow if needed

    return {
      statusCode: exception.statusCode,
      error: "Payment Failed",
      message: exception.message,
      transactionId: exception.transactionId,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### External API Integration

```typescript
// api.exceptions.ts
export class ExternalApiException extends HttpException {
  constructor(
    message: string,
    public readonly apiName: string,
    public readonly statusCode: number = 502
  ) {
    super(message, statusCode, `${apiName} API Error`);
  }
}

// api.filter.ts
export class ExternalApiExceptionFilter implements WynkExceptionFilter {
  catch(exception: ExternalApiException, context: ExecutionContext) {
    // Implement retry logic
    // Send to error tracking
    // Alert on-call engineer

    return {
      statusCode: exception.statusCode,
      error: "External Service Error",
      message: exception.message,
      service: exception.apiName,
      timestamp: new Date().toISOString(),
    };
  }
}
```

## Key Benefits

1. **Clean Code**: No try-catch blocks cluttering your controllers
2. **Centralized Handling**: All email errors handled in one place
3. **Consistent Responses**: Same error format across your API
4. **Easy Monitoring**: Log all errors in one place
5. **Business Logic**: Add retry, alerts, or custom logic in the filter
6. **Type Safety**: Full TypeScript support

## Best Practices

1. **Create specific exception classes** for different error scenarios
2. **Order matters**: Register specific filters before generic ones
3. **Don't catch and re-throw** in controllers unless you need to transform the error
4. **Log in filters** for monitoring and debugging
5. **Add helpful hints** in error responses for clients
6. **Use HTTP status codes** appropriately (400, 429, 500, etc.)
