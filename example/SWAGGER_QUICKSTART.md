# 🚀 Swagger Documentation - Quick Start

Generated Swagger/OpenAPI documentation for your WynkJS example modules!

## ✨ What's Been Created

### 📁 Files

1. **`swagger-demo.ts`** - Standalone Swagger demo (no database required)
   - ✅ Works immediately without setup
   - ✅ Mock data for testing
   - ✅ All your modules documented

2. **`src/index-with-swagger.ts`** - Full app with Swagger
   - Includes all real controllers
   - Requires database connection
   - Production-ready setup

3. **`SWAGGER_README.md`** - Complete documentation guide

## 🎯 Fastest Way to Start

### Option 1: Standalone Demo (Recommended First)

```bash
bun run swagger
```

Then open: **http://localhost:3000/docs**

✅ No database needed  
✅ Mock data included  
✅ Test everything immediately

### Option 2: Full Application

```bash
bun run start:swagger
```

⚠️ Requires PostgreSQL database setup

## 📚 What's Documented

### 🔐 Authentication (`/auth`)
- **POST /auth/register** - Create new account
- **POST /auth/login** - Login and get JWT token
- **GET /auth/me** - Get current user
- **POST /auth/verify** - Verify token

### 👥 Users (`/users`)
- **GET /users/** - List users (with pagination)
- **POST /users/** - Create user
- **GET /users/:id** - Get user by ID

### 📦 Products (`/products`)
- **GET /products/** - List all products
- **POST /products/** - Create product
- **GET /products/:id** - Get product
- **PUT /products/:id** - Update product
- **DELETE /products/:id** - Delete product

### 🛡️ Protected Routes (`/protected`)
- **GET /protected/dashboard** - User dashboard
- **GET /protected/admin** - Admin panel (admin only)
- **GET /protected/moderator** - Moderator panel

### ❤️ Health Check (`/health`)
- **GET /health/** - Server status

## 🔑 Quick Test Flow

### 1. Start the Server
```bash
bun run swagger
```

### 2. Open Swagger UI
Visit: http://localhost:3000/docs

### 3. Register a User
Click **Authentication** → **POST /auth/register** → **Try it out**

```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Click **Execute**

### 4. Copy Your Token
From the response, copy the `accessToken`

### 5. Authorize
1. Click the **🔒 Authorize** button (top right)
2. Paste: `Bearer YOUR_TOKEN_HERE`
3. Click **Authorize**
4. Click **Close**

### 6. Test Endpoints!
Now you can test any endpoint:
- Try **GET /protected/dashboard**
- Try **GET /users/**
- Try **POST /products/**

## 📋 Available Scripts

```bash
# Standalone demo (no DB)
bun run swagger

# Full app with Swagger (needs DB)
bun run start:swagger

# Development mode with auto-reload
bun run dev:swagger
```

## 🎨 Features Highlighted

### ✅ Auto-Generated from Code
All documentation is generated from your:
- Controller decorators (`@Get`, `@Post`, etc.)
- DTO schemas (validation rules)
- Route paths and parameters

### ✅ Interactive Testing
- Test endpoints directly in browser
- No Postman needed
- Request/response examples included

### ✅ JWT Authentication
- Authorize once, test all protected endpoints
- Token persists across requests
- Secure Bearer token format

### ✅ Validation Documentation
All validation rules are documented:
- Email format requirements
- Password minimum length (6 chars)
- Number ranges (min/max)
- Required vs optional fields

## 💡 Pro Tips

1. **Use "Try it out"** - Test endpoints without leaving your browser
2. **Check "Schemas" section** - See all DTOs and their types
3. **Look for 🔒 icon** - Indicates authentication required
4. **Expand responses** - See exact response structure
5. **Test validation** - Try invalid data to see error messages

## 🎯 Example API Calls

### Health Check (No auth)
```bash
curl http://localhost:3000/health
```

### Register User (No auth)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Users (With auth)
```bash
curl http://localhost:3000/users/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Product (With auth)
```bash
curl -X POST http://localhost:3000/products/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1299.99,
    "stock": 10
  }'
```

## 📊 OpenAPI JSON

Access the raw OpenAPI specification:
```
http://localhost:3000/docs/json
```

Use this to:
- Generate client SDKs
- Import into Postman
- Generate code in other languages
- CI/CD integration

## 🔧 Customization

To modify the Swagger configuration, edit the `swagger()` call in `swagger-demo.ts`:

```typescript
server.use(
  swagger({
    documentation: {
      info: {
        title: "Your API Title",
        version: "1.0.0",
        description: "Your description"
      },
      // Add more customization
    },
    path: "/docs" // Change the UI path
  })
);
```

## 📚 Full Documentation

For complete details, see:
- [SWAGGER_README.md](./SWAGGER_README.md) - Complete guide
- [Main Swagger Integration](../docs/SWAGGER_INTEGRATION.md) - Framework docs

## ❓ Need Help?

Common issues:

**Port 3000 already in use?**
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port in the file:
server.listen(3001); // Use different port
```

**Database errors?**
- Use `bun run swagger` (standalone demo, no DB)
- Or setup PostgreSQL for full app

**Can't see my changes?**
- Restart the server
- Clear browser cache
- Check console for errors

## 🎉 Enjoy!

Your API documentation is now live and interactive!

Visit: **http://localhost:3000/docs**

Happy testing! 🚀
