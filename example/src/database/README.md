# Database Module - WynkJS Provider Example

This example demonstrates how to use the WynkJS Provider system with PostgreSQL and Drizzle ORM, including lifecycle hooks and dependency injection.

## 📦 Setup

### 1. Install Dependencies

```bash
cd example
bun install
```

- `bun add drizzle-orm` - TypeScript ORM for SQL databases
- `bun add pg` - PostgreSQL client for Node.js
- `bun add -D @types/pg` - TypeScript types for pg

### 2. Configure Database

Create or update `.env` file in the example directory:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=no-verify
NODE_ENV=development
```

### 3. Database Schema

The example uses the following tables (already defined in `schema.ts`):

#### Users Table

```typescript
export const userTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
});
```

#### Products Table

```typescript
export const productTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }),
  price: varchar("price", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Create these tables in your PostgreSQL database before running the app.**

## 🏗️ Architecture

### Provider System Flow

```
App Start
    ↓
DatabaseService.onModuleInit() ← Creates connection
    ↓
Connection Pool Created
    ↓
Drizzle ORM Initialized
    ↓
Test Connection (SELECT 1)
    ↓
Controllers/Services Created ← Can now use db
    ↓
Routes Registered
    ↓
App Running ✅
```

### Files Structure

```
example/src/
├── database/
│   ├── database.service.ts    # ✅ Provider with lifecycle hooks
│   ├── schema.ts               # ✅ Drizzle ORM table schemas
│   ├── index.ts                # ✅ Exports
│   ├── migrate.ts              # ✅ Database migrations
│   └── README.md               # ✅ This file
├── modules/
│   ├── user/
│   │   ├── user.controller.ts  # ✅ Routes and HTTP handling
│   │   ├── user.service.ts     # ✅ Database queries
│   │   └── user.dto.ts         # ✅ Validation schemas
│   └── product/
│       ├── product.controller.ts
│       └── product.service.ts
└── index.ts                    # ✅ App bootstrap with providers
```

## 💉 Dependency Injection Pattern

### 1. Register Provider in App

```typescript
// src/index.ts
import { WynkFactory } from "wynkjs";
import { DatabaseService } from "./database";
import { UserController } from "./modules/user/user.controller";

const app = WynkFactory.create({
  providers: [
    DatabaseService, // ✅ Registered as provider - initialized first
  ],
  controllers: [UserController, ProductController],
  cors: true,
  logger: true,
});

await app.listen(3000);
```

### 2. Database Service (Provider with Lifecycle Hooks)

```typescript
// src/database/database.service.ts
import { Injectable, Singleton } from "wynkjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

@Injectable()
@Singleton()
export class DatabaseService {
  public db: any; // ✅ Drizzle instance - access via databaseService.db
  private pool!: Pool; // ✅ Connection pool

  /**
   * ✅ Called automatically when app starts
   * This runs BEFORE controllers are instantiated
   */
  async onModuleInit() {
    console.log("🔌 Initializing database connection...");

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, {
      schema,
      logger: process.env.NODE_ENV === "development",
    });

    // Test connection
    await this.pool.query("SELECT 1");
    console.log("✅ Database connected successfully");
  }

  /**
   * ✅ Called automatically when app shuts down
   * Clean up connections
   */
  async onModuleDestroy() {
    console.log("🔌 Closing database connection...");
    if (this.pool) {
      await this.pool.end();
      console.log("✅ Database connection closed");
    }
  }

  // Helper methods
  getDb() {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  getPool() {
    return this.pool;
  }

  async query(sql: string, params?: any[]) {
    return await this.pool.query(sql, params);
  }
}
```

### 3. Using in Services

```typescript
// src/modules/user/user.service.ts
import { Injectable } from "wynkjs";
import { DatabaseService } from "../../database";
import { userTable } from "../../database/schema";
import { eq } from "drizzle-orm";

@Injectable()
export class UserService {
  private readonly db; // ✅ Store db instance

  constructor(private readonly databaseService: DatabaseService) {
    // ✅ Get db once in constructor
    this.db = databaseService.db;
  }

  async findAll() {
    return await this.db.select().from(userTable);
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id));
    return user;
  }

  async create(data: { email: string; username?: string }) {
    const [user] = await this.db.insert(userTable).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<{ username: string; email: string }>) {
    const [user] = await this.db
      .update(userTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userTable.id, id))
      .returning();
    return user;
  }

  async delete(id: string) {
    const result = await this.db
      .delete(userTable)
      .where(eq(userTable.id, id))
      .returning();
    return result.length > 0;
  }
}
```

### 4. Using in Controllers

```typescript
// src/modules/user/user.controller.ts
import { Injectable, Controller, Get, Post, Body } from "wynkjs";
import { UserService } from "./user.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/")
  async list() {
    const users = await this.userService.findAll();
    return { users };
  }

  @Post("/")
  async create(@Body() body: { email: string; username?: string }) {
    const user = await this.userService.create(body);
    return { success: true, user };
  }
}
```

## 🚀 Running the Example

### Start the Server

```bash
bun run dev
```

**Expected Output:**

```bash
🚀 Starting WynkJS Application...

🔧 Initializing 1 providers...
  ⚙️  Initializing provider: DatabaseService
🔌 Initializing database connection...
✅ Database connected successfully
   Connection: pg-host.aivencloud.com:13952/db_api?sslmode=no-verify&schema=public
  ✅ DatabaseService initialized successfully
✅ All providers initialized successfully

� Routes on ControllerClass: 0
🔍 Routes on prototype: 7
🔍 Routes on instance: 0
�📦 Registering controller UserController with 7 routes
📦 Registering controller ProductController with 6 routes
🚀 Application is running on http://localhost:3000
🎉 WynkJS Application is running on http://localhost:3000
```

## 📝 API Endpoints

### Users API

```bash
# Get all users
curl http://localhost:3000/users

# Get user by ID (UUID)
curl http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "username": "alice",
    "firstName": "Alice",
    "lastName": "Johnson",
    "mobile": "+1234567890"
  }'

# Update user
curl -X PATCH http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newalice@example.com",
    "firstName": "Alice Updated"
  }'

# Delete user
curl -X DELETE http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000
```

### Products API

```bash
# Get all products
curl http://localhost:3000/products

# Get product by ID
curl http://localhost:3000/products/1

# Create a product
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": "$1299.99"
  }'

# Update product
curl -X PUT http://localhost:3000/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "RGB gaming laptop",
    "price": "$1499.99"
  }'

# Delete product
curl -X DELETE http://localhost:3000/products/1
```

## 🎯 Key Features

### 1. ✅ Automatic Initialization

Database connects automatically when app starts:

- **Provider Init Order:** Providers → Controllers → Routes
- **onModuleInit():** Called before any routes are registered
- **Error Handling:** App won't start if database connection fails
- **Type Safety:** Full TypeScript support throughout

### 2. ✅ Lifecycle Management

Proper connection management:

```typescript
onModuleInit()      → Connect to database
  ↓
App Running         → Handle requests
  ↓
onModuleDestroy()   → Close connections gracefully
```

### 3. ✅ Connection Pooling

Optimized for production:

```typescript
new Pool({
  max: 20, // Max connections
  idleTimeoutMillis: 30000, // Close idle after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s
});
```

### 4. ✅ Query Logging

Enabled in development:

```typescript
drizzle(this.pool, {
  schema,
  logger: process.env.NODE_ENV === "development", // ✅ Log queries in dev
});
```

Console output:

```bash
Query: select "id", "username", "email" from "users"
```

### 5. ✅ Type-Safe Queries

Full TypeScript IntelliSense:

```typescript
// ✅ Fully typed
const users = await this.db.select().from(userTable);
// users is User[]

// ✅ Auto-completion for columns
const user = await this.db
  .select()
  .from(userTable)
  .where(eq(userTable.email, "test@example.com"));
```

## ⚠️ Error Handling

### Connection Failure

If database connection fails, app startup is prevented:

```bash
🔧 Initializing 1 providers...
  ⚙️  Initializing provider: DatabaseService
  🔌 Initializing database connection...
  ❌ Database connection failed:
     Error: connect ECONNREFUSED 127.0.0.1:5432
     💡 Tip: Check your DATABASE_URL
Error: Database initialization failed: connect ECONNREFUSED
```

### SSL Errors

Helpful SSL error messages:

```bash
❌ Database connection failed:
   Error: SSL connection required
   💡 Tip: Add ?sslmode=no-verify to your DATABASE_URL or configure SSL properly
```

**Fix:**

```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=no-verify
```

### Runtime Database Errors

Caught by exception filters:

```typescript
// src/filter/custom.filter.ts
if (error.code === "23505") {
  // Unique constraint violation
  return {
    statusCode: 409,
    message: "Duplicate entry",
    error: "Conflict",
  };
}
```

## 🔧 Advanced Usage

### Direct Database Access

Access db directly in controllers (not recommended):

```typescript
@Injectable()
@Controller("/users")
export class UserController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get("/direct")
  async directQuery() {
    // ⚠️ Not recommended - use services instead
    const db = this.databaseService.db;
    return await db.select().from(userTable);
  }
}
```

**Recommended:** Use services for database operations

### Raw SQL Queries

Execute raw SQL when needed:

```typescript
const result = await this.databaseService.query(
  "SELECT * FROM users WHERE email = $1",
  ["user@example.com"]
);
```

### Transactions

Drizzle ORM transactions:

```typescript
await this.db.transaction(async (tx) => {
  const [user] = await tx.insert(userTable).values(userData).returning();
  await tx.insert(profileTable).values({ userId: user.id });
});
```

## 🧪 Testing

### Test Database Connection

```typescript
// Test in any controller
@Get("/db-test")
async testDb() {
  try {
    const result = await this.databaseService.query('SELECT NOW()');
    return {
      connected: true,
      serverTime: result.rows[0].now
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}
```

## 🔗 Related Documentation

- [WynkJS Architecture](../../../ARCHITECTURE.md)
- [Provider System Documentation](../../../docs-wynkjs/PROVIDERS.md)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Main README](../../../README.md)

## 💡 Best Practices

### ✅ DO:

- Store `db` instance in constructor
- Use services for all database operations
- Use transactions for multiple operations
- Handle database errors gracefully
- Use connection pooling
- Enable query logging in development
- Use TypeScript types from Drizzle

### ❌ DON'T:

- Access `databaseService.db` in every method
- Skip error handling
- Use raw SQL unnecessarily
- Forget to close connections (handled automatically)
- Hard-code connection strings

## 🎉 Summary

The WynkJS Provider system with Drizzle ORM provides:

- ✅ **Automatic initialization** - Database ready before routes
- ✅ **Lifecycle hooks** - onModuleInit(), onModuleDestroy()
- ✅ **Dependency injection** - Type-safe DI throughout
- ✅ **Connection pooling** - Production-ready performance
- ✅ **Query logging** - Debug queries in development
- ✅ **Type safety** - Full TypeScript support
- ✅ **Error handling** - Graceful failure with helpful messages

**Happy coding with WynkJS! 🚀**
