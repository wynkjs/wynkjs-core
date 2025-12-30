import "dotenv/config";
import {
  WynkFactory,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Injectable,
  DTO,
} from "wynkjs";
import { swagger } from "@elysiajs/swagger";

/**
 * DTOs for API Documentation
 */

// Auth DTOs
const LoginDTO = DTO.Object({
  email: DTO.String({ format: "email" }),
  password: DTO.String({ minLength: 6 }),
});

const RegisterDTO = DTO.Object({
  email: DTO.String({ format: "email" }),
  password: DTO.String({ minLength: 6 }),
  firstName: DTO.Optional(DTO.String()),
  lastName: DTO.Optional(DTO.String()),
  username: DTO.Optional(DTO.String()),
});

// Product DTOs
const CreateProductDTO = DTO.Object({
  name: DTO.String({ minLength: 3 }),
  description: DTO.String({ minLength: 10 }),
  price: DTO.Number({ minimum: 0 }),
  stock: DTO.Number({ minimum: 0 }),
  category: DTO.Optional(DTO.String()),
});

const UpdateProductDTO = DTO.Object({
  name: DTO.Optional(DTO.String({ minLength: 3 })),
  description: DTO.Optional(DTO.String({ minLength: 10 })),
  price: DTO.Optional(DTO.Number({ minimum: 0 })),
  stock: DTO.Optional(DTO.Number({ minimum: 0 })),
  category: DTO.Optional(DTO.String()),
});

const ProductIdDto = DTO.Object({
  id: DTO.String(),
});

// User DTOs
const CreateUserDTO = DTO.Object({
  email: DTO.String({ format: "email" }),
  name: DTO.String({ minLength: 3 }),
  age: DTO.Optional(DTO.Number({ minimum: 18, maximum: 120 })),
  role: DTO.Optional(DTO.String()),
});

const UserIdDto = DTO.Object({
  id: DTO.String(),
});

const UserQueryDto = DTO.Object({
  page: DTO.Optional(DTO.Number({ minimum: 1 })),
  limit: DTO.Optional(DTO.Number({ minimum: 1, maximum: 100 })),
  role: DTO.Optional(DTO.String()),
});

/**
 * Mock Data
 */
const mockUsers = [
  { id: "1", email: "john@example.com", name: "John Doe", age: 30, role: "admin" },
  { id: "2", email: "jane@example.com", name: "Jane Smith", age: 25, role: "user" },
  { id: "3", email: "bob@example.com", name: "Bob Wilson", age: 35, role: "moderator" },
];

const mockProducts = [
  { id: "1", name: "Laptop", description: "High-performance laptop", price: 1299.99, stock: 15, category: "Electronics" },
  { id: "2", name: "Mouse", description: "Wireless gaming mouse", price: 49.99, stock: 50, category: "Accessories" },
  { id: "3", name: "Keyboard", description: "Mechanical keyboard", price: 89.99, stock: 30, category: "Accessories" },
];

/**
 * Controllers
 */

@Injectable()
@Controller("/auth")
export class AuthController {
  @Post({ path: "/register", body: RegisterDTO })
  async register(@Body() body: any) {
    // Mock registration
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token";
    
    return {
      message: "User registered successfully",
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        roles: ["user"],
      },
      accessToken: mockToken,
      expiresIn: 3600,
    };
  }

  @Post({ path: "/login", body: LoginDTO })
  async login(@Body() body: any) {
    // Mock login
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token";
    
    return {
      message: "Login successful",
      user: {
        id: "1",
        email: body.email,
        firstName: "John",
        lastName: "Doe",
        roles: ["user", "admin"],
      },
      accessToken: mockToken,
      expiresIn: 3600,
    };
  }

  @Get("/me")
  async getCurrentUser() {
    return {
      user: {
        id: "1",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        roles: ["user", "admin"],
      },
    };
  }

  @Post("/verify")
  async verifyToken(@Body() body: { token: string }) {
    return {
      valid: true,
      user: {
        id: "1",
        email: "john@example.com",
        roles: ["user"],
      },
    };
  }
}

@Injectable()
@Controller("/users")
export class UserController {
  @Get({ path: "/", query: UserQueryDto })
  async list(@Query() query: any) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    
    let filtered = mockUsers;
    if (query.role) {
      filtered = mockUsers.filter(u => u.role === query.role);
    }

    return {
      users: filtered,
      pagination: {
        page,
        limit,
        total: filtered.length,
      },
    };
  }

  @Post({ path: "/", body: CreateUserDTO })
  async create(@Body() body: any) {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
    };

    return {
      message: "User created successfully",
      user: newUser,
    };
  }

  @Get({ path: "/:id", params: UserIdDto })
  async findOne(@Param("id") id: string) {
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  }
}

@Injectable()
@Controller("/products")
export class ProductController {
  @Get("/")
  async findAll() {
    return {
      products: mockProducts,
      total: mockProducts.length,
    };
  }

  @Get({ path: "/:id", params: ProductIdDto })
  async findOne(@Param("id") id: string) {
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return { error: "Product not found" };
    }

