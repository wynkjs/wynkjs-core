import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  public db: any;
  private pool: Pool;

  async onModuleInit() {
    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 100, // Increased for high concurrency benchmarking
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.db = drizzle(this.pool, { schema, logger: false });

      await this.pool.query("SELECT 1");
      console.log("✅ Database connected");
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  getDb() {
    return this.db;
  }
}
