import { Controller, Get, Post, Body, Param, Injectable } from "wynkjs";
import { DatabaseService } from "./database.service";
import { CreateUserDTO, UserIdDTO } from "./user.dto";
import type { CreateUserType, UserIdType } from "./user.dto";
import { userTable } from "./schema";
import { eq } from "drizzle-orm";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private dbService: DatabaseService) {}

  @Get("/")
  async findAll() {
    const db = this.dbService.getDb();
    const users = await db.select().from(userTable).limit(100);
    return users;
  }

  @Get({ path: "/:id", params: UserIdDTO })
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

  @Post({ path: "/", body: CreateUserDTO })
  async create(@Body() body: CreateUserType) {
    const db = this.dbService.getDb();

    // Hash password using Bun's built-in bcrypt
    const hashedPassword = await Bun.password.hash(
      body.password || "password123",
      {
        algorithm: "bcrypt",
        cost: 4, // Reduced for benchmarking (was 10)
      }
    );

    const result = await db
      .insert(userTable)
      .values({
        ...body,
        password: hashedPassword,
      })
      .returning();

    return result[0];
  }
}
