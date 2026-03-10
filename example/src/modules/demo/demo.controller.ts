import {
  Controller,
  Get,
  Post,
  Delete,
  Head,
  Options,
  Redirect,
  Sse,
  Use,
  Body,
  Param,
  Query,
  Headers,
  User,
  Context,
  Ip,
  Session,
  HostParam,
  UploadedFile,
  UploadedFiles,
  Req,
  Injectable,
  SetMetadata,
  Reflector,
  applyDecorators,
  createParamDecorator,
  UseGuards,
  UseInterceptors,
  UsePipes,
  HttpCode,
  HttpStatus,
  Header,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  schemaRegistry,
  type WynkRequest,
  DTO,
} from "wynkjs";
import { DemoService } from "./demo.service";
import { DemoLoggingInterceptor } from "./demo.interceptor";
import { DemoTransformPipe } from "./demo.pipe";
import { DemoRolesGuard } from "./demo.guard";

const ROLES_KEY = "demo_roles";

const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

const AdminOnly = () =>
  applyDecorators(Roles("admin"), UseGuards(DemoRolesGuard));

const CurrentUser = createParamDecorator(
  (data: unknown, req: WynkRequest) => {
    return (req as any).user ?? { id: "anonymous", roles: ["guest"] };
  }
);

const AddItemBodyDTO = DTO.Strict({
  name: DTO.String({ minLength: 1, maxLength: 100 }),
});

const loggingMiddleware = async (ctx: any, next: Function) => {
  const start = Date.now();
  const result = await next();
  console.log(
    `[demo middleware] ${ctx.request?.method} ${ctx.path} — ${Date.now() - start}ms`
  );
  return result;
};

@Injectable()
@Controller("/demo")
@UseInterceptors(DemoLoggingInterceptor)
export class DemoController {
  constructor(
    private demoService: DemoService,
    private reflector: Reflector
  ) {}

  @Get("/items")
  getItems() {
    return {
      items: this.demoService.getItems(),
      feature: "basic GET with DemoLoggingInterceptor applied at controller level",
    };
  }

  @Post({ path: "/items", body: AddItemBodyDTO })
  @HttpCode(HttpStatus.CREATED)
  @Header("X-Created-By", "DemoController")
  addItem(@Body() body: { name: string }) {
    const items = this.demoService.addItem(body.name);
    return {
      message: "Item added",
      items,
      feature: "@HttpCode(HttpStatus.CREATED) + @Header decorator",
    };
  }

  @Delete("/items/:name")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteItem(@Param("name") name: string) {
    this.demoService.removeItem(name);
    return null;
  }

  @Get("/transform/:slug")
  @UsePipes(DemoTransformPipe)
  getBySlug(@Param("slug") slug: string) {
    return {
      transformed: slug,
      feature: "@UsePipes — DemoTransformPipe already ran; slug is the transformed value",
    };
  }

  @Get("/admin-only")
  @AdminOnly()
  getAdminData(@CurrentUser() user: any) {
    return {
      message: "Admin-only data",
      user,
      feature: "applyDecorators(@Roles + @UseGuards) + createParamDecorator(@CurrentUser)",
    };
  }

  @Get("/current-user")
  getCurrentUser(@CurrentUser() user: any, @Req() req: WynkRequest) {
    return {
      user,
      headers: { authorization: req.headers?.get?.("authorization") ?? null },
      feature: "createParamDecorator(@CurrentUser) extracts user from request",
    };
  }

  @Get("/reflector-demo")
  @Roles("admin", "moderator")
  reflectorDemo(@Req() req: WynkRequest) {
    const roles = this.reflector.get<string[]>(
      ROLES_KEY,
      DemoController.prototype.reflectorDemo
    );
    return {
      rolesOnThisRoute: roles,
      feature: "Reflector.get() reads metadata set by @SetMetadata",
    };
  }

  @Get("/http-status-demo")
  @HttpCode(HttpStatus.ACCEPTED)
  httpStatusDemo() {
    return {
      status: HttpStatus.ACCEPTED,
      name: "ACCEPTED",
      feature: "@HttpCode(HttpStatus.ACCEPTED) — returns 202 status",
    };
  }

