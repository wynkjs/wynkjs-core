# WynkJS Example with Swagger Documentation

Complete API documentation for all example modules using Swagger/OpenAPI.

## 🚀 Quick Start

### Start with Swagger UI

```bash
bun run start:swagger
```

or with auto-reload:

```bash
bun run dev:swagger
```

Then visit:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json

## 📚 What's Documented

### Authentication Module (`/auth`)
- **POST /auth/register** - Register new user
- **POST /auth/login** - Login and get JWT token
- **GET /auth/me** - Get current user profile
- **POST /auth/verify** - Verify token validity

### User Module (`/users`)
- **GET /users/** - List all users
- **POST /users/:id1/:id2** - Create user (complex params example)
- **GET /users/:id** - Get user by ID
- **GET /users/all** - Get all users
- **PATCH /users/:id** - Update user
- **POST /users/send-reset-email** - Send password reset email

### Product Module (`/product`)
- **GET /product/** - List all products
- **GET /product/:id** - Get product by ID
- **POST /product/** - Create new product
- **PUT /product/:id** - Update product (full)
- **PATCH /product/:id** - Update product (partial)
- **DELETE /product/:id** - Delete product

### Protected Routes Module (`/protected`)
All routes require JWT authentication. Some require specific roles.

- **GET /protected/dashboard** - Dashboard (any authenticated user)
- **GET /protected/admin** - Admin panel (admin only)
- **GET /protected/moderator** - Moderator panel (moderator/admin)
- **GET /protected/user-only** - User area (user/admin)
- **POST /protected/system-config** - System config (admin only)
- **GET /protected/content** - Content (any authenticated user)
- **GET /protected/health** - Health check

### Session Module (`/session`)
Demonstrates cookie-based session management.

- **GET /session/info** - Get session information
- **POST /session/create** - Create new session
- **DELETE /session/destroy** - Destroy session

### CORS Test Module (`/cors-test`)
- **GET /cors-test/test** - Test CORS configuration

## 🔐 How to Use Authentication

### 1. Register a New User

In Swagger UI, navigate to **Authentication** → **POST /auth/register**:

```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### 2. Authorize in Swagger

1. Copy the `accessToken` from the response
2. Click the **🔒 Authorize** button at the top right of Swagger UI
3. In the "Value" field, enter: `Bearer YOUR_TOKEN_HERE`
4. Click **Authorize**
5. Click **Close**

### 3. Test Protected Endpoints

Now you can test any protected endpoint! Try:
- **GET /protected/dashboard** - Should work with any authenticated user
- **GET /protected/admin** - Will return 403 if you're not an admin
- **GET /auth/me** - Get your current user info

## 🎯 Features Demonstrated

### Auto-Generated Documentation
All DTOs, validation rules, and route parameters are automatically documented:

```typescript
// This DTO in your code...
export class LoginDTO {
  @Type(() => String)
  @Pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
  email: string;

  @Type(() => String)
  @MinLength(6, "Password must be at least 6 characters")
  password: string;
}

// ...becomes this in Swagger UI:
{
  "email": "string (pattern: email, required)",
  "password": "string (minLength: 6, required)"
}
```

### JWT Bearer Authentication
Security scheme is configured for all protected routes:

```typescript
components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    }
  }
}
```

### Tag Organization
Routes are organized by module for easy navigation:
- Authentication
- Users
- Products
- Protected Routes
- Session
- CORS Test

### Request/Response Examples
Each endpoint shows:
- Required/optional parameters
- Request body schemas
- Response formats
- Validation rules
- HTTP status codes

## 🛠️ Technical Details

### Swagger Configuration

The Swagger integration is added after building the WynkJS app:

```typescript
const app = WynkFactory.create({
  controllers: [...],
});

const server = await app.build();

server.use(swagger({
  documentation: { /* OpenAPI config */ },
  path: "/docs"
}));

await server.listen(3000);
```

### OpenAPI Version
- **OpenAPI Specification**: 3.0.3
- **Swagger Plugin**: @elysiajs/swagger
- **Format**: JSON

### Endpoints
- **Swagger UI**: `/docs` - Interactive documentation
- **OpenAPI JSON**: `/docs/json` - Raw specification

## 📖 Example Workflows

### Workflow 1: User Registration & Authentication

1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login` (get token)
3. **Authorize**: Click 🔒 and add token
4. **Access Protected Route**: `GET /protected/dashboard`

### Workflow 2: Product Management

1. **Authenticate** first (see Workflow 1)
2. **List Products**: `GET /product/`
3. **Create Product**: `POST /product/`
4. **Update Product**: `PUT /product/:id`
5. **Delete Product**: `DELETE /product/:id`

### Workflow 3: Role-Based Access

1. **Login as Regular User**: `POST /auth/login`
2. **Try Admin Route**: `GET /protected/admin` → ❌ 403 Forbidden
3. **Login as Admin**: Need admin credentials
4. **Access Admin Route**: `GET /protected/admin` → ✅ Success

## 🔍 Validation Examples

### Email Validation
```json
{
  "email": "invalid-email"  // ❌ Will fail pattern validation
}
```

### Password Validation
```json
{
  "password": "123"  // ❌ Will fail minLength validation (needs 6+)
}
```

### Product Price Validation
```json
{
  "price": -10  // ❌ Will fail if Min() decorator is used
}
```

## 💡 Tips

1. **Use the "Try it out" button** - Test endpoints directly in Swagger UI
2. **Check the Models section** - See all DTOs and their schemas
3. **Look for the lock icon** 🔒 - Indicates authentication required
4. **Expand response schemas** - See exact response structure
5. **Test validation** - Try invalid inputs to see error responses

## 🚦 Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Internal Server Error

## 📝 Notes

- JWT tokens expire after **1 hour** (3600 seconds)
- Tokens are stored in **httpOnly cookies** for security
- All validation errors return detailed field-level messages
- CORS is enabled for development (allows all origins)
- Compression is enabled for responses > 1KB

## 🔗 Related Documentation

- [Main Swagger Integration Guide](../docs/SWAGGER_INTEGRATION.md)
- [WynkJS README](../README.md)
- [Example Test Guide](./test/README.md)

## 🎉 Enjoy Exploring!

Your complete API documentation is now available at http://localhost:3000/docs

Happy coding! 🚀
