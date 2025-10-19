import "reflect-metadata";

/**
 * Parameter Decorators for ElysiaJS Framework
 * Extract data from request context
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
  | "files";

export interface ParamMetadata {
  index: number;
  type: ParamType;
  data?: string;
  pipes?: any[];
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
 * @Context decorator - Injects full Elysia context
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
