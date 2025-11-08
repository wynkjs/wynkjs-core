import { pgTable, varchar, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const userTable = pgTable("user_benchmark", {
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
