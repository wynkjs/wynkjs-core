# WynkJS Provider System

## 🎯 Overview

WynkJS providers are singleton services that are registered and initialized when your application starts. They are perfect for:

- 🗄️ Database connections
- 🔧 Configuration services
- 📧 Email services
- 🔒 Authentication services
- 💾 Cache services
- 📡 External API clients

## ✨ Key Benefits

1. **Tight Coupling**: Only registered providers are available
2. **Automatic Initialization**: Providers initialize when server starts
3. **Error Handling**: Startup failures are caught and reported
4. **Dependency Injection**: Use providers anywhere via `@Injectable()`
5. **Lifecycle Hooks**: `onModuleInit()` for custom initialization
6. **Security**: Only explicitly registered services are available

---

## 📦 Creating a Provider

### Basic Provider

```typescript
import { Injectable, singleton } from "wynkjs";

@Injectable()
@singleton()
export class ConfigService {
  private config: any;

  // Optional lifecycle hook - called during app initialization
  async onModuleInit() {
    console.log("⚙️  Loading configuration...");
    this.config = {
      apiKey: process.env.API_KEY,
      dbUrl: process.env.DATABASE_URL,
    };
    console.log("✅ Configuration loaded");
  }

  get(key: string): any {
    return this.config[key];
  }
}
```

### Database Provider Example

```typescript
import { Injectable, singleton } from "wynkjs";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

@Injectable()
@singleton()
export class DatabaseService {
  public db: any;
  private sqlite: Database;

  // Called automatically when app starts
  async onModuleInit() {
    console.log("🔌 Connecting to database...");

    try {
      this.sqlite = new Database("mydb.sqlite", { create: true });
      this.db = drizzle(this.sqlite);

      // Test connection
      await this.db.execute("SELECT 1");

      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error; // This will stop app startup
    }
  }

  // Optional cleanup
  async onModuleDestroy() {
    console.log("🔌 Closing database connection...");
    this.sqlite?.close();
  }

  getDb() {
    return this.db;
  }
}
```

### Email Provider Example

```typescript
import { Injectable, singleton } from "wynkjs";

@Injectable()
@singleton()
export class EmailService {
  private apiKey: string;
  private isInitialized: boolean = false;

  async onModuleInit() {
    console.log("📧 Initializing email service...");

    this.apiKey = process.env.EMAIL_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("EMAIL_API_KEY is required");
    }

    // Test connection
    // await this.testConnection();

    this.isInitialized = true;
    console.log("✅ Email service initialized");
  }

  async sendEmail(to: string, subject: string, body: string) {
    if (!this.isInitialized) {
      throw new Error("Email service not initialized");
    }

    console.log(`📧 Sending email to ${to}: ${subject}`);
    // Your email sending logic here
  }
}
```

---

## 🚀 Registering Providers

### Method 1: In WynkFactory.create()

```typescript
import { WynkFactory } from "wynkjs";
import { DatabaseService } from "./providers/database.service";
import { EmailService } from "./providers/email.service";
import { ConfigService } from "./providers/config.service";
import { UserController } from "./modules/user/user.controller";

const app = WynkFactory.create({
  providers: [
    ConfigService, // Initialized first
    DatabaseService, // Can inject ConfigService
    EmailService, // Can inject ConfigService
  ],
  controllers: [UserController],
});

await app.listen(3000);
```

### Method 2: Using registerProviders()

```typescript
import { WynkFactory } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController],
});

// Register providers separately
app.registerProviders(ConfigService, DatabaseService, EmailService);

await app.listen(3000);
```

---

## 💉 Using Providers in Services/Controllers

Once registered, providers can be injected anywhere:

### In Controllers

```typescript
import { Controller, Get, Post, Body, Injectable } from "wynkjs";
import { DatabaseService } from "../providers/database.service";
import { EmailService } from "../providers/email.service";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(
    private dbService: DatabaseService,
    private emailService: EmailService
  ) {}

  @Get("/")
  async findAll() {
    const db = this.dbService.getDb();
    const users = await db.select().from(userTable);
    return { users };
  }

  @Post("/")
  async create(@Body() body: any) {
    const db = this.dbService.getDb();
    const user = await db.insert(userTable).values(body);

    // Send welcome email
    await this.emailService.sendEmail(
      body.email,
      "Welcome!",
      "Thanks for signing up"
    );

    return { user };
  }
}
```

### In Services

```typescript
import { Injectable } from "wynkjs";
import { DatabaseService } from "../providers/database.service";

@Injectable()
export class UserService {
  constructor(private dbService: DatabaseService) {}

  async findAll() {
    const db = this.dbService.getDb();
    return await db.select().from(userTable);
  }

  async create(data: any) {
    const db = this.dbService.getDb();
    return await db.insert(userTable).values(data);
  }
}
```

---

## 🔄 Lifecycle Hooks

Providers support lifecycle hooks for initialization and cleanup:

### onModuleInit()

Called when the application starts, before routes are registered:

```typescript
@Injectable()
@singleton()
export class CacheService {
  private cache: Map<string, any>;

  async onModuleInit() {
    console.log("💾 Initializing cache...");
    this.cache = new Map();

    // Load initial data
    await this.preloadCache();

    console.log("✅ Cache initialized");
  }

  private async preloadCache() {
    // Load frequently accessed data
    this.cache.set("config", await this.loadConfig());
  }
}
```