  @Get("/exceptions-demo/:type")
  exceptionsDemo(@Param("type") type: string) {
    if (type === "notfound") throw new NotFoundException("Resource not found (demo)");
    if (type === "forbidden") throw new ForbiddenException("Access denied (demo)");
    if (type === "conflict") throw new ConflictException("Resource already exists (demo)");
    if (type === "unprocessable")
      throw new UnprocessableEntityException("Cannot process entity (demo)");
    return {
      type,
      feature:
        "Exception classes — try 'notfound', 'forbidden', 'conflict', or 'unprocessable' as :type",
    };
  }

  @Get("/headers-demo")
  headersDemo(
    @Headers("user-agent") userAgent: string,
    @Headers("accept") accept: string
  ) {
    return {
      userAgent,
      accept,
      feature: "@Headers('key') — extracts a single request header by name",
    };
  }

  @Get("/headers-all")
  headersAll(@Headers() allHeaders: Record<string, string>) {
    return {
      headers: allHeaders,
      feature: "@Headers() with no argument — returns all request headers",
    };
  }

  @Get("/user-demo")
  userDemo(@User() user: any) {
    return {
      user: user ?? null,
      feature:
        "@User() — extracts the user object attached to the request context (populated by auth middleware)",
    };
  }

  @Get("/context-demo")
  contextDemo(@Context() ctx: any) {
    return {
      path: ctx?.path ?? null,
      method: ctx?.request?.method ?? null,
      feature: "@Context() — injects the full Elysia request context object",
    };
  }

  @Get("/ip-demo")
  ipDemo(@Ip() ip: string) {
    return {
      ip,
      feature: "@Ip() — extracts client IP from x-forwarded-for header",
    };
  }

  @Get("/session-demo")
  sessionDemo(@Session() session: any) {
    return {
      session: session ?? null,
      feature: "@Session() — extracts the entire session object from the request context",
    };
  }

  @Get("/session-prop-demo")
  sessionPropDemo(@Session("userId") userId: any) {
    return {
      userId: userId ?? null,
      feature: "@Session('userId') — extracts a specific property from the session object",
    };
  }

  @Get("/host-param-demo")
  hostParamDemo(@HostParam("host") host: string) {
    return {
      host: host ?? null,
      feature: "@HostParam('host') — extracts host-level parameter from the request context",
    };
  }

  @Post("/upload-single")
  uploadSingle(@UploadedFile() file: any) {
    return {
      fileName: file?.name ?? null,
      fileSize: file?.size ?? null,
      feature: "@UploadedFile() — injects a single uploaded file from multipart form data",
    };
  }

  @Post("/upload-multiple")
  uploadMultiple(@UploadedFiles() files: any[]) {
    const names = Array.isArray(files) ? files.map((f) => f?.name) : [];
    return {
      fileCount: names.length,
      fileNames: names,
      feature: "@UploadedFiles() — injects all uploaded files from multipart form data",
    };
  }

  @Get("/query-demo")
  queryDemo(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query() all: Record<string, string>
  ) {
    return {
      page: page ?? "1",
      limit: limit ?? "10",
      allQueryParams: all,
      feature: "@Query('key') for single value, @Query() for all query params",
    };
  }

  @Head("/head-demo")
  headDemo() {
    return null;
  }

  @Options("/options-demo")
  optionsDemo() {
    return {
      allowed: ["GET", "POST", "DELETE", "HEAD", "OPTIONS"],
      feature: "@Options() — handles HTTP OPTIONS requests (used for CORS preflight)",
    };
  }

  @Get("/redirect-demo")
  @Redirect("/api/demo/items", 302)
  redirectDemo() {
    return null;
  }

  @Sse("/events")
  sseDemo() {
    return {
      feature:
        "@Sse() — marks route as a Server-Sent Events endpoint (GET + sse metadata). Caller must set Content-Type: text/event-stream and stream manually.",
    };
  }

