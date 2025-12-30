import { Injectable, Singleton } from "wynkjs";
import { DatabaseService } from "../../database";
import { userTable, userRoleTable, roleTable } from "../../database/schema";
import { eq } from "drizzle-orm";
import type { AuthUser, UserRole } from "./auth.types";

/**
 * Authentication Service
 * Handles user registration, login, and authentication operations
 */
@Injectable()
@Singleton()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  /**
   * Hash password using simple approach
   * In production, use bcrypt or similar
   */
  private async hashPassword(password: string): Promise<string> {
    // For demo purposes - in production use bcrypt
    return Buffer.from(password).toString("base64");
  }

  /**
   * Compare plain password with hashed password
   */
  private async comparePassword(
    plain: string,
    hashed: string
  ): Promise<boolean> {
    const hashedPlain = Buffer.from(plain).toString("base64");
    return hashedPlain === hashed;
  }

  /**
   * Register a new user
   */
  async registerUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    username?: string
  ) {
    try {
      const db = this.databaseService.getDb();

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email));

      if (existingUser.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user with guaranteed unique username and mobile
      const emailPrefix = email.split("@")[0];
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 7); // 5 chars
      
      const [newUser] = await db
        .insert(userTable)
        .values({
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          username: username || `${emailPrefix}_${timestamp}`,
          mobile: `${timestamp}${randomStr}`, // Fits in varchar(20)
        })
        .returning();

      // Get default user role
      const [userRole] = await db
        .select()
        .from(roleTable)
        .where(eq(roleTable.name, "user"));

      // Assign user role
      if (userRole) {
        await db.insert(userRoleTable).values({
          userId: newUser.id,
          roleId: userRole.id,
        });
      }

      return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      };
    } catch (error) {
      // Log the full error for debugging
      console.error('Registration error:', error);
      const errorMessage = (error as any).message || String(error);
      const errorDetail = (error as any).detail || '';
      const errorHint = (error as any).hint || '';
      throw new Error(`Registration failed: ${errorMessage}${errorDetail ? ' | Detail: ' + errorDetail : ''}${errorHint ? ' | Hint: ' + errorHint : ''}`);
    }
  }

  /**
   * Authenticate user and return JWT payload
   */
  async validateUser(
    email: string,
    password: string
  ): Promise<AuthUser | null> {
    try {
      const db = this.databaseService.getDb();

      // Find user by email
      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email));

      if (users.length === 0) {
        return null;
      }

      const user = users[0];

      // Check password
      const isValidPassword = await this.comparePassword(
        password,
        user.password || ""
      );

      if (!isValidPassword) {
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error("User account is disabled");
      }

      // Get user roles
      const userRoles = await db
        .select({ name: roleTable.name })
        .from(userRoleTable)
        .innerJoin(
          roleTable,
          eq(userRoleTable.roleId, roleTable.id)
        )
        .where(eq(userRoleTable.userId, user.id));

      const roles = userRoles.map((r: any) => r.name as UserRole);

      // Update last login
      await db
        .update(userTable)
        .set({ lastLoginAt: new Date() })
        .where(eq(userTable.id, user.id));

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles.length > 0 ? roles : ["guest"],
      };
    } catch (error) {
      console.error("Validation error:", error);
      return null;
    }
  }

  /**
   * Get user by ID with their roles
   */
  async getUserWithRoles(userId: string): Promise<AuthUser | null> {
    try {
      const db = this.databaseService.getDb();

      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, userId));

      if (users.length === 0) {
        return null;
      }

      const user = users[0];

      // Get user roles
      const userRoles = await db
        .select({ name: roleTable.name })
        .from(userRoleTable)
        .innerJoin(
          roleTable,
          eq(userRoleTable.roleId, roleTable.id)
        )
        .where(eq(userRoleTable.userId, userId));

      const roles = userRoles.map((r: any) => r.name as UserRole);

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles.length > 0 ? roles : ["guest"],
      };
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }

  /**
   * Verify JWT token (in production, use jwt library)
   */
  verifyToken(token: string, secret: string): any {
    try {
      // In production, use 'jsonwebtoken' library
      // For demo, using simple base64 encoding
      const decoded = Buffer.from(token.split(".")[1] || "", "base64").toString(
        "utf-8"
      );
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create JWT token (in production, use jwt library)
   */
  createToken(payload: any, secret: string, expiresIn: number = 3600): string {
    // In production, use 'jsonwebtoken' library
    // For demo, using simple base64 encoding
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      })
    ).toString("base64");
    const signature = Buffer.from(secret).toString("base64");

    return `${header}.${body}.${signature}`;
  }
}
