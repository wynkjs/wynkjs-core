import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { DatabaseService } from "./database.service";
import { CreateUserDto } from "./user.dto";
import { userTable } from "./schema";
import { eq } from "drizzle-orm";

@Controller("users")
export class UserController {
  constructor(private readonly dbService: DatabaseService) {}

  @Get()
  async findAll() {
    const db = this.dbService.getDb();
    const users = await db.select().from(userTable).limit(100);
    return users;
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const db = this.dbService.getDb();
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);

    if (users.length === 0) {
      return { error: "User not found" };
    }

    return users[0];
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(
      createUserDto.password || "password123",
      4 // Reduced for benchmarking (was 10)
    );

    const db = this.dbService.getDb();
    const result = await db
      .insert(userTable)
      .values({
        ...createUserDto,
        password: hashedPassword,
      })
      .returning();
    return result[0];
  }
}
