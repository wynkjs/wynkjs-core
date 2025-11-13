# CORS Configuration Guide

## Overview

WynkJS includes built-in CORS (Cross-Origin Resource Sharing) support powered by `@elysiajs/cors`. No additional packages needed!

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Configuration](#basic-configuration)
- [Advanced Configuration](#advanced-configuration)
- [Common Scenarios](#common-scenarios)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Enable CORS for All Origins

Perfect for development, but **not recommended for production**:

```typescript
import { WynkFactory } from "wynkjs";
import { UserController } from "./controllers/user.controller";

const app = WynkFactory.create({
  controllers: [UserController],
  cors: true, // ✅ Allow all origins
});

await app.listen(3000);
```

---

## Basic Configuration

### Allow Specific Origins

Recommended for production environments:

```typescript
import { WynkFactory, CorsOptions } from "wynkjs";

const corsOptions: CorsOptions = {
  origin: "https://yourdomain.com", // Single origin
  credentials: true,
};

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,
});
```

### Allow Multiple Origins

```typescript
const corsOptions: CorsOptions = {
  origin: [
    "https://yourdomain.com",
    "https://app.yourdomain.com",
    "https://admin.yourdomain.com",
  ],
  credentials: true,
};
```

---

## Advanced Configuration

### Full Configuration Options

```typescript
import { WynkFactory, CorsOptions } from "wynkjs";

const corsOptions: CorsOptions = {
  // Origins
  origin: ["https://yourdomain.com", "https://app.yourdomain.com"],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Allowed request headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],

  // Exposed response headers
  exposedHeaders: ["X-Total-Count", "X-Page-Number"],

  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours

  // Allow private network access
  allowPrivateNetwork: false,
};

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,
});
```

### Dynamic Origin Validation

Use a function to validate origins dynamically:

```typescript
const corsOptions: CorsOptions = {
  origin: (origin: string) => {
    // List of allowed origins
    const allowedOrigins = [
      "https://yourdomain.com",
      "https://app.yourdomain.com",
      /\.yourdomain\.com$/, // Regex pattern
    ];

    // Check if origin matches any allowed origin
    return allowedOrigins.some((allowed) => {
      if (typeof allowed === "string") {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
  },
  credentials: true,
};
```

### Environment-Based Configuration

```typescript
const isDevelopment = process.env.NODE_ENV === "development";

const corsOptions: CorsOptions = isDevelopment
  ? {
      // Development: Allow all origins
      origin: true,
      credentials: true,
    }
  : {
      // Production: Strict origin control
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "https://yourdomain.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    };

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,
});
```

---

## Common Scenarios

### Scenario 1: Public API (No Credentials)

```typescript
const corsOptions: CorsOptions = {
  origin: "*", // Allow all origins
  credentials: false, // No cookies/auth headers
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};
```

### Scenario 2: Authenticated API with Frontend

```typescript
const corsOptions: CorsOptions = {
  origin: ["https://yourdomain.com", "https://app.yourdomain.com"],
  credentials: true, // Allow cookies and auth headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"], // Expose custom headers to frontend
  maxAge: 3600, // Cache preflight for 1 hour
};
```

### Scenario 3: Mobile App API

```typescript
const corsOptions: CorsOptions = {
  origin: [
    "capacitor://localhost", // iOS
    "http://localhost", // Android
    "https://yourdomain.com", // Web version
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
```

### Scenario 4: Microservices (Internal APIs)

```typescript
const corsOptions: CorsOptions = {
  origin: (origin: string) => {
    // Allow internal network origins
    return (
      origin.includes(".internal.yourdomain.com") ||
      origin.includes("localhost")
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
```

### Scenario 5: Development with Multiple Ports

```typescript
const corsOptions: CorsOptions = {
  origin: [
    "http://localhost:3000", // React
    "http://localhost:3001", // Vue
    "http://localhost:4200", // Angular
    "http://localhost:5173", // Vite
  ],
  credentials: true,
};
```

---

## Security Best Practices

### 1. Never Use Wildcard (*) in Production

```typescript
// ❌ BAD - Insecure for production
const corsOptions: CorsOptions = {
  origin: "*",
  credentials: true, // This won't work anyway!
};

// ✅ GOOD - Explicit origins
const corsOptions: CorsOptions = {
  origin: ["https://yourdomain.com"],
  credentials: true,
};
```

**Important**: When `credentials: true`, you **cannot** use `origin: "*"`. The browser will reject the request.

### 2. Validate Origins Properly

```typescript
// ✅ GOOD - Use allowlist approach
const corsOptions: CorsOptions = {
  origin: (origin: string) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    return allowedOrigins.includes(origin);
  },
};

// ❌ BAD - Overly permissive regex
const corsOptions: CorsOptions = {
  origin: (origin: string) => {
    return /\.com$/.test(origin); // Allows ANY .com domain!
  },
};
```

### 3. Minimize Exposed Headers

```typescript
// Only expose headers that frontend needs
const corsOptions: CorsOptions = {
  exposedHeaders: ["X-Total-Count"], // ✅ Specific
  // Not: exposedHeaders: ['*'] // ❌ Too permissive
};
```

### 4. Set Appropriate maxAge

```typescript
const corsOptions: CorsOptions = {
  maxAge: 3600, // 1 hour - balance between performance and flexibility
  // Not: maxAge: 31536000 // ❌ 1 year - too long for most cases
};
```

### 5. Use HTTPS in Production

```typescript
const corsOptions: CorsOptions = {
  origin: [
    "https://yourdomain.com", // ✅ HTTPS
    // Not: 'http://yourdomain.com' // ❌ HTTP in production
  ],
};
```

---

## Troubleshooting

### Issue 1: "Access-Control-Allow-Origin" Error

**Error:**

```
Access to fetch at 'http://localhost:3000/api/users' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

**Solution:**

```typescript
// Add the frontend origin to CORS config
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173", // Add your frontend URL
  credentials: true,
};
```

### Issue 2: Preflight Request Failing

**Error:**

```
Access to fetch at '...' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```

**Solution:**

```typescript
// Ensure OPTIONS method is allowed
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Include OPTIONS
  allowedHeaders: ["Content-Type", "Authorization"],
};
```

### Issue 3: Credentials Not Working

**Error:**

```
Access to fetch at '...' has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true'
```

**Solution:**

```typescript
// Enable credentials and use specific origin (not *)
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173", // ✅ Specific origin
  credentials: true, // ✅ Enable credentials
  // Not: origin: '*' // ❌ Won't work with credentials
};
```

### Issue 4: Custom Headers Not Allowed

**Error:**

```
Request header field X-Custom-Header is not allowed by Access-Control-Allow-Headers
```

**Solution:**

```typescript
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Custom-Header", // ✅ Add custom header
  ],
};
```

### Issue 5: Response Headers Not Accessible

**Problem:** Frontend can't read custom response headers

**Solution:**

```typescript
const corsOptions: CorsOptions = {
  origin: "http://localhost:5173",
  exposedHeaders: [
    "X-Total-Count", // ✅ Expose custom headers
    "X-Page-Number",
  ],
};
```

---

## Testing CORS Configuration

### Test 1: Simple Request (GET)

```bash
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  http://localhost:3000/api/users
```

### Test 2: Preflight Request

```bash
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:3000/api/users
```

### Test 3: With JavaScript

```javascript
// Frontend code
fetch("http://localhost:3000/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer token123",
  },
  credentials: "include", // Include cookies
  body: JSON.stringify({ name: "John" }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("CORS Error:", error));
```

---

## Complete Example

```typescript
import { WynkFactory, CorsOptions } from "wynkjs";
import { UserController } from "./controllers/user.controller";

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === "development";

const corsOptions: CorsOptions = isDevelopment
  ? {
      // Development: Permissive for local development
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }
  : {
      // Production: Strict security
      origin: (origin: string) => {
        const allowedOrigins = [
          "https://yourdomain.com",
          "https://app.yourdomain.com",
        ];
        return allowedOrigins.includes(origin);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Total-Count"],
      maxAge: 86400, // 24 hours
    };

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,
});

await app.listen(3000);

console.log(
  `🚀 Server running on http://localhost:3000 with ${isDevelopment ? "development" : "production"} CORS`
);
```

---

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Elysia CORS Plugin](https://elysiajs.com/plugins/cors.html)
- [WynkJS Documentation](../README.md)

---

**Built with ❤️ by the WynkJS Team**
