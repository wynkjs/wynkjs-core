# 🏗️ Authentication & RBAC Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                        │
│                     (Web/Mobile Frontend)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTP Requests
                               │ (with JWT token)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WYNKJS APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              HTTP Request Handler                        │   │
│  │         (Built-in request processing)                   │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Authorization Header                         │   │
│  │         (Extract Bearer token)                           │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │         AuthGuard (Token Verification)                   │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 1. Extract token from header                        │ │   │
│  │  │ 2. Decode JWT payload                              │ │   │
│  │  │ 3. Verify token expiration                         │ │   │
│  │  │ 4. Extract user data & roles                       │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│                         ├─ Token Invalid ──┐                    │
│                         │                  ▼                    │
│                         │          ❌ 401 Unauthorized           │
│                         │                                        │
│                         └─ Token Valid ──┐                      │
│                                         ▼                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      Role-Based Access Control (RBAC)                    │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ 1. Extract user roles from token                    │ │   │
│  │  │ 2. Check required roles for endpoint                │ │   │
│  │  │ 3. Match user roles against requirements            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│                         ├─ Role Mismatch ──┐                   │
│                         │                  ▼                    │
│                         │          ❌ 403 Forbidden              │
│                         │                                        │
│                         └─ Role Match ──┐                       │
│                                         ▼                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Route Handler / Controller                    │   │
│  │  (Execute business logic with authenticated user)        │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             AuthService / Services                       │   │
│  │    (Database interactions, user management, etc)         │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │           DatabaseService (Drizzle ORM)                 │   │
│  │    (Database abstraction & connection pooling)           │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          │ SQL Queries
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌──────────────┐  ┌──────────────────┐│
│  │    USERS TABLE      │  │ ROLES TABLE  │  │ USER_ROLES TABLE ││
│  ├─────────────────────┤  ├──────────────┤  ├──────────────────┤│
│  │ id (UUID)           │  │ id (UUID)    │  │ id (UUID)        ││
│  │ email (VARCHAR)     │  │ name (VARCHAR)  │ userId (FK)      ││
│  │ password (VARCHAR)  │  │ description  │  │ roleId (FK)      ││
│  │ username            │  │              │  │ createdAt        ││
│  │ firstName           │  │ createdAt    │  └──────────────────┘│
│  │ lastName            │  │ updatedAt    │                      │
│  │ isActive (BOOL)     │  └──────────────┘                      │
│  │ emailVerified (BOOL)│                                        │
│  │ lastLoginAt         │        [Relationships]                 │
│  │ createdAt           │                                        │
│  │ updatedAt           │    users (1) ──── (M) user_roles       │
│  └─────────────────────┘           │                    │       │
│                                    │                    │       │
│                                    └──────────── (1) roles       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Authentication Flow

```
User Registration/Login
    │
    ▼
AuthController.register() / login()
    │
    ├─ Validate input (DTO)
    │   └─ Email format, password length
    │
    ├─ AuthService.registerUser() / validateUser()
    │   ├─ Hash password
    │   ├─ Query database
    │   └─ Get user roles
    │
    ├─ AuthService.createToken()
    │   └─ Generate JWT with user data
    │
    └─ Response: user data + access token
```

### 2. Protected Route Access

```
Client Request (with token)
    │
    ├─ Extract Authorization header
    │   └─ Format: "Bearer <token>"
    │
    ├─ AuthGuard.verifyToken()
    │   └─ Decode JWT, extract user data
    │
    ├─ Check Authentication
    │   ├─ If invalid/missing token → 401 Unauthorized
    │   └─ If valid → continue
    │
    ├─ Check Authorization (RBAC)
    │   ├─ Get required roles from route
    │   ├─ Match user roles vs required
    │   ├─ If no match → 403 Forbidden
    │   └─ If match → continue
    │
    ├─ Execute Route Handler
    │   └─ Access user data via AuthUser object
    │
    └─ Return Response
```

### 3. Role-Based Access Control

