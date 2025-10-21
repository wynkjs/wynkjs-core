import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  DTO,
  NotFoundException,
  Injectable,
} from "wynkjs";
import {
  CreateUserDTO,
  UserIdDto,
  UserQueryDto,
  UserUpdateDTO,
  MultiParamDto,
} from "./user.dto";

import type {
  CreateUserType,
  ParamIdType,
  UserQueryType,
  UserUpdateType,
  MultiParamType,
} from "./user.dto";
import { EmailService } from "./email.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private emailService: EmailService) {}
  @Get("/")
  async list() {
    return { users: ["Alice", "Bob", "Charlie"] };
  }

  @Post({
    path: "/:id1/:id2",
    body: CreateUserDTO,
    params: MultiParamDto, // ✅ Schema matches route params :id1 and :id2
    query: UserQueryDto,
  })
  async create(
    @Body() body: CreateUserType,
    @Param("id1") id1: string, // ✅ Extract id1 as string
    @Param("id2") id2: string, // ✅ Extract id2 as string
    @Query() query: UserQueryType
  ) {
    // Send welcome email - EmailExceptionFilter will handle any errors
    if (body.email && body.name) {
      await this.emailService.sendWelcomeEmail(body.email, body.name);
    }

    return { message: "User created", data: body, params: { id1, id2 }, query };
  }

  @Get({ path: "/:id", params: UserIdDto, query: UserQueryDto })
  async findOne(
    @Param("id") id: string, // ✅ Extract id as string
    @Query() query: UserQueryType
  ) {
    return {
      user: { id, name: "Alice" },
      query: query,
    };
  }

  @Get("/all")
  async getAll() {
    return {
      user: { name: "All" },
    };
  }

  @Patch({
    path: "/:id",
    body: UserUpdateDTO,
    params: UserIdDto,
    query: UserQueryDto,
  })
  // @Use(jwtGuard, rolesGuard([UserRole.USER]))
  async update(
    @Param("id") id: string, // ✅ Extract id as string
    @Body() body: UserUpdateType,
    @Query() query: UserQueryType
  ) {
    // No try-catch needed - let WynkJS exception filters handle errors
    if (id == "params") {
      throw new NotFoundException("User not found");
    }

    return {
      message: "User updated",
      id,
      data: body,
      query,
    };
  }

  /**
   * Test endpoint for email exception handling
   * POST /users/send-reset-email
   */
  @Post({ path: "/send-reset-email" })
  async sendPasswordReset(@Body() body: { email: string; userId: string }) {
    // This will throw EmailException if anything goes wrong
    // EmailExceptionFilter will catch and handle it
    await this.emailService.sendPasswordResetEmail(
      body.email,
      "reset-token-123"
    );

    return {
      message: "Password reset email sent",
      email: body.email,
      userId: body.userId,
    };
  }
}
