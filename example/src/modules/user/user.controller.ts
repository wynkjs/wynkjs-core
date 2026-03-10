import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  Query,
  NotFoundException,
  ConflictException,
  Injectable,
  HttpCode,
  HttpStatus,
} from "wynkjs";

import {
  type CreateUserType,
  type ParamIdType,
  type UserQueryType,
  type UserUpdateType,
  CreateUserDTO,
  UserQueryDto,
  UserIdDto,
  UserUpdateDTO,
} from "./user.dto";
import { UserService } from "./user.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  async list(@Query() query: UserQueryType) {
    const users = await this.userService.findAll();
    return { users, query };
  }

  @Get({ path: "/:id", params: UserIdDto })
  async findOne(@Param("id") id: string) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return { user };
  }

  @Post({ path: "/", body: CreateUserDTO })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateUserType) {
    const existing = await this.userService.findByEmail(body.email!);
    if (existing) throw new ConflictException("Email already registered");
    const user = await this.userService.create({
      email: body.email!,
      firstName: body.name,
      mobile: body.mobile,
    });
    return { message: "User created", user };
  }

  @Patch({ path: "/:id", body: UserUpdateDTO, params: UserIdDto, query: UserQueryDto })
  async update(
    @Param("id") id: string,
    @Body() body: UserUpdateType,
    @Query() query: UserQueryType
  ) {
    const user = await this.userService.update(id, { email: body.email });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return { message: "User updated", user, query };
  }

  @Put({ path: "/:id", body: CreateUserDTO, params: UserIdDto })
  async replace(@Param("id") id: string, @Body() body: CreateUserType) {
    const user = await this.userService.update(id, {
      email: body.email,
      firstName: body.name,
      mobile: body.mobile,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return { message: "User replaced", user };
  }

  @Delete({ path: "/:id", params: UserIdDto })
  async remove(@Param("id") id: string) {
    const deleted = await this.userService.delete(id);
    if (!deleted) throw new NotFoundException(`User ${id} not found`);
    return { message: "User deleted", id };
  }
}
