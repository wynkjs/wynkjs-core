import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "./schema.js";

let db;
let pool;

export async function initDatabase() {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 100,  // Increased for high concurrency benchmarking
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        db = drizzle(pool, { schema, logger: false });

        await pool.query("SELECT 1");
        console.log("✅ Database connected");

        return db;
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        throw error;
    }
}

export function getDb() {
    return db;
}

export async function closeDatabase() {
    if (pool) {
        await pool.end();
    }
}