  @Get("/middleware-demo")
  @Use(loggingMiddleware)
  middlewareDemo() {
    return {
      feature: "@Use(fn) — applies raw Elysia-compatible middleware to a single route",
    };
  }

  @Get("/schema-registry-demo")
  schemaRegistryDemo() {
    const key = schemaRegistry.getSchemaKeyForRoute(
      "/demo/schema-registry-demo",
      "GET"
    );
    const errorMsg = key
      ? (schemaRegistry.getErrorMessage(key, "name") ?? null)
      : null;
    return {
      routeSchemaKey: key ?? null,
      sampleErrorMessage: errorMsg,
      feature:
        "schemaRegistry — getSchemaKeyForRoute, getErrorMessage utilities for introspecting registered route schemas",
    };
  }

  @Get("/http-status-values")
  httpStatusValues() {
    return {
      OK: HttpStatus.OK,
      CREATED: HttpStatus.CREATED,
      ACCEPTED: HttpStatus.ACCEPTED,
      NO_CONTENT: HttpStatus.NO_CONTENT,
      BAD_REQUEST: HttpStatus.BAD_REQUEST,
      UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
      FORBIDDEN: HttpStatus.FORBIDDEN,
      NOT_FOUND: HttpStatus.NOT_FOUND,
      CONFLICT: HttpStatus.CONFLICT,
      UNPROCESSABLE_ENTITY: HttpStatus.UNPROCESSABLE_ENTITY,
      TOO_MANY_REQUESTS: HttpStatus.TOO_MANY_REQUESTS,
      INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
      feature: "HttpStatus enum — all common HTTP status code constants",
    };
  }
}

  @Post({ path: "/items", body: AddItemBodyDTO })
  @HttpCode(HttpStatus.CREATED)
  @Header("X-Created-By", "DemoController")
  addItem(@Body() body: { name: string }) {
    const items = this.demoService.addItem(body.name);
    return {
      message: "Item added",
      items,
      feature: "@HttpCode(HttpStatus.CREATED) + @Header decorator",
    };
  }

  @Get("/transform/:slug")
  @UsePipes(DemoTransformPipe)
  getBySlug(@Param("slug") slug: string) {
    return {
      transformed: slug,
      feature: "@UsePipes — DemoTransformPipe already ran; slug is the transformed value",
    };
  }

  @Get("/admin-only")
  @AdminOnly()
  getAdminData(@CurrentUser() user: any) {
    return {
      message: "Admin-only data",
      user,
      feature: "applyDecorators(@Roles + @UseGuards) + createParamDecorator(@CurrentUser)",
    };
  }

  @Get("/current-user")
  getCurrentUser(@CurrentUser() user: any, @Req() req: WynkRequest) {
    return {
      user,
      headers: { authorization: req.headers?.get?.("authorization") ?? null },
      feature: "createParamDecorator(@CurrentUser) extracts user from request",
    };
  }

  @Get("/reflector-demo")
  @Roles("admin", "moderator")
  reflectorDemo(@Req() req: WynkRequest) {
    const roles = this.reflector.get<string[]>(ROLES_KEY, DemoController.prototype.reflectorDemo);
    return {
      rolesOnThisRoute: roles,
      feature: "Reflector.get() reads metadata set by @SetMetadata",
    };
  }

  @Get("/http-status-demo")
  @HttpCode(HttpStatus.ACCEPTED)
  httpStatusDemo() {
    return {
      status: HttpStatus.ACCEPTED,
      name: "ACCEPTED",
      feature: "@HttpCode(HttpStatus.ACCEPTED) — returns 202 status",
    };
  }

  @Get("/exceptions-demo/:type")
  exceptionsDemo(@Param("type") type: string) {
    if (type === "notfound") throw new NotFoundException("Resource not found (demo)");
    if (type === "forbidden") throw new ForbiddenException("Access denied (demo)");
    return { type, feature: "Exception classes — try 'notfound' or 'forbidden' as :type" };
  }
}
