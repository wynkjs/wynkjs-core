import { Injectable } from "wynkjs";
import { DatabaseService } from "../../database";
import { userTable } from "../../database/schema";
import { eq } from "drizzle-orm";

export interface User {
  id: string; // UUID
  username?: string;
  email: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  private readonly db; // ✅ Store db instance once

  constructor(private readonly databaseService: DatabaseService) {
    this.db = databaseService.db; // ✅ Get it once in constructor
  }

  /**
   * Get all users from database
   */
  async findAll(): Promise<User[]> {
    return await this.db.select().from(userTable);
  }

  /**
   * Find user by ID (UUID)
   */
  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id));
    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));
    return user;
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
  }): Promise<User> {
    const [user] = await this.db
      .insert(userTable)
      .values({
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
      })
      .returning();

    return user;
  }

  /**
   * Update a user
   */
  async update(
    id: string,
    data: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      mobile: string;
    }>
  ): Promise<User | undefined> {
    const [user] = await this.db
      .update(userTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id))
      .returning();

    return user;
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(userTable)
      .where(eq(userTable.id, id))
      .returning();

    return result.length > 0;
  }
}
