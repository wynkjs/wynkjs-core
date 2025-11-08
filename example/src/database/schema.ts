import { eq } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

// Existing user table schema (matches your database)
export const userTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }),
  password: varchar("password", { length: 255 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  isActive: boolean("isActive").default(true),
  emailVerified: boolean("emailVerified").default(false),
  firstTimeLogin: boolean("firstTimeLogin").default(true),
  doctorId: uuid("doctorId"),
  hospitalId: uuid("hospitalId"),
  blockedDoctor: uuid("blockedDoctor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Example product table schema
export const productTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }),
  price: varchar("price", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Export all schemas
export const schema = {
  userTable,
  productTable,
};
