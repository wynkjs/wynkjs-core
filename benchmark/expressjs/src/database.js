import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "./schema.js";

let db;
let pool;

/**
 * Initialize a PostgreSQL connection pool, create a Drizzle DB instance using the project schema, and verify the connection.
 *
 * Creates a new pg Pool from process.env.DATABASE_URL, initializes Drizzle with the provided schema (logger disabled), and executes a simple query to confirm connectivity.
 *
 * @returns {import('drizzle-orm').Database} The initialized Drizzle database instance.
 * @throws {Error} If creating the pool, initializing the database, or verifying the connection fails.
 */
export async function initDatabase() {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
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
