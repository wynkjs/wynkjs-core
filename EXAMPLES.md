# Real-World Examples

Comprehensive collection of real-world examples for building production-ready applications with WynkJS.

## Table of Contents

- [Quick Start Examples](#quick-start-examples)
- [Authentication System](#authentication-system)
- [Blog API](#blog-api)
- [E-Commerce API](#e-commerce-api)
- [File Upload Service](#file-upload-service)
- [Real-Time Chat API](#real-time-chat-api)
- [Task Management System](#task-management-system)
- [Multi-Tenant SaaS](#multi-tenant-saas)
- [Microservices Architecture](#microservices-architecture)

---

## Quick Start Examples

### Hello World

```typescript
// index.ts
import { WynkFactory, Controller, Get } from "wynkjs";

@Controller("/")
export class AppController {
  @Get("/")
  hello() {
    return { message: "Hello, WynkJS!" };
  }
}

const app = WynkFactory.create({
  controllers: [AppController],
});

await app.listen(3000);
console.log("🚀 Server running on http://localhost:3000");
```

### CRUD API

```typescript
// user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Injectable,
} from "wynkjs";
import { CreateUserDTO, UpdateUserDTO, UserIdDto } from "./user.dto";

@Injectable()
@Controller("/users")
export class UserController {
  private users = new Map();

  @Get("/")
  findAll() {
    return { users: Array.from(this.users.values()) };
  }

  @Get({ path: "/:id", params: UserIdDto })
  findOne(@Param("id") id: string) {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException("User not found");
    return { user };
  }

  @Post({ path: "/", body: CreateUserDTO })
  create(@Body() body: any) {
    const id = Date.now().toString();
    const user = { id, ...body };
    this.users.set(id, user);
    return { user };
  }

  @Put({ path: "/:id", params: UserIdDto, body: UpdateUserDTO })
  update(@Param("id") id: string, @Body() body: any) {
    if (!this.users.has(id)) throw new NotFoundException("User not found");
    const user = { ...this.users.get(id), ...body };
    this.users.set(id, user);
    return { user };
  }

  @Delete({ path: "/:id", params: UserIdDto })
  remove(@Param("id") id: string) {
    if (!this.users.delete(id)) throw new NotFoundException("User not found");
    return { message: "User deleted" };
  }
}
```

---

## Authentication System

Complete JWT authentication with refresh tokens:

### Database Schema

```typescript
// database/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const refreshTokensTable = sqliteTable("refresh_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### DTOs

```typescript
// auth.dto.ts
import { DTO, CommonDTO } from "wynkjs";

export const RegisterDTO = DTO.Strict({
  name: DTO.String({
    minLength: 2,
    maxLength: 50,
    error: "Name must be between 2 and 50 characters",
  }),
  email: CommonDTO.Email({
    error: "Please provide a valid email address",
  }),
  password: DTO.String({
    minLength: 8,
    error: "Password must be at least 8 characters",
  }),
});

export const LoginDTO = DTO.Strict({
  email: CommonDTO.Email({
    error: "Please provide a valid email address",
  }),
  password: DTO.String({
    minLength: 1,
    error: "Password is required",
  }),
});

export const RefreshTokenDTO = DTO.Strict({
  refreshToken: DTO.String({
    minLength: 1,
    error: "Refresh token is required",
  }),
});
```

### Services

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from "wynkjs";
import { DatabaseService } from "../database/database.service";
import { usersTable, refreshTokensTable } from "../database/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
  constructor(private dbService: DatabaseService) {}

  async register(data: { name: string; email: string; password: string }) {
    const db = this.dbService.getDb();

    // Check if user exists
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException("Email already registered");
    }

    // Hash password
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "argon2id",
    });

    // Create user
    const [user] = await db
      .insert(usersTable)
      .values({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "user",
        createdAt: new Date(),
      })
      .returning();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(email: string, password: string) {
    const db = this.dbService.getDb();

    // Find user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isValid = await Bun.password.verify(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const db = this.dbService.getDb();

    // Verify refresh token exists and not expired
    const [tokenRecord] = await db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.token, refreshToken))
      .limit(1);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Get user
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, tokenRecord.userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return { accessToken };
  }

  private generateAccessToken(user: any): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const db = this.dbService.getDb();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(refreshTokensTable).values({
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    return token;
  }
}
```

### Guards

```typescript
// guards/jwt.guard.ts
import { UnauthorizedException } from "wynkjs";
import jwt from "jsonwebtoken";

export const jwtAuthGuard = async (ctx: any, next: Function) => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    ctx.user = decoded;
    return next();
  } catch (error) {
    throw new UnauthorizedException("Invalid or expired token");
  }
};

export const requireRoles = (...roles: string[]) => {
  return async (ctx: any, next: Function) => {
    if (!ctx.user) {
      throw new UnauthorizedException("Not authenticated");
    }

    if (!roles.includes(ctx.user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return next();
  };
};
```

### Controller

```typescript
// auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Use,
  Injectable,
  Req,
} from "wynkjs";
import { AuthService } from "./auth.service";
import { RegisterDTO, LoginDTO, RefreshTokenDTO } from "./auth.dto";
import { jwtAuthGuard } from "../guards/jwt.guard";

@Injectable()
@Controller("/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post({ path: "/register", body: RegisterDTO })
  async register(@Body() body: any) {
    const user = await this.authService.register(body);
    return {
      message: "Registration successful",
      user,
    };
  }

  @Post({ path: "/login", body: LoginDTO })
  async login(@Body() body: any) {
    const result = await this.authService.login(body.email, body.password);
    return result;
  }

  @Post({ path: "/refresh", body: RefreshTokenDTO })
  async refresh(@Body() body: any) {
    const result = await this.authService.refreshAccessToken(
      body.refreshToken
    );
    return result;
  }

  @Get("/profile")
  @Use(jwtAuthGuard)
  async getProfile(@Req() req: any) {
    return {
      user: req.user,
    };
  }
}
```

---

## Blog API

Complete blog system with posts, comments, and categories:

### Schema

```typescript
// database/blog-schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const postsTable = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  published: integer("published", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const categoriesTable = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const commentsTable = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### DTOs

```typescript
// blog.dto.ts
import { DTO } from "wynkjs";

export const CreatePostDTO = DTO.Strict({
  title: DTO.String({
    minLength: 3,
    maxLength: 200,
    error: "Title must be between 3 and 200 characters",
  }),
  content: DTO.String({
    minLength: 10,
    error: "Content must be at least 10 characters",
  }),
  excerpt: DTO.Optional(
    DTO.String({
      maxLength: 300,
      error: "Excerpt must not exceed 300 characters",
    })
  ),
  categoryId: DTO.Optional(
    DTO.Number({
      minimum: 1,
      error: "Invalid category ID",
    })
  ),
  published: DTO.Optional(DTO.Boolean({ default: false })),
});

export const UpdatePostDTO = DTO.Strict({
  title: DTO.Optional(DTO.String({ minLength: 3, maxLength: 200 })),
  content: DTO.Optional(DTO.String({ minLength: 10 })),
  excerpt: DTO.Optional(DTO.String({ maxLength: 300 })),
  categoryId: DTO.Optional(DTO.Number({ minimum: 1 })),
  published: DTO.Optional(DTO.Boolean()),
});

export const CreateCommentDTO = DTO.Strict({
  content: DTO.String({
    minLength: 1,
    maxLength: 1000,
    error: "Comment must be between 1 and 1000 characters",
  }),
});

export const PostQueryDTO = DTO.Strict({
  page: DTO.Optional(DTO.Number({ minimum: 1, default: 1 })),
  limit: DTO.Optional(DTO.Number({ minimum: 1, maximum: 100, default: 10 })),
  published: DTO.Optional(DTO.Boolean()),
  categoryId: DTO.Optional(DTO.Number({ minimum: 1 })),
});
```

### Service

```typescript
// blog.service.ts
import { Injectable, NotFoundException } from "wynkjs";
import { DatabaseService } from "../database/database.service";
import { postsTable, commentsTable } from "../database/blog-schema";
import { eq, desc, and } from "drizzle-orm";

@Injectable()
export class BlogService {
  constructor(private dbService: DatabaseService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    published?: boolean;
    categoryId?: number;
  }) {
    const db = this.dbService.getDb();
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (query.published !== undefined) {
      conditions.push(eq(postsTable.published, query.published));
    }
    if (query.categoryId) {
      conditions.push(eq(postsTable.categoryId, query.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const posts = await db
      .select()
      .from(postsTable)
      .where(whereClause)
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(postsTable)
      .where(whereClause);

    return {
      posts,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const db = this.dbService.getDb();

    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.slug, slug))
      .limit(1);

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    // Get comments
    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.postId, post.id))
      .orderBy(desc(commentsTable.createdAt));

    return { ...post, comments };
  }

  async create(data: any, authorId: number) {
    const db = this.dbService.getDb();

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [post] = await db
      .insert(postsTable)
      .values({
        ...data,
        slug,
        authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return post;
  }

  async addComment(postId: number, content: string, authorId: number) {
    const db = this.dbService.getDb();

    // Verify post exists
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({
        postId,
        content,
        authorId,
        createdAt: new Date(),
      })
      .returning();

    return comment;
  }
}
```

### Controller

```typescript
// blog.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Use,
  Injectable,
  Req,
} from "wynkjs";
import { BlogService } from "./blog.service";
import {
  CreatePostDTO,
  UpdatePostDTO,
  CreateCommentDTO,
  PostQueryDTO,
} from "./blog.dto";
import { jwtAuthGuard, requireRoles } from "../guards/jwt.guard";

@Injectable()
@Controller("/blog")
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Get({ path: "/posts", query: PostQueryDTO })
  async listPosts(@Query() query: any) {
    return await this.blogService.findAll(query);
  }

  @Get("/posts/:slug")
  async getPost(@Param("slug") slug: string) {
    return await this.blogService.findBySlug(slug);
  }

  @Post({ path: "/posts", body: CreatePostDTO })
  @Use(jwtAuthGuard, requireRoles("author", "admin"))
  async createPost(@Body() body: any, @Req() req: any) {
    const post = await this.blogService.create(body, req.user.userId);
    return { message: "Post created", post };
  }

  @Put({ path: "/posts/:id", body: UpdatePostDTO })
  @Use(jwtAuthGuard, requireRoles("author", "admin"))
  async updatePost(@Param("id") id: string, @Body() body: any) {
    const post = await this.blogService.update(parseInt(id), body);
    return { message: "Post updated", post };
  }

  @Post({ path: "/posts/:id/comments", body: CreateCommentDTO })
  @Use(jwtAuthGuard)
  async addComment(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any
  ) {
    const comment = await this.blogService.addComment(
      parseInt(id),
      body.content,
      req.user.userId
    );
    return { message: "Comment added", comment };
  }
}
```

---

## E-Commerce API

Product catalog with shopping cart and orders:

### Schema

```typescript
// database/ecommerce-schema.ts
export const productsTable = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: integer("price").notNull(), // Store in cents
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const cartItemsTable = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const ordersTable = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const orderItemsTable = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});
```

### Service

```typescript
// ecommerce.service.ts
import { Injectable, BadRequestException } from "wynkjs";
import { DatabaseService } from "../database/database.service";
import { productsTable, cartItemsTable, ordersTable } from "./ecommerce-schema";
import { eq, and } from "drizzle-orm";

@Injectable()
export class EcommerceService {
  constructor(private dbService: DatabaseService) {}

  async addToCart(userId: number, productId: number, quantity: number) {
    const db = this.dbService.getDb();

    // Check product availability
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product || !product.active) {
      throw new BadRequestException("Product not available");
    }

    if (product.stock < quantity) {
      throw new BadRequestException("Insufficient stock");
    }

    // Check if item already in cart
    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.userId, userId),
          eq(cartItemsTable.productId, productId)
        )
      )
      .limit(1);

    if (existing) {
      // Update quantity
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      // Add new item
      await db.insert(cartItemsTable).values({
        userId,
        productId,
        quantity,
        createdAt: new Date(),
      });
    }

    return { message: "Item added to cart" };
  }

  async getCart(userId: number) {
    const db = this.dbService.getDb();

    const items = await db
      .select({
        id: cartItemsTable.id,
        quantity: cartItemsTable.quantity,
        product: productsTable,
      })
      .from(cartItemsTable)
      .innerJoin(
        productsTable,
        eq(cartItemsTable.productId, productsTable.id)
      )
      .where(eq(cartItemsTable.userId, userId));

    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return { items, total };
  }

  async checkout(userId: number, shippingAddress: string) {
    const db = this.dbService.getDb();

    // Get cart items
    const { items, total } = await this.getCart(userId);

    if (items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Create order
    const [order] = await db
      .insert(ordersTable)
      .values({
        userId,
        total,
        shippingAddress,
        status: "pending",
        createdAt: new Date(),
      })
      .returning();

    // Create order items and update stock
    for (const item of items) {
      await db.insert(orderItemsTable).values({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      });

      await db
        .update(productsTable)
        .set({ stock: item.product.stock - item.quantity })
        .where(eq(productsTable.id, item.product.id));
    }

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    return { order, message: "Order placed successfully" };
  }
}
```

For complete examples and more use cases, see the [example directory](./example/src/).

---

## Additional Resources

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [TESTING.md](./TESTING.md) - Testing guide with examples
- [SECURITY.md](./SECURITY.md) - Security best practices
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guides
- [Example Project](./example/) - Full working example

---

**Build amazing things with WynkJS! 🚀**
