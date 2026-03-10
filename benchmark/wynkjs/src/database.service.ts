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
        } else if (sslmode === "require") {
          // "require" does not verify the certificate, so insecure override is acceptable
          ssl = allowInsecureSsl ? { rejectUnauthorized: false } : true;
        } else if (sslmode === "verify-ca" || sslmode === "verify-full") {
          // These modes exist specifically to verify certificates; never disable verification
          if (allowInsecureSsl) {
            console.warn(
              `[DatabaseService] PGSSL_ALLOW_INSECURE=true is ignored for sslmode=${sslmode} ` +
                `because certificate verification is required by that mode.`,
            );
          }
          ssl = true;
        } else {
          // No sslmode param — use hostname-based detection
          // Normalize bracketed IPv6 addresses (e.g. "[::1]" → "::1")
          const rawHostname = parsed.hostname;
          const hostname =
            rawHostname.startsWith("[") && rawHostname.endsWith("]")
              ? rawHostname.slice(1, -1)
              : rawHostname;
          const isLocal =
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "::1";
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
