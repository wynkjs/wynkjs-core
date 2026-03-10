import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  type WynkRequest,
  Req,
  DTO,
} from "wynkjs";
import { DemoService } from "./demo.service";
import { DemoLoggingInterceptor } from "./demo.interceptor";
import { DemoTransformPipe } from "./demo.pipe";
import { DemoRolesGuard } from "./demo.guard";

const ROLES_KEY = "demo_roles";

const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

const AdminOnly = () => applyDecorators(
  Roles("admin"),
  UseGuards(DemoRolesGuard)
);

const CurrentUser = createParamDecorator((data: unknown, req: WynkRequest) => {
  return (req as any).user ?? { id: "anonymous", roles: ["guest"] };
});

const AddItemBodyDTO = DTO.Strict({
  name: DTO.String({ minLength: 1, maxLength: 100 }),
});

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

  @Get("/transform/:slug")
  @UsePipes(DemoTransformPipe)
  getBySlug(@Param("slug") slug: string) {
    return {
      original: slug,
      transformed: this.demoService.transform(slug),
      feature: "@UsePipes — transforms the param value",
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
