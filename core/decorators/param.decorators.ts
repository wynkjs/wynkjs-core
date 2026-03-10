import "reflect-metadata";

/**
 * Parameter Decorators for WynkJS Framework
 * Extract data from request context
 */

/**
 * Identifies the source from which a parameter decorator extracts its value.
 *
 * - `body`    — request body (JSON payload)
 * - `param`   — URL path parameter (e.g. `/users/:id`)
 * - `query`   — query string parameter (e.g. `?page=1`)
 * - `headers` — HTTP request headers
 * - `request` — full Elysia request object
 * - `response` — Elysia response/set object
 * - `context`  — full Elysia context
 * - `user`     — user object attached to context by a guard
 * - `file`     — single uploaded file
 * - `files`    — multiple uploaded files
 * - `custom`   — value produced by a `createParamDecorator` factory function
 */
export type ParamType =
  | "body"
  | "param"
  | "query"
  | "headers"
  | "request"
  | "response"
  | "context"
  | "user"
  | "file"
  | "files"
  | "custom";

/**
 * Internal metadata stored for each decorated parameter in a controller method.
 * Populated by parameter decorators (`@Body`, `@Param`, `@Query`, etc.) and
 * consumed by the ultra-optimized handler at request time.
 */
export interface ParamMetadata {
  /** Zero-based position of this parameter in the method signature. */
  index: number;
  /** Where to extract the value from — see {@link ParamType}. */
  type: ParamType;
  /** Optional key to pluck from the source (e.g. param name or header name). */
  data?: string;
  /** Optional pipes applied to the extracted value before it reaches the handler. */
  pipes?: any[];
  /** Factory function used when `type === 'custom'` (from `createParamDecorator`). */
  factory?: (data: any, ctx: any) => any;
}

/**
 * Helper to register parameter metadata
 */
function createParamDecorator(type: ParamType, data?: string, pipes?: any[]) {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const existingParams: ParamMetadata[] =
      Reflect.getMetadata("params", target, propertyKey) || [];

    existingParams.push({
      index: parameterIndex,
      type,
      data,
      pipes,
    });

    Reflect.defineMetadata("params", existingParams, target, propertyKey);
  };
}

/**
 * @Body decorator - Extracts request body
 * @param property Optional property name to extract from body
 * @param pipes Optional validation/transformation pipes
 * @example
 * @Post()
 * create(@Body() dto: CreateDto) {}
 *
 * @Post()
 * update(@Body('name') name: string) {}
 */
export function Body(property?: string, ...pipes: any[]): ParameterDecorator {
  return createParamDecorator("body", property, pipes);
}

/**
 * @Param decorator - Extracts route parameters
 * @param property Optional parameter name
 * @param pipes Optional validation/transformation pipes
 * @example
 * @Get('/:id')
 * findOne(@Param('id') id: string) {}
 *
 * @Get('/:id')
 * findOne(@Param() params: any) {}
 */
export function Param(property?: string, ...pipes: any[]): ParameterDecorator {
  return createParamDecorator("param", property, pipes);
}

/**
 * @Query decorator - Extracts query parameters
 * @param property Optional query parameter name
 * @param pipes Optional validation/transformation pipes
 * @example
 * @Get()
 * findAll(@Query('page') page: number) {}
 *
 * @Get()
 * findAll(@Query() query: QueryDto) {}
 */
export function Query(property?: string, ...pipes: any[]): ParameterDecorator {
  return createParamDecorator("query", property, pipes);
}

/**
 * @Headers decorator - Extracts request headers
 * @param property Optional header name
 * @example
 * @Get()
 * getData(@Headers('authorization') auth: string) {}
 *
 * @Get()
 * getData(@Headers() headers: any) {}
 */
export function Headers(property?: string): ParameterDecorator {
  return createParamDecorator("headers", property);
}

/**
 * @Req decorator - Injects full request object
 * @example
 * @Get()
 * getData(@Req() request: Request) {}
 */
export function Req(): ParameterDecorator {
  return createParamDecorator("request");
}

/**
 * @Request decorator - Alias for @Req
 */
export const Request = Req;

/**
 * @Res decorator - Injects response object
 * @example
 * @Get()
 * getData(@Res() response: Response) {}
 */
export function Res(): ParameterDecorator {
  return createParamDecorator("response");
}

/**
 * @Response decorator - Alias for @Res
 */
export const Response = Res;

/**
 * @Context decorator - Injects full WynkJS context
 * @example
 * @Get()
 * getData(@Context() ctx: any) {}
 */
export function Context(): ParameterDecorator {
  return createParamDecorator("context");
}

/**
 * @User decorator - Extracts user from context (after authentication)
 * @param property Optional user property to extract
 * @example
 * @Get('/profile')
 * @UseGuards(AuthGuard)
 * getProfile(@User() user: UserEntity) {}
 *
 * @Get('/profile')
 * getProfile(@User('id') userId: string) {}
 */
export function User(property?: string): ParameterDecorator {
  return createParamDecorator("user", property);
}

/**
 * @UploadedFile decorator - Extracts uploaded file
 * @example
 * @Post('/upload')
 * uploadFile(@UploadedFile() file: File) {}
 */
export function UploadedFile(): ParameterDecorator {
  return createParamDecorator("file");
}

/**
 * @UploadedFiles decorator - Extracts multiple uploaded files
 * @example
 * @Post('/upload-multiple')
 * uploadFiles(@UploadedFiles() files: File[]) {}
 */
export function UploadedFiles(): ParameterDecorator {
  return createParamDecorator("files");
}

/**
 * @Ip decorator - Extracts client IP address
 * @example
 * @Get()
 * getData(@Ip() ip: string) {}
 */
export function Ip(): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const existingParams: ParamMetadata[] =
      Reflect.getMetadata("params", target, propertyKey) || [];

    existingParams.push({
      index: parameterIndex,
      type: "headers",
      data: "x-forwarded-for",
    });

    Reflect.defineMetadata("params", existingParams, target, propertyKey);
  };
}

/**
 * @Session decorator - Extracts session data
 * @param property Optional session property name
 * @example
 * @Get()
 * getData(@Session() session: any) {}
 *
 * @Get()
 * getData(@Session('userId') userId: string) {}
 */
export function Session(property?: string): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const existingParams: ParamMetadata[] =
      Reflect.getMetadata("params", target, propertyKey) || [];

    existingParams.push({
      index: parameterIndex,
      type: "context",
      data: property ? `session.${property}` : "session",
    });

    Reflect.defineMetadata("params", existingParams, target, propertyKey);
  };
}

/**
 * @HostParam decorator - Extracts subdomain parameters
 * @param property Host parameter name
 * @example
 * @Controller({ host: ':account.example.com' })
 * export class AccountController {
 *   @Get()
 *   getData(@HostParam('account') account: string) {}
 * }
 */
export function HostParam(property: string): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const existingParams: ParamMetadata[] =
      Reflect.getMetadata("params", target, propertyKey) || [];

    existingParams.push({
      index: parameterIndex,
      type: "context",
      data: `host.${property}`,
    });

    Reflect.defineMetadata("params", existingParams, target, propertyKey);
  };
}