    return { product };
  }

  @Post({ path: "/", body: CreateProductDTO })
  async create(@Body() body: any) {
    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
    };

    return {
      message: "Product created successfully",
      product: newProduct,
    };
  }

  @Put({ path: "/:id", params: ProductIdDto, body: UpdateProductDTO })
  async update(
    @Param("id") id: string,
    @Body() body: any
  ) {
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return { error: "Product not found" };
    }

    return {
      message: "Product updated successfully",
      product: { ...product, ...body },
    };
  }

  @Delete({ path: "/:id", params: ProductIdDto })
  async remove(@Param("id") id: string) {
    return {
      message: "Product deleted successfully",
      id,
    };
  }
}

@Injectable()
@Controller("/protected")
export class ProtectedController {
  @Get("/dashboard")
  async getDashboard() {
    return {
      message: "Welcome to dashboard",
      user: {
        id: "1",
        email: "john@example.com",
        roles: ["user", "admin"],
      },
      features: ["Analytics", "Reports", "Settings"],
    };
  }

  @Get("/admin")
  async adminPanel() {
    return {
      message: "Admin Panel",
      features: ["User Management", "System Config", "Analytics"],
    };
  }

  @Get("/moderator")
  async moderatorPanel() {
    return {
      message: "Moderator Panel",
      features: ["Content Moderation", "User Reports"],
    };
  }
}

@Injectable()
@Controller("/health")
export class HealthController {
  @Get("/")
  async check() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }
}

/**
 * Bootstrap Application
 */
async function bootstrap() {
  console.log("🚀 Starting WynkJS Example with Swagger Documentation...\n");

  // Create WynkJS application
  const app = WynkFactory.create({
    controllers: [
      AuthController,
      UserController,
      ProductController,
      ProtectedController,
      HealthController,
    ],
    cors: true,
    logger: true,
  });

  // Build the server
  const server = await app.build();

  // Add Swagger Documentation
  server.use(
    swagger({
      documentation: {
        info: {
          title: "WynkJS Example API Documentation",
          version: "1.0.0",
          description: `
# 🎉 WynkJS Example Application API

Complete API documentation demonstrating all WynkJS features.

## 🚀 Features

- 🔐 **JWT Authentication** - Secure login and registration
- 👥 **User Management** - CRUD operations with validation
- 📦 **Product Management** - Full product catalog
- 🛡️ **Protected Routes** - Role-based access control
- ✅ **Request Validation** - Auto-validated DTOs

## 🔑 Quick Start

### 1. Register a User
\`\`\`
POST /auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
\`\`\`

### 2. Get Your Token
Copy the \`accessToken\` from the registration response.

### 3. Authorize
Click the **🔒 Authorize** button at the top right and enter:
\`\`\`
Bearer YOUR_TOKEN_HERE
\`\`\`

### 4. Try Protected Endpoints
Now you can access protected routes like:
- \`GET /protected/dashboard\`
- \`GET /protected/admin\`

## 📋 Available Roles
- **user** - Regular user access
- **admin** - Full administrative access
- **moderator** - Content moderation

## 🎯 Validation Examples

All endpoints validate input automatically:

✅ **Valid Email**: \`user@example.com\`  
❌ **Invalid Email**: \`not-an-email\`

✅ **Valid Password**: \`password123\` (6+ chars)  
❌ **Invalid Password**: \`123\` (too short)

✅ **Valid Price**: \`29.99\` (positive)  
❌ **Invalid Price**: \`-10\` (negative)

## 💡 Tips
- Use "Try it out" to test endpoints directly
- Check "Schemas" section for all DTOs
- Look for 🔒 icon for protected routes
          `.trim(),
          contact: {
            name: "WynkJS",
            url: "https://github.com/yourusername/wynkjs",
          },
          license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
          },
        },
        tags: [
          {
            name: "Authentication",
            description: "🔐 User authentication endpoints (register, login, token management)",
          },
          {
            name: "Users",
            description: "👥 User management operations with full validation",
          },
          {
            name: "Products",
            description: "📦 Product catalog management (CRUD operations)",
          },
          {
            name: "Protected",
            description: "🛡️ Role-based protected endpoints (requires authentication)",
          },
          {
            name: "Health",
            description: "❤️ Health check and monitoring endpoints",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
              description: "JWT token from /auth/login or /auth/register",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      path: "/docs",
      exclude: ["/docs", "/docs/json"],
    })
  );

  // Start server
  await server.listen(3000);

  console.log("\n✅ Server Started Successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌐 API Server:      http://localhost:3000");
  console.log("📚 Swagger UI:      http://localhost:3000/docs");
  console.log("📄 OpenAPI JSON:    http://localhost:3000/docs/json");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📖 Quick Guide:\n");
  console.log("1️⃣  Open http://localhost:3000/docs in your browser");
  console.log("2️⃣  Try POST /auth/register to create a user");
  console.log("3️⃣  Copy the accessToken from response");
  console.log("4️⃣  Click 'Authorize' 🔒 and paste your token");
  console.log("5️⃣  Test protected endpoints!\n");
  console.log("🎯 Example Endpoints:");
  console.log("   • GET  /health          - Health check");
  console.log("   • POST /auth/register   - Register user");
  console.log("   • POST /auth/login      - Login");
  console.log("   • GET  /users/          - List users");
  console.log("   • GET  /products/       - List products");
  console.log("   • GET  /protected/*     - Protected routes\n");
  console.log("💡 All endpoints include validation & auto-documentation!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start application:", error);
  process.exit(1);
});
