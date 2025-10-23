# Validation Fix Guide

## Issues Found

### 1. ✅ FIXED: Get/Delete decorators don't accept RouteOptions object

**Problem**: `@Get()` only accepted string path, not `{ path, params, query }` object.

**Solution**: Updated all HTTP decorators to accept `string | RouteOptions`:

- `Get(pathOrOptions?: string | RouteOptions)`
- `Delete(pathOrOptions?: string | RouteOptions)`
- `Options(pathOrOptions?: string | RouteOptions)`
- `Head(pathOrOptions?: string | RouteOptions)`

Now works like POST/PUT/PATCH.

### 2. DTO Schema Must Match Route Parameters

**Problem**: You defined:

```typescript
// Route with :id1 and :id2
@Post({ path: "/:id1/:id2", params: UserIdDto })

// But UserIdDto expects { id: string }
export const UserIdDto = DTO.Object({
  id: DTO.String({ minLength: 2, maxLength: 50 }),
});
```

**Solution**: Schema must match the EXACT param names in the route:

```typescript
// For route /:id1/:id2
export const MultiParamDto = DTO.Object({
  id1: DTO.String({ minLength: 2, maxLength: 50 }),
  id2: DTO.String({ minLength: 2, maxLength: 50 }),
});

@Post({
  path: "/:id1/:id2",
  params: MultiParamDto,  // ✅ Matches route params
  body: CreateUserDTO,
  query: UserQueryDto,
})
```

### 3. Query Strings Are Validated by Elysia

**How it works**:

```typescript
// Define query schema
export const UserQueryDto = DTO.Object({
  includePosts: DTO.Boolean({ default: false }),
  includeComments: DTO.Optional(DTO.Boolean({ default: false })),
});

// Use in decorator
@Get({
  path: "/:id",
  params: UserIdDto,
  query: UserQueryDto  // Elysia validates ?includePosts=true&includeComments=false
})
async findOne(
  @Param("id") id: string,      // Extract specific param
  @Query() query: UserQueryType  // Get validated query object
) {
  // query = { includePosts: true, includeComments: false }
}
```

**Elysia automatically**:

- Parses query strings from URL
- Converts types (string "true" → boolean true)
- Validates against schema
- Returns 400 if validation fails

### 4. Understanding @Param() Decorator

```typescript
// Single param by name
@Param("id") id: string
// Returns: ctx.params.id → "value123"

// Single param by name (typed as object)
@Param("id") params: { id: string }
// Returns: ctx.params.id → "value123" (WRONG! Should be string)

// All params
@Param() params: { id1: string, id2: string }
// Returns: ctx.params → { id1: "val1", id2: "val2" }
```

**Rule**:

- `@Param("specificName")` → returns the VALUE of that param (string)
- `@Param()` (no name) → returns the full params object

## Corrected Example

```typescript
// user.dto.ts
export const CreateUserDTO = DTO.Object({
  email: CommonDTO.Email({ description: "User email address" }),
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 50 })),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface CreateUserType {
  email: string;
  name?: string;
  age?: number;
}

// For route /:id1/:id2
export const MultiParamDto = DTO.Object({
  id1: DTO.String({ minLength: 2 }),
  id2: DTO.String({ minLength: 2 }),
});

export const UserQueryDto = DTO.Object({
  includePosts: DTO.Boolean({ default: false }),
  includeComments: DTO.Optional(DTO.Boolean()),
});

export type UserQueryType = {
  includePosts: boolean;
  includeComments?: boolean;
};

// user.controller.ts
import { Controller, Post, Get, Body, Param, Query, Injectable } from "wynkjs";
import {
  CreateUserDTO,
  CreateUserType,
  MultiParamDto,
  UserQueryDto,
  UserQueryType,
} from "./user.dto";

@Injectable()
@Controller("/users")
export class UserController {
  // POST with multiple params
  @Post({
    path: "/:id1/:id2",
    body: CreateUserDTO,
    params: MultiParamDto, // ✅ Matches :id1 and :id2
    query: UserQueryDto,
  })
  async create(
    @Body() body: CreateUserType,
    @Param("id1") id1: string, // ✅ Extract id1 value
    @Param("id2") id2: string, // ✅ Extract id2 value
    @Query() query: UserQueryType // ✅ Get full query object
  ) {
    return {
      message: "User created",
      data: body,
      params: { id1, id2 }, // ✅ Both params available
      query, // ✅ Query parsed and validated
    };
  }

  // GET with single param
  @Get({
    path: "/:id",
    params: DTO.Object({ id: DTO.String() }),
    query: UserQueryDto,
  })
  async findOne(
    @Param("id") id: string, // ✅ Extract id value
    @Query() query: UserQueryType
  ) {
    return {
      user: { id, name: "Alice" },
      query,
    };
  }
}
```

## Testing

```bash
# POST with multiple params and query
curl -X POST "http://localhost:3000/users/abc/xyz?includePosts=true" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"John"}'

# Expected response:
{
  "message": "User created",
  "data": { "email": "test@example.com", "name": "John" },
  "params": { "id1": "abc", "id2": "xyz" },
  "query": { "includePosts": true, "includeComments": false }
}

# GET with single param and query
curl "http://localhost:3000/users/123?includePosts=false&includeComments=true"

# Expected response:
{
  "user": { "id": "123", "name": "Alice" },
  "query": { "includePosts": false, "includeComments": true }
}
```

## Summary

✅ **Fixed**: All HTTP decorators now accept `RouteOptions` object
✅ **Clarified**: Param DTO must match route parameter names exactly
✅ **Clarified**: Query validation works via Elysia (converts types automatically)
✅ **Clarified**: `@Param("name")` extracts value, `@Param()` extracts full object

**No core changes needed for params/query** - they work correctly. The issue was DTO schema mismatch.