```
User with roles: ["user", "moderator"]

Route Requirements:
│
├─ Public route (no auth required)
│   └─ ✅ Access granted (no check)
│
├─ requireAuth("user") - any authenticated user
│   └─ ✅ Access granted (user is authenticated)
│
├─ requireRole(["admin"]) - admin only
│   └─ ❌ Access denied (no admin role)
│
├─ requireRole(["moderator", "admin"]) - moderator or admin
│   └─ ✅ Access granted (has moderator role)
│
├─ hasRole(["user"]) - check without throwing
│   └─ true (has user role)
│
└─ hasRole(["admin"]) - check without throwing
    └─ false (no admin role)
```

## Data Flow Diagram

### Registration Flow

```
┌──────────────┐
│  Client App  │
└──────┬───────┘
       │ POST /auth/register
       │ {email, password, firstName, lastName}
       ▼
┌──────────────────┐
│ AuthController   │─────► Validate DTO
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AuthService      │
├──────────────────┤
│ 1. Check exists  │───► DB: SELECT * FROM users WHERE email=?
│ 2. Hash password │
│ 3. Create user   │───► DB: INSERT INTO users
│ 4. Get roles     │───► DB: SELECT * FROM roles WHERE name='user'
│ 5. Assign role   │───► DB: INSERT INTO user_roles
│ 6. Create token  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Return Response  │
├──────────────────┤
│ {               │
│   user: {...},  │
│   token: "JWT", │
│   roles: [...]  │
│ }               │
└──────────────────┘
```

### Login Flow

```
┌──────────────┐
│  Client App  │
└──────┬───────┘
       │ POST /auth/login
       │ {email, password}
       ▼
┌──────────────────┐
│ AuthController   │─────► Validate DTO
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AuthService      │
├──────────────────┤
│ 1. Find user     │───► DB: SELECT * FROM users WHERE email=?
│ 2. Compare pwd   │
│ 3. Get roles     │───► DB: SELECT * FROM user_roles JOIN roles
│ 4. Update login  │───► DB: UPDATE users SET lastLoginAt=NOW()
│ 5. Create token  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Return Response  │
├──────────────────┤
│ {               │
│   user: {...},  │
│   token: "JWT", │
│   roles: [...]  │
│ }               │
└──────────────────┘
```

### Protected Route Access Flow

```
┌──────────────────────┐
│ Client Request       │
├──────────────────────┤
│ GET /protected/admin │
│ Authorization:       │
│ Bearer <token>       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Extract Token        │
│ from Header          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ AuthGuard.verify     │
│ Token()              │
└──────┬───────────────┘
       │
       ├─ Invalid ──► 401 Unauthorized
       │
       └─ Valid ──┐
                  ▼
       ┌──────────────────────┐
       │ Extract user data    │
       │ & roles from JWT     │
       └──────┬───────────────┘
              │
              ▼
       ┌──────────────────────┐
       │ Check role: "admin"  │
       └──────┬───────────────┘
              │
              ├─ No admin role ──► 403 Forbidden
              │
              └─ Has admin ──┐
                             ▼
                    ┌──────────────────────┐
                    │ Execute Handler      │
                    │ (with AuthUser data) │
                    └──────┬───────────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ Return Response      │
                    └──────────────────────┘
```

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│ WynkJS Application (src/index.ts)                           │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────┴───────┬──────────────┬────────────────┐
        ▼               ▼              ▼                ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐
│ Database    │ │ Auth Module  │ │ Protected    │ │ Other      │
│ Service     │ │              │ │ Routes       │ │ Modules    │
└────┬────────┘ └──┬───────┬──┬─┘ └──┬──────────┘ └────────────┘
     │             │       │  │      │
     │             ▼       │  │      │
     │         ┌───────────┐  │      │
     │         │ Auth      │  │      │
     │         │ Controller◄──┤      │
     │         └─────────┬─┘  │      │
     │                  │     │      │
     ├──────────────────┼─────┼──────┤
     │                  ▼     │      │
     │              ┌──────────┐     │
     │              │ Auth     │     │
     │              │ Service  ◄─────┤
     │              └──┬───────┘     │
     │                 │             │
     │        ┌────────┴────────┐    │
     │        ▼                 ▼    │
     │    ┌────────────┐   ┌────────────┐
     │    │ Role       │   │ Auth       │
     │    │ Seeder     │   │ Guard      │
     │    └────────────┘   └──┬─────────┘
     │                        │
     │    ┌───────────────────┘
     │    │
     └────▼──────────────────────────┐
          │                           │
          ▼                           ▼
    ┌──────────────────────────────────────┐
    │   DatabaseService (Drizzle ORM)     │
    └──────────────┬─────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │   PostgreSQL Database                │
    │  (users, roles, user_roles tables)  │
    └──────────────────────────────────────┘
