# WynkJS API Reference

Complete API reference for WynkJS framework.

## Table of Contents

- [Core](#core)
  - [WynkFactory](#wynkfactory)
  - [WynkFramework](#wynkframework)
- [Decorators](#decorators)
  - [Class Decorators](#class-decorators)
  - [Method Decorators](#method-decorators)
  - [Parameter Decorators](#parameter-decorators)
- [DTO](#dto)
  - [DTO Builders](#dto-builders)
  - [CommonDTO](#commondto)
- [Exception Handling](#exception-handling)
  - [Exception Classes](#exception-classes)
  - [Exception Filters](#exception-filters)
  - [Formatters](#formatters)
- [Middleware](#middleware)
  - [Guards](#guards)
  - [Interceptors](#interceptors)
  - [Pipes](#pipes)
- [Testing](#testing)
- [Types](#types)

---

## Core

### WynkFactory

Static factory class for creating WynkJS applications.

#### `WynkFactory.create(options)`

Creates a new WynkJS application instance.

**Parameters:**

```typescript
interface CreateOptions {
  controllers: Array<new (...args: any[]) => any>;  // Required
  providers?: Array<new (...args: any[]) => any>;   // Optional
  cors?: boolean | CorsOptions;                      // Optional
  validationErrorFormatter?: ErrorFormatter;         // Optional
  globalPrefix?: string;                             // Optional
}
```

**Returns:** `WynkFramework`

**Example:**

```typescript
import { WynkFactory } from "wynkjs";

const app = WynkFactory.create({
  controllers: [UserController, ProductController],
  providers: [DatabaseService, EmailService],
  cors: true,
  validationErrorFormatter: new DetailedErrorFormatter(),
  globalPrefix: "/api/v1",
});
```

---

### WynkFramework

Main application class.

#### `app.listen(port, callback?)`

Starts the HTTP server.

**Parameters:**
- `port: number | string` - Port number to listen on
- `callback?: () => void` - Optional callback function

**Returns:** `Promise<void>`

**Example:**

```typescript
await app.listen(3000);
console.log("Server running on port 3000");
```

#### `app.handle(request)`

Handles an HTTP request (useful for testing).

**Parameters:**
- `request: Request` - Standard Request object

**Returns:** `Promise<Response>`

**Example:**

```typescript
const response = await app.handle(new Request("http://localhost:3000/users"));
```

#### `app.useGlobalGuards(...guards)`

Registers global guards.

**Parameters:**
- `guards: Function[]` - Array of guard middleware functions

**Returns:** `WynkFramework`

**Example:**

```typescript
app.useGlobalGuards(authGuard, rateLimitGuard);
```

#### `app.useGlobalInterceptors(...interceptors)`

Registers global interceptors.

**Parameters:**
- `interceptors: WynkInterceptor[]` - Array of interceptor instances

**Returns:** `WynkFramework`

**Example:**

```typescript
app.useGlobalInterceptors(loggingInterceptor, transformInterceptor);
```

#### `app.useGlobalPipes(...pipes)`

Registers global pipes.

**Parameters:**
- `pipes: WynkPipeTransform[]` - Array of pipe instances

**Returns:** `WynkFramework`

**Example:**

```typescript
app.useGlobalPipes(validationPipe);
```

#### `app.useGlobalFilters(...filters)`

Registers global exception filters.

**Parameters:**
- `filters: WynkExceptionFilter[]` - Array of filter instances

**Returns:** `WynkFramework`

**Example:**

```typescript
app.useGlobalFilters(
  new DatabaseExceptionFilter(),
  new NotFoundExceptionFilter(),
  new GlobalExceptionFilter()
);
```

---

## Decorators

### Class Decorators

#### `@Controller(path?)`

Marks a class as a controller.

**Parameters:**
- `path?: string` - Base path for all routes in this controller (default: "/")

**Example:**

```typescript
@Controller("/users")
export class UserController {
  // Routes will be prefixed with /users
}
```

#### `@Injectable()`

Marks a class as injectable for dependency injection.

**Example:**

```typescript
@Injectable()
export class UserService {
  // Can be injected into other classes
}
```

#### `@Catch(...exceptions)`

Decorator for exception filters.

**Parameters:**
- `exceptions?: HttpException[]` - Specific exceptions to catch (empty = catch all)

**Example:**

```typescript
@Catch(NotFoundException, BadRequestException)
export class HttpExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    // Handle exception
  }
}
```

---

### Method Decorators

#### HTTP Method Decorators

All HTTP method decorators support both string and object formats.

##### `@Get(options)`

Defines a GET route.

**String format:**
```typescript
@Get("/")
@Get("/:id")
@Get("/search")
```

**Object format:**
```typescript
@Get({
  path?: string;
  params?: TSchema;   // Route parameter validation
  query?: TSchema;    // Query parameter validation
})
```

**Example:**

```typescript
@Get("/")
async findAll() { }

@Get({ path: "/:id", params: UserIdDto })
async findOne(@Param("id") id: string) { }

@Get({ path: "/search", query: SearchQueryDto })
async search(@Query() query: SearchQuery) { }
```

##### `@Post(options)`

Defines a POST route.

**Object format:**
```typescript
@Post({
  path?: string;
  body?: TSchema;     // Request body validation
  params?: TSchema;   // Route parameter validation
  query?: TSchema;    // Query parameter validation
})
```

**Example:**

```typescript
@Post({ path: "/", body: CreateUserDTO })
async create(@Body() data: CreateUserType) { }

@Post({
  path: "/:id/comments",
  body: CreateCommentDTO,
  params: UserIdDto
})
async createComment(
  @Param("id") id: string,
  @Body() comment: CreateCommentType
) { }
```

##### `@Put(options)` | `@Patch(options)`

Defines PUT/PATCH routes (same format as @Post).

**Example:**

```typescript
@Put({ path: "/:id", body: UpdateUserDTO, params: UserIdDto })
async update(@Param("id") id: string, @Body() data: UpdateUserType) { }

@Patch({ path: "/:id", body: PartialUpdateUserDTO, params: UserIdDto })
async partialUpdate(@Param("id") id: string, @Body() data: PartialUpdateUserType) { }
```

##### `@Delete(options)`

Defines a DELETE route.

**Object format:**
```typescript
@Delete({
  path?: string;
  params?: TSchema;   // Route parameter validation
  query?: TSchema;    // Query parameter validation
})
```

**Example:**

```typescript
@Delete({ path: "/:id", params: UserIdDto })
async remove(@Param("id") id: string) { }
```

##### `@Options()` | `@Head()`

Defines OPTIONS or HEAD routes.

**Example:**

```typescript
@Options("/")
async options() { }

@Head("/")
async head() { }
```

#### Other Method Decorators

##### `@HttpCode(statusCode)`

Sets the HTTP status code for the response.

**Parameters:**
- `statusCode: number` - HTTP status code (e.g., 201, 204)

**Example:**

```typescript
@Post("/")
@HttpCode(201)
async create(@Body() data: any) { }

@Delete("/:id")
@HttpCode(204)
async remove(@Param("id") id: string) { }
```

##### `@Header(name, value)`

Sets a response header.

**Parameters:**
- `name: string` - Header name
- `value: string` - Header value

**Example:**

```typescript
@Get("/")
@Header("Cache-Control", "max-age=3600")
@Header("X-Custom-Header", "value")
async getData() { }
```

##### `@Redirect(url, statusCode?)`

Redirects the request.

**Parameters:**
- `url: string` - Redirect URL
- `statusCode?: number` - HTTP redirect status (default: 302)

**Example:**

```typescript
@Get("/old-route")
@Redirect("/new-route", 301)
async oldRoute() { }

@Get("/external")
@Redirect("https://example.com")
async external() { }
```

##### `@Use(...middleware)`

Applies middleware to a route or controller.

**Parameters:**
- `middleware: Function[]` - Middleware functions

**Example:**

```typescript
@Get("/protected")
@Use(authGuard, rateLimitGuard)
async getProtectedData() { }

@Controller("/admin")
@Use(authGuard, adminGuard)
export class AdminController { }
```

##### `@UseGuards(...guards)`

Applies guards to a route or controller.

**Parameters:**
- `guards: Function[]` - Guard functions

**Example:**

```typescript
@Get("/protected")
@UseGuards(authGuard)
async getData() { }

@Controller("/admin")
@UseGuards(authGuard, rolesGuard(["admin"]))
export class AdminController { }
```

##### `@UseInterceptors(...interceptors)`

Applies interceptors to a route or controller.

**Parameters:**
- `interceptors: WynkInterceptor[]` - Interceptor instances

**Example:**

```typescript
@Get("/data")
@UseInterceptors(loggingInterceptor, cacheInterceptor)
async getData() { }
```

##### `@UsePipes(...pipes)`

Applies pipes to a route or controller.

**Parameters:**
- `pipes: WynkPipeTransform[]` - Pipe instances

**Example:**

```typescript
@Post("/")
@UsePipes(validationPipe, transformPipe)
async create(@Body() data: any) { }
```

##### `@UseFilters(...filters)`

Applies exception filters to a route or controller.

**Parameters:**
- `filters: WynkExceptionFilter[]` - Filter instances

**Example:**

```typescript
@Post("/")
@UseFilters(DatabaseExceptionFilter)
async create(@Body() data: any) { }
```

---

### Parameter Decorators

#### `@Body(property?, ...pipes)`

Extracts the request body.

**Parameters:**
- `property?: string` - Optional property to extract from body
- `pipes?: WynkPipeTransform[]` - Optional pipes for transformation

**Returns:** Full body object or specific property

**Example:**

```typescript
async create(@Body() body: CreateUserType) { }
async update(@Body("email") email: string) { }
async create(@Body(validationPipe) body: CreateUserType) { }
```

#### `@Param(property?, ...pipes)`

Extracts route parameters.

**Parameters:**
- `property?: string` - Optional parameter name
- `pipes?: WynkPipeTransform[]` - Optional pipes

**Returns:** All params object or specific param

**Example:**

```typescript
async findOne(@Param("id") id: string) { }
async complex(@Param() params: { id: string; postId: string }) { }
async findOne(@Param("id", parseIntPipe) id: number) { }
```

#### `@Query(property?, ...pipes)`

Extracts query parameters.

**Parameters:**
- `property?: string` - Optional query parameter name
- `pipes?: WynkPipeTransform[]` - Optional pipes

**Returns:** All query object or specific parameter

**Example:**

```typescript
async search(@Query() query: SearchQueryType) { }
async search(@Query("page") page: number) { }
async search(@Query("sort", trimPipe) sort: string) { }
```

#### `@Headers(property?)`

Extracts request headers.

**Parameters:**
- `property?: string` - Optional header name

**Returns:** All headers or specific header

**Example:**

```typescript
async handle(@Headers() headers: Record<string, string>) { }
async handle(@Headers("authorization") auth: string) { }
async handle(@Headers("user-agent") userAgent: string) { }
```

#### `@Req()` | `@Request()`

Injects the full request object.

**Returns:** Elysia Request object

**Example:**

```typescript
async handle(@Req() request: Request) {
  console.log(request.method, request.url);
}
```

#### `@Res()` | `@Response()`

Injects the response object.

**Returns:** Elysia Response object

**Example:**

```typescript
async handle(@Res() response: Response) {
  // Manipulate response
}
```

#### `@Context()`

Injects the full WynkJS execution context.

**Returns:** ExecutionContext

**Example:**

```typescript
async handle(@Context() context: ExecutionContext) {
  const request = context.getRequest();
  const response = context.getResponse();
}
```

#### `@User(property?)`

Extracts the current user (set by authentication guard).

**Parameters:**
- `property?: string` - Optional user property

**Returns:** User object or specific property

**Example:**

```typescript
async getProfile(@User() user: UserType) { }
async getData(@User("id") userId: string) { }
async checkRole(@User("role") role: string) { }
```

#### `@UploadedFile()`

Extracts an uploaded file (single file upload).

**Returns:** File object

**Example:**

```typescript
@Post({ path: "/upload" })
async uploadFile(@UploadedFile() file: File) {
  console.log(file.name, file.size);
}
```

#### `@UploadedFiles()`

Extracts uploaded files (multiple files).

**Returns:** Array of File objects

**Example:**

```typescript
@Post({ path: "/upload-multiple" })
async uploadFiles(@UploadedFiles() files: File[]) {
  console.log(`Uploaded ${files.length} files`);
}
```

#### `@Ip()`

Extracts the client IP address.

**Returns:** IP address string

**Example:**

```typescript
async handle(@Ip() ip: string) {
  console.log(`Request from ${ip}`);
}
```

#### `@Session(property?)`

Extracts session data.

**Parameters:**
- `property?: string` - Optional session property

**Returns:** Session object or specific property

**Example:**

```typescript
async handle(@Session() session: any) { }
async handle(@Session("userId") userId: string) { }
```

#### `@HostParam(property)`

Extracts subdomain or host parameters.

**Parameters:**
- `property: string` - Host parameter name

**Returns:** Host parameter value

**Example:**

```typescript
// For URL: https://api.example.com
async handle(@HostParam("subdomain") subdomain: string) {
  // subdomain = "api"
}
```

---

## DTO

### DTO Builders

WynkJS uses TypeBox for schema validation.

#### `DTO.Object(properties, options?)`

Creates an object schema.

**Example:**

```typescript
const UserDTO = DTO.Object({
  name: DTO.String(),
  age: DTO.Number()
});
```

#### `DTO.Strict(properties, options?)`

Creates an object schema that strips additional properties.

**Example:**

```typescript
const UserDTO = DTO.Strict({
  name: DTO.String(),
  email: DTO.String()
});
// Extra properties will be removed
```

#### `DTO.String(options?)`

Creates a string schema.

**Options:**
```typescript
{
  minLength?: number;
  maxLength?: number;
  pattern?: string;        // Regex pattern
  format?: string;         // "email" | "url" | "uuid" | etc.
  error?: string;          // Custom error message
  description?: string;
  default?: string;
}
```

**Example:**

```typescript
DTO.String({ minLength: 2, maxLength: 50 })
DTO.String({ format: "email", error: "Invalid email" })
DTO.String({ pattern: "^[A-Z]{3}$" })
```

#### `DTO.Number(options?)`

Creates a number schema.

**Options:**
```typescript
{
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  error?: string;
  description?: string;
  default?: number;
}
```

**Example:**

```typescript
DTO.Number({ minimum: 0, maximum: 100 })
DTO.Number({ minimum: 18, error: "Must be 18 or older" })
```

#### `DTO.Boolean(options?)`

Creates a boolean schema.

**Example:**

```typescript
DTO.Boolean()
DTO.Boolean({ default: false })
```

#### `DTO.Array(items, options?)`

Creates an array schema.

**Example:**

```typescript
DTO.Array(DTO.String())
DTO.Array(DTO.Object({ name: DTO.String() }))
DTO.Array(DTO.Number(), { minItems: 1, maxItems: 10 })
```

#### `DTO.Optional(schema)`

Makes a schema optional.

**Example:**

```typescript
const UserDTO = DTO.Strict({
  name: DTO.String(),
  age: DTO.Optional(DTO.Number())  // Optional field
});
```

#### `DTO.Nullable(schema)`

Makes a schema nullable.

**Example:**

```typescript
const UserDTO = DTO.Strict({
  name: DTO.String(),
  middleName: DTO.Nullable(DTO.String())  // Can be null
});
```

#### `DTO.Union(schemas)`

Creates a union type (one of multiple types).

**Example:**

```typescript
DTO.Union([DTO.String(), DTO.Number()])
DTO.Union([
  DTO.Object({ type: DTO.Literal("email"), email: DTO.String() }),
  DTO.Object({ type: DTO.Literal("phone"), phone: DTO.String() })
])
```

#### `DTO.Literal(value)`

Creates a literal value schema.

**Example:**

```typescript
DTO.Literal("admin")
DTO.Literal(42)
DTO.Union([DTO.Literal("admin"), DTO.Literal("user"), DTO.Literal("guest")])
```

#### `DTO.Enum(values)`

Creates an enum schema.

**Example:**

```typescript
DTO.Enum(["active", "inactive", "pending"])
```

---

### CommonDTO

Pre-built common validation patterns.

#### `CommonDTO.Email(options?)`

Email validation.

**Example:**

```typescript
CommonDTO.Email({ error: "Invalid email address" })
```

#### `CommonDTO.UUID(options?)`

UUID validation.

**Example:**

```typescript
CommonDTO.UUID()
```

#### `CommonDTO.Name(options?)`

Name validation (2-50 characters).

**Example:**

```typescript
CommonDTO.Name({ error: "Invalid name format" })
```

#### `CommonDTO.Password(options?)`

Password validation (minimum 6 characters).

**Example:**

```typescript
CommonDTO.Password({ minLength: 8, error: "Password too weak" })
```

#### `CommonDTO.PhoneIN(options?)`

Indian phone number validation.

**Example:**

```typescript
CommonDTO.PhoneIN({ error: "Invalid phone number" })
```

#### `CommonDTO.URL(options?)`

URL validation.

**Example:**

```typescript
CommonDTO.URL()
```

---

## Exception Handling

### Exception Classes

All exception classes extend `HttpException`.

#### `HttpException(message, statusCode)`

Base exception class.

**Example:**

```typescript
throw new HttpException("Custom error", 418);
```

#### Common Exception Classes

| Exception | Status Code | Use Case |
|-----------|------------|----------|
| `BadRequestException` | 400 | Invalid input |
| `UnauthorizedException` | 401 | Authentication required |
| `ForbiddenException` | 403 | Insufficient permissions |
| `NotFoundException` | 404 | Resource not found |
| `MethodNotAllowedException` | 405 | HTTP method not allowed |
| `NotAcceptableException` | 406 | Content type not acceptable |
| `RequestTimeoutException` | 408 | Request timeout |
| `ConflictException` | 409 | Resource conflict |
| `GoneException` | 410 | Resource no longer available |
| `PayloadTooLargeException` | 413 | Request payload too large |
| `UnsupportedMediaTypeException` | 415 | Unsupported media type |
| `UnprocessableEntityException` | 422 | Validation failed |
| `TooManyRequestsException` | 429 | Rate limit exceeded |
| `InternalServerErrorException` | 500 | Server error |
| `NotImplementedException` | 501 | Feature not implemented |
| `BadGatewayException` | 502 | Bad gateway |
| `ServiceUnavailableException` | 503 | Service unavailable |
| `GatewayTimeoutException` | 504 | Gateway timeout |

**Example:**

```typescript
if (!user) {
  throw new NotFoundException("User not found");
}

if (!isAuthorized) {
  throw new ForbiddenException("Access denied");
}

if (emailExists) {
  throw new ConflictException("Email already registered");
}
```

---

### Exception Filters

#### Global Exception Filters

##### `DatabaseExceptionFilter`

Catches database errors and converts them to HTTP exceptions.

**Example:**

```typescript
app.useGlobalFilters(new DatabaseExceptionFilter());
```

##### `NotFoundExceptionFilter`

Smart 404 filter that checks response data.

**Example:**

```typescript
app.useGlobalFilters(new NotFoundExceptionFilter());
```

##### `FileUploadExceptionFilter`

Handles file upload errors.

**Example:**

```typescript
app.useGlobalFilters(new FileUploadExceptionFilter());
```

##### `GlobalExceptionFilter`

Catch-all filter for unhandled exceptions.

**Example:**

```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

#### Custom Exception Filter

**Interface:**

```typescript
interface WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext): any;
}
```

**Example:**

```typescript
@Catch()
export class CustomExceptionFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const request = context.getRequest();

    return {
      statusCode: exception.statusCode || 500,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url
    };
  }
}
```

---

### Formatters

Formatters handle validation error formatting.

#### `FormatErrorFormatter`

Object-based format.

**Output:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email address"],
    "age": ["Must be at least 18"]
  }
}
```

#### `SimpleErrorFormatter`

Simple array format.

**Output:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Invalid email address", "Must be at least 18"]
}
```

#### `DetailedErrorFormatter`

Detailed format with field information.

**Output:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address",
      "value": "invalid-email"
    },
    {
      "field": "age",
      "message": "Must be at least 18",
      "value": 15
    }
  ]
}
```

**Usage:**

```typescript
const app = WynkFactory.create({
  controllers: [UserController],
  validationErrorFormatter: new DetailedErrorFormatter()
});
```

---

## Middleware

### Guards

Guards determine whether a request should be processed.

**Example:**

```typescript
const authGuard = async (ctx: any, next: Function) => {
  const token = ctx.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    ctx.set.status = 401;
    return { error: "Unauthorized" };
  }

  try {
    const user = await verifyToken(token);
    ctx.user = user;
    return next();
  } catch (error) {
    ctx.set.status = 401;
    return { error: "Invalid token" };
  }
};
```

---

### Interceptors

Interceptors transform requests/responses.

**Interface:**

```typescript
interface WynkInterceptor {
  intercept(context: ExecutionContext, next: () => Promise<any>): Promise<any>;
}
```

**Example:**

```typescript
const loggingInterceptor = async (ctx: any, next: Function) => {
  const start = Date.now();
  console.log(`→ ${ctx.request.method} ${ctx.path}`);

  const result = await next();

  console.log(`← ${ctx.request.method} ${ctx.path} - ${Date.now() - start}ms`);
  return result;
};
```

---

### Pipes

Pipes validate and transform input data.

**Interface:**

```typescript
interface WynkPipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any | Promise<any>;
}
```

**Example:**

```typescript
const parseIntPipe = async (ctx: any, next: Function) => {
  const { id } = ctx.params;
  ctx.params.id = parseInt(id, 10);

  if (isNaN(ctx.params.id)) {
    ctx.set.status = 400;
    return { error: "Invalid ID" };
  }

  return next();
};
```

---

## Testing

### Test Module

#### `Test.createTestingModule(options)`

Creates an isolated testing module.

**Parameters:**

```typescript
{
  controllers?: Array<new (...args: any[]) => any>;
  providers?: Array<new (...args: any[]) => any>;
}
```

**Returns:** Testing module with `compile()` method

**Example:**

```typescript
const module = await Test.createTestingModule({
  controllers: [UserController],
  providers: [UserService, EmailService]
}).compile();

const controller = module.get<UserController>(UserController);
const service = module.get<UserService>(UserService);
```

### MockFactory

#### `MockFactory.createMock<T>()`

Creates a mock object.

**Example:**

```typescript
const mockService = MockFactory.createMock<UserService>();
```

#### `MockFactory.createSpy()`

Creates a spy function.

**Example:**

```typescript
const spy = MockFactory.createSpy();
```

---

## Types

### CorsOptions

```typescript
interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  allowPrivateNetwork?: boolean;
}
```

### ExecutionContext

```typescript
interface ExecutionContext {
  getRequest(): Request;
  getResponse(): Response;
  getHandler(): Function;
  getClass(): any;
}
```

### ArgumentMetadata

```typescript
interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<any>;
  data?: string;
}
```

---

## Version

Current API version: **1.0.6**

For changelog and migration guides, see:
- [CHANGELOG.md](./CHANGELOG.md)
- [MIGRATION.md](./MIGRATION.md)

---

## Related Documentation

- [Main README](./README.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Middleware Guide](./MIDDLEWARE_GUIDE.md)
- [CORS Guide](./CORS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Built with ❤️ by the WynkJS Team**
