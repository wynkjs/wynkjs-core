/**
 * Raw Elysia.js Benchmark (No Framework Overhead)
 * This is to measure the performance of pure Elysia.js without WynkJS decorators/DI
 */

import { Elysia } from "elysia";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import pg from "pg";
import "dotenv/config";

// Database schema - matches other benchmarks
const userTable = pgTable("user_benchmark", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  firstTimeLogin: boolean("first_time_login").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

// Test database connection
try {
  const client = await pool.connect();
  await client.query("SELECT 1");
  client.release();
  console.log("✅ Database connected");
} catch (error) {
  console.error("❌ Database connection failed:", error);
  process.exit(1);
}

const app = new Elysia()
  .get("/health", () => ({
    status: "ok",
    message: "Raw Elysia.js server is running",
    timestamp: new Date().toISOString(),
  }))
  .get("/users", async ({ set }) => {
    try {
      const allUsers = await db.select().from(userTable).limit(100);
      return allUsers;
    } catch (error: any) {
      console.error("Error fetching users:", error);
      set.status = 500;
      return { error: "Failed to fetch users", message: error.message };
    }
  })
  .get("/users/:id", async ({ params, set }) => {
    try {
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, params.id));

      if (user.length === 0) {
        set.status = 404;
        return { error: "User not found" };
      }

      return user[0];
    } catch (error: any) {
      console.error("Error fetching user:", error);
      set.status = 500;
      return { error: "Failed to fetch user", message: error.message };
    }
  })
  .post("/users", async ({ body, set }: any) => {
    try {
      const newUser = await db
        .insert(userTable)
        .values({
          email: body.email,
          username: body.username || body.name,
          firstName: body.firstName,
          lastName: body.lastName,
        })
        .returning();

      set.status = 201;
      return newUser[0];
    } catch (error: any) {
      console.error("Error creating user:", error);
      set.status = 500;
      return { error: "Failed to create user", message: error.message };
    }
  })
  .listen(3003);

console.log("🚀 Raw Elysia.js server running on http://localhost:3003");
console.log("📊 Endpoints:");
console.log("   GET  http://localhost:3003/health - Health check");
console.log("   GET  http://localhost:3003/users - List all users");
console.log("   GET  http://localhost:3003/users/:id - Get user by ID");
console.log("   POST http://localhost:3003/users - Create user");
