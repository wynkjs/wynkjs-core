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
      const databaseUrl = process.env.DATABASE_URL ?? "";
      let ssl: boolean | { rejectUnauthorized: boolean };
      try {
        const parsed = new URL(databaseUrl);
        const sslmode = parsed.searchParams.get("sslmode");
        const allowInsecureSsl = process.env.PGSSL_ALLOW_INSECURE === "true";
        if (sslmode === "disable") {
          ssl = false;
        } else if (
          sslmode === "require" ||
          sslmode === "verify-ca" ||
          sslmode === "verify-full"
        ) {
          ssl = allowInsecureSsl ? { rejectUnauthorized: false } : true;
        } else {
          const hostname = parsed.hostname;
          const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
          ssl = isLocal
            ? false
            : allowInsecureSsl
              ? { rejectUnauthorized: false }
              : true;
        }
      } catch {
        ssl = false;
      }
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl,
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
