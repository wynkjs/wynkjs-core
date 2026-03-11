import { Controller, Get, Post, Body, Param, Injectable, Query } from "wynkjs";
import { DatabaseService } from "./database.service";
import { CreateUserDTO, UserIdDTO } from "./user.dto";
import type { CreateUserType } from "./user.dto";
import { userTable } from "./schema";
import { eq, count, asc } from "drizzle-orm";

const PUBLIC_USER_FIELDS = new Set([
  "id",
  "username",
  "email",
  "mobile",
  "firstName",
  "lastName",
  "isActive",
  "emailVerified",
  "firstTimeLogin",
  "createdAt",
  "updatedAt",
] as const);

type PublicUserField =
  typeof PUBLIC_USER_FIELDS extends Set<infer T> ? T : never;

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private dbService: DatabaseService) {}

  @Get("/")
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("fields") fields?: string,
  ) {
    const db = this.dbService.getDb();

    const pageNum = Math.max(1, parseInt(page || "1"));
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit || "100")));
    const offset = (pageNum - 1) * limitNum;

    let selectFields: Partial<
      Record<PublicUserField, (typeof userTable)[PublicUserField]>
    > = {};
    if (fields) {
      const requestedFields = fields.split(",").map((f) => f.trim());
      for (const field of requestedFields) {
        if (PUBLIC_USER_FIELDS.has(field as PublicUserField)) {
          const col = field as PublicUserField;
          selectFields[col] = userTable[
            col
          ] as (typeof userTable)[PublicUserField];
        }
      }
      if (Object.keys(selectFields).length === 0) {
        return { error: "No valid public fields requested" };
      }
    } else {
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

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(userTable);

    const users = await db
      .select(selectFields)
      .from(userTable)
      .orderBy(asc(userTable.id))
      .limit(limitNum)
      .offset(offset);

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = offset + users.length < total;

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext,
        hasPrev: pageNum > 1,
      },
    };
  }

  @Get({ path: "/:id", params: UserIdDTO })
  async findOne(@Param("id") id: string) {
    const db = this.dbService.getDb();
    const users = await db
      .select({
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
      })
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

    const hashedPassword = await Bun.password.hash(
      body.password || "password123",
      {
        algorithm: "bcrypt",
        cost: 4,
      },
    );

    const result = await db
      .insert(userTable)
      .values({
        ...body,
        password: hashedPassword,
      })
      .returning({
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
      });

    return result[0];
  }
}