```

## State Management

```
Request Lifecycle:
───────────────────

1. RECEIVED
   └─ HTTP request arrives with headers/body

2. PARSED
   └─ Framework parses headers, extracts Authorization

3. AUTHENTICATED
   └─ AuthGuard validates token
   └─ User data extracted from JWT

4. AUTHORIZED (RBAC)
   └─ AuthGuard checks user roles
   └─ Compares against route requirements

5. EXECUTED
   └─ Route handler executes with AuthUser context
   └─ Services access database
   └─ Business logic runs

6. RESPONDED
   └─ Response sent back to client
   └─ Status code (200/401/403) included
```

## Error Handling Flow

```
Request Processing
    │
    ├─ DTO Validation Error
    │   └─ 400 Bad Request (validation error message)
    │
    ├─ Authentication Error
    │   ├─ Missing header → 401 Unauthorized
    │   ├─ Invalid token → 401 Unauthorized
    │   └─ Expired token → 401 Unauthorized
    │
    ├─ Authorization Error (RBAC)
    │   └─ Missing role → 403 Forbidden
    │
    ├─ Business Logic Error
    │   ├─ User not found → 400 Bad Request
    │   ├─ Invalid credentials → 400 Bad Request
    │   └─ Email already exists → 400 Bad Request
    │
    └─ Server Error
        └─ 500 Internal Server Error (database issues, etc)
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: Input Validation                               │
│ - Email format validation (DTO)                         │
│ - Password length validation (DTO)                      │
│ - Required field validation (DTO)                       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ LAYER 2: Authentication                                 │
│ - Secure password hashing (bcrypt in production)        │
│ - JWT token generation with expiration                  │
│ - Token signature verification                          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ LAYER 3: Authorization (RBAC)                           │
│ - Role-based access control                             │
│ - Route protection                                      │
│ - Resource-level permissions                            │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ LAYER 4: Data Access                                    │
│ - SQL injection prevention (parameterized queries)      │
│ - Database encryption (at rest)                         │
│ - Connection pooling & limits                           │
└─────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
Single Instance
┌────────────────────────────┐
│ Node.js Process            │
├────────────────────────────┤
│ AuthService                │
│ UserService                │
│ Database Pool (20 connections)
└────────────────┬───────────┘
                 │
         ┌───────▼────────┐
         │   PostgreSQL   │
         └────────────────┘


Scaled Architecture
┌─────────────┬─────────────┬─────────────┐
│ Instance 1  │ Instance 2  │ Instance 3  │
├─────────────┼─────────────┼─────────────┤
│ Node.js     │ Node.js     │ Node.js     │
│ AuthService │ AuthService │ AuthService │
└─────┬───────┴──────┬──────┴──────┬──────┘
      │              │             │
      └──────┬───────┴─────┬──────┘
             │             │
      ┌──────▼─────────────▼──────┐
      │   Load Balancer           │
      │  (SSL Termination)        │
      └──────┬──────────────────────┘
             │
      ┌──────▼───────────────┐
      │  Shared PostgreSQL   │
      │  with replication    │
      └──────────────────────┘
```

## Technology Stack

```
Frontend
    ↓ (HTTP + JWT)
┌──────────────────────┐
│ WynkJS Framework     │──► Built-in HTTP handling
├──────────────────────┤
│ TypeScript           │──► Type safety
├──────────────────────┤
│ Drizzle ORM          │──► Type-safe database
├──────────────────────┤
│ PostgreSQL Driver    │──► Database connection
└──────────────────────┘
    ↓
┌──────────────────────┐
│ PostgreSQL Database  │──► User data + roles
└──────────────────────┘

Optional (Production)
├─ bcrypt (password hashing)
├─ jsonwebtoken (JWT handling)
├─ express-rate-limit (rate limiting)
└─ helmet (security headers)
```

---

**Diagram Version:** 1.0
**Last Updated:** December 2025