### onModuleDestroy()

Called when the application shuts down (future implementation):

```typescript
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleDestroy() {
    console.log("🔌 Closing database connection...");
    await this.db?.close();
  }
}
```

---

## ⚠️ Error Handling

If a provider fails to initialize, the application **will not start**:

```typescript
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleInit() {
    try {
      await this.connect();
    } catch (error) {
      console.error("❌ Database connection failed");
      throw error; // This stops app startup
    }
  }
}
```

**Output:**

```bash
🔧 Initializing 3 providers...
  ⚙️  Initializing provider: ConfigService
  ✅ ConfigService initialized successfully
  ⚙️  Initializing provider: DatabaseService
  ❌ Failed to initialize provider DatabaseService: Connection refused
Error: Provider initialization failed for DatabaseService: Connection refused
```

---

## 🎯 Best Practices

### 1. Use @singleton() for Providers

```typescript
@Injectable()
@singleton() // ✅ Ensures single instance
export class DatabaseService {
  // ...
}
```

### 2. Handle Errors Gracefully

```typescript
async onModuleInit() {
  try {
    await this.connect();
  } catch (error) {
    console.error("Connection failed:", error);
    throw new Error("Database connection failed");
  }
}
```

### 3. Validate Configuration

```typescript
async onModuleInit() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is required");
  }

  await this.connect();
}
```

### 4. Log Initialization Status

```typescript
async onModuleInit() {
  console.log("⚙️  Initializing database...");

  // Your initialization code

  console.log("✅ Database initialized");
}
```

### 5. Organize Providers by Feature

```
src/
├── providers/
│   ├── database.service.ts
│   ├── email.service.ts
│   ├── cache.service.ts
│   └── config.service.ts
├── modules/
│   └── user/
└── index.ts
```

---

## 📝 Complete Example

### src/providers/database.service.ts

```typescript
import { Injectable, singleton } from "wynkjs";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

@Injectable()
@singleton()
export class DatabaseService {
  public db: any;
  private sqlite: Database;

  async onModuleInit() {
    console.log("🔌 Connecting to database...");

    const dbUrl = process.env.DATABASE_URL || "mydb.sqlite";

    try {
      this.sqlite = new Database(dbUrl, { create: true });
      this.db = drizzle(this.sqlite);

      await this.db.execute("SELECT 1");

      console.log("✅ Database connected");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  getDb() {
    return this.db;
  }
}
```

### src/providers/email.service.ts

```typescript
import { Injectable, singleton } from "wynkjs";

@Injectable()
@singleton()
export class EmailService {
  private apiKey: string;

  async onModuleInit() {
    console.log("📧 Initializing email service...");

    this.apiKey = process.env.EMAIL_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("EMAIL_API_KEY environment variable is required");
    }

    console.log("✅ Email service initialized");
  }

  async sendEmail(to: string, subject: string, body: string) {
    console.log(`📧 Sending email to ${to}: ${subject}`);
    // Your email logic here
  }
}
```

### src/index.ts

```typescript
import { WynkFactory } from "wynkjs";
import { DatabaseService } from "./providers/database.service";
import { EmailService } from "./providers/email.service";
import { UserController } from "./modules/user/user.controller";

const app = WynkFactory.create({
  providers: [
    DatabaseService, // Initialized first
    EmailService, // Initialized second
  ],
  controllers: [UserController],
});

await app.listen(3000);
```

**Output:**

```bash
🔧 Initializing 2 providers...
  ⚙️  Initializing provider: DatabaseService
  🔌 Connecting to database...
  ✅ Database connected
  ✅ DatabaseService initialized successfully
  ⚙️  Initializing provider: EmailService
  📧 Initializing email service...
  ✅ Email service initialized
  ✅ EmailService initialized successfully
✅ All providers initialized successfully

📦 Registering controller UserController with 3 routes
🚀 Application is running on http://localhost:3000
```

---

## 🆚 Providers vs Regular Services

| Feature               | Providers                           | Regular Services        |
| --------------------- | ----------------------------------- | ----------------------- |
| **Registration**      | `WynkFactory.create({ providers })` | Not registered          |
| **Initialization**    | `onModuleInit()` called on startup  | Manual initialization   |
| **Error Handling**    | Stops app startup if fails          | Runtime errors          |
| **Best For**          | Database, config, external services | Business logic          |
| **Lifecycle**         | Controlled by framework             | Controlled by developer |
| **Singleton Pattern** | Recommended with `@singleton()`     | Optional                |

---

## 🎉 Benefits

1. **Startup Validation**: Catch configuration errors before routes are registered
2. **Automatic Initialization**: No manual setup in each controller
3. **Error Safety**: App won't start with misconfigured services
4. **Clean Architecture**: Clear separation between infrastructure and business logic
5. **Testability**: Easy to mock providers in tests
6. **Type Safety**: Full TypeScript support with dependency injection

---

## 🔗 Related Documentation

- [Dependency Injection](../README.md#-dependency-injection)
- [Architecture Guide](../ARCHITECTURE.md)
- [Database Integration](../README.md#️-database-integration-drizzle-orm)

---

**Happy Coding with WynkJS! 🚀**
