import { Controller, Get, Post, Body, Param, Injectable, Query } from "wynkjs";
import { DatabaseService } from "./database.service";
import { CreateUserDTO, UserIdDTO } from "./user.dto";
import type { CreateUserType, UserIdType } from "./user.dto";
import { userTable } from "./schema";
import { eq, sql, count } from "drizzle-orm";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private dbService: DatabaseService) {}

  @Get("/")
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("fields") fields?: string
  ) {
    const db = this.dbService.getDb();

    // Parse pagination params with defaults
    const pageNum = Math.max(1, parseInt(page || "1"));
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit || "100"))); // Default 100, max 1000
    const offset = (pageNum - 1) * limitNum;

    // If fields are requested, select only those fields
    let selectFields: any = {};
    if (fields) {
      const requestedFields = fields.split(",").map((f) => f.trim());
      requestedFields.forEach((field) => {
        if (userTable[field as keyof typeof userTable]) {
          selectFields[field] = userTable[field as keyof typeof userTable];
        }
      });
    } else {
      // Default: select all fields except password
      selectFields = {
        id: userTable.id,
        username: userTable.username,
        email: userTable.email,
        mobile: userTable.mobile,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        isActive: userTable.isActive,
        emailVerified: userTable.emailVerified,
        firstTimeLogin: userTable.firstTimeLogin,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      };
    }

    // Get total count efficiently (without fetching rows)
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(userTable);

    // Fetch paginated data
    const users = await db
      .select(selectFields)
      .from(userTable)
      .limit(limitNum)
      .offset(offset);

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum * limitNum < totalCount,
        hasPrev: pageNum > 1,
      },
    };
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
