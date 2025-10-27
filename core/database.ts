/**
 * WynkJS Database Pattern - EXAMPLE ONLY
 *
 * ⚠️ This file is NOT exported from WynkJS core.
 * It's just an example pattern you can COPY to your project and customize.
 *
 * WHY NOT INCLUDED IN CORE?
 * - Keeps WynkJS lightweight and fast (built on Elysia's performance)
 * - Gives you freedom to use ANY database library (Drizzle, Prisma, TypeORM, Mongoose, etc.)
 * - No vendor lock-in
 * - No unnecessary dependencies
 *
 * RECOMMENDED APPROACH:
 * Use initializeDatabase() and getDatabase() from database.decorators.ts
 * They're lightweight helpers already included in WynkJS core.
 *
 * BUT IF YOU PREFER A CLASS PATTERN, COPY THIS TO YOUR PROJECT:
 */

export const DATABASE_CLASS_EXAMPLE = `
// src/db/database.ts (COPY THIS TO YOUR PROJECT)

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { userTable, otpTable } from '../users/tables';

const schema = { userTable, otpTable };

export class Database {
  private static instance: any;
  private static pool: Pool;

  public static getInstance() {
    if (!this.instance) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL!,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: { rejectUnauthorized: false },
      });

      this.instance = drizzle(this.pool, {
        schema,
        logger: true,
      });

      console.log("✅ Database connected");
    }
    return this.instance;
  }

  public static async close() {
    if (this.pool) {
      await this.pool.end();
      this.instance = null;
      console.log("Database connection closed");
    }
  }
}

// Usage in your index.ts:
// import { Database } from './db/database';
// const db = Database.getInstance();

// Usage in your services:
// import { Database } from '../db/database';
// const db = Database.getInstance();
// const users = await db.select().from(userTable);
`;

/**
 * Example for other database libraries
 */
export const PRISMA_EXAMPLE = `
// With Prisma (COPY TO YOUR PROJECT)

import { PrismaClient } from '@prisma/client';

export class Database {
  private static instance: PrismaClient;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new PrismaClient();
      console.log("✅ Prisma connected");
    }
    return this.instance;
  }

  public static async close() {
    if (this.instance) {
      await this.instance.$disconnect();
      console.log("Prisma disconnected");
    }
  }
}
`;

export const TYPEORM_EXAMPLE = `
// With TypeORM (COPY TO YOUR PROJECT)

import { DataSource } from 'typeorm';
import { User, Post } from './entities';

export class Database {
  private static instance: DataSource;

  public static async getInstance() {
    if (!this.instance) {
      this.instance = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, Post],
        synchronize: false,
      });
      await this.instance.initialize();
      console.log("✅ TypeORM connected");
    }
    return this.instance;
  }

  public static async close() {
    if (this.instance?.isInitialized) {
      await this.instance.destroy();
      console.log("TypeORM disconnected");
    }
  }
}
`;

export const MONGOOSE_EXAMPLE = `
// With Mongoose (COPY TO YOUR PROJECT)

import mongoose from 'mongoose';

export class Database {
  public static async connect() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URL!, {
        maxPoolSize: 10,
      });
      console.log("✅ MongoDB connected");
    }
  }

  public static async close() {
    await mongoose.connection.close();
    console.log("MongoDB disconnected");
  }

  public static getConnection() {
    return mongoose.connection;
  }
}
`;

/**
 * README: How to use this file
 *
 * 1. Copy one of the examples above to your project (e.g., src/db/database.ts)
 * 2. Customize it to your needs (connection string, pool config, etc.)
 * 3. Import and use it in your services
 *
 * That's it! WynkJS doesn't force you to use any specific pattern.
 * We give you the freedom to choose what works best for your project.
 */
