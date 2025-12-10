import { Injectable, Singleton } from "wynkjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

@Injectable()
@Singleton()
export class DatabaseService {
  public db: any;
  private pool!: Pool;

  async onModuleInit() {
    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 100, // Increased for high concurrency benchmarking
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased to 10 seconds for cloud databases
        ssl: {
          rejectUnauthorized: false, // Match sslmode=no-verify from DATABASE_URL
        },
      });

      this.db = drizzle(this.pool, {
        schema,
        logger: false, // Disable logging for benchmark
      });

      await this.pool.query("SELECT 1");
      console.log("✅ Database connected");
    } catch (error) {
      console.error("❌ Database connection failed:", (error as any).message);
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
