## 🎨 Complete Working Example

Here's a complete, production-ready example with all features:

```typescript
// dto/user.dto.ts
import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.Optional(
    DTO.String({
      minLength: 2,
      maxLength: 50,
      error: "Name must be between 2 and 50 characters",
    })
  ),
  email: CommonDTO.Email({
    description: "User email address",
    error: "Please provide a valid email address",
  }),
  mobile: DTO.Optional(
    DTO.String({
      pattern: "^[6-9]{1}[0-9]{9}$",
      error: "Invalid mobile number format",
    })
  ),
  age: DTO.Optional(
    DTO.Number({
      minimum: 18,
      error: "Age must be at least 18 years",
    })
  ),
});

export const UserIdDto = DTO.Object({
  id: DTO.String({ minLength: 2, maxLength: 50 }),
});

export interface CreateUserType {
  name?: string;
  email: string;
  mobile?: string;
  age?: number;
}

// services/email.service.ts
import { Injectable } from "wynkjs";

@Injectable()
export class EmailService {
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    console.log(`📧 Sending welcome email to ${email}`);
    // Your email sending logic (SendGrid, AWS SES, etc.)
  }
}

// controllers/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { CreateUserDTO, UserIdDto } from "../dto/user.dto";
import type { CreateUserType } from "../dto/user.dto";
import { EmailService } from "../services/email.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private emailService: EmailService) {}

  @Get("/")
  async list() {
    return { users: ["Alice", "Bob", "Charlie"] };
  }

  @Post({ path: "/", body: CreateUserDTO })
  async create(@Body() body: CreateUserType) {
    // Send welcome email using injected service
    if (body.email && body.name) {
      await this.emailService.sendWelcomeEmail(body.email, body.name);
    }
    return { message: "User created", data: body };
  }

  @Get({ path: "/:id", params: UserIdDto })
  async findOne(@Param("id") id: string) {
    if (id === "nonexistent") {
      throw new NotFoundException("User not found");
    }
    return { user: { id, name: "Alice" } };
  }

  @Patch({ path: "/:id", params: UserIdDto })
  async update(@Param("id") id: string, @Body() body: any) {
    return { message: "User updated", id, data: body };
  }
}

// index.ts
import {
  WynkFactory,
  DetailedErrorFormatter,
  GlobalExceptionFilter,
  DatabaseExceptionFilter,
} from "wynkjs";
import { UserController } from "./controllers/user.controller";

const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter(), // ✅ Format validation errors
});

// Register global exception filters
app.useGlobalFilters(
  new DatabaseExceptionFilter(), // Handles database errors
  new GlobalExceptionFilter() // Catch-all for other exceptions
);

await app.listen(3000);
console.log("🚀 Server running on http://localhost:3000");
```

**Test the API:**

```bash
# List all users
curl http://localhost:3000/users

# Create a new user (with validation and email)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'

# Get user by ID
curl http://localhost:3000/users/123

# Update user
curl -X PATCH http://localhost:3000/users/123 \
  -H "Content-Type: application/json" \
  -d '{"email":"newemail@example.com"}'

# Test 404 exception
curl http://localhost:3000/users/nonexistent
```

---
