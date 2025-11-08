import { Injectable, singleton, Singleton } from "wynkjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database Provider
 * This provider initializes the database connection when the app starts
 * and makes it available throughout the application via dependency injection
 */
@Injectable()
@Singleton()
export class DatabaseService {
  public db: any; // ✅ Use this in other services: this.db = databaseService.db
  private pool!: Pool; // ✅ Definite assignment assertion - initialized in onModuleInit()

  /**
   * Lifecycle hook - called automatically by WynkJS when app starts
   * This ensures database is connected before any routes are registered
   *
   * Pattern:
   * 1. App starts → DatabaseService.onModuleInit() runs → connection created
   * 2. Controllers/Services instantiated → their constructors run
   * 3. In your service constructor: this.db = databaseService.db ✅
   */
  async onModuleInit() {
    try {
      const databaseUrl = process.env.DATABASE_URL;

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
      });

      // Initialize Drizzle ORM with the pool and schema
      this.db = drizzle(this.pool, {
        schema,
        logger: process.env.NODE_ENV === "development", // Enable query logging in development
      });

      // Test the connection
      await this.pool.query("SELECT 1");

      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ Database connection failed:");
      console.error("   Error:", (error as any).message);

      // If SSL error, provide helpful message
      if ((error as any).message?.includes("SSL")) {
        console.error(
          "   💡 Tip: Add ?sslmode=disable to your DATABASE_URL or configure SSL properly"
        );
      }

      // Throw error to stop app startup
      throw new Error(
        `Database initialization failed: ${(error as any).message}`
      );
    }
  }

  /**
   * Lifecycle hook - called when app shuts down
   * Clean up database connections
   */
  async onModuleDestroy() {
    console.log("🔌 Closing database connection...");

    if (this.pool) {
      await this.pool.end();
      console.log("✅ Database connection closed");
    }
  }

  /**
   * Get the Drizzle database instance
   */
  getDb() {
    if (!this.db) {
      throw new Error("Database not initialized. Call onModuleInit() first.");
    }
    return this.db;
  }

  /**
   * Get the PostgreSQL pool instance
   */
  getPool() {
    return this.pool;
  }

  /**
   * Execute a raw SQL query
   */
  async query(sql: string, params?: any[]) {
    return await this.pool.query(sql, params);
  }
}
