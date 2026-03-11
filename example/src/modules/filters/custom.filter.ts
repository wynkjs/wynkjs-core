import {
  Catch,
  WynkExceptionFilter,
  HttpException,
  NotFoundException,
  ForbiddenException,
} from "wynkjs";
import type { ExecutionContext } from "wynkjs";

@Catch(HttpException)
export class CustomHttpExceptionFilter
  implements WynkExceptionFilter<HttpException>
{
  catch(exception: HttpException, context: ExecutionContext) {
    const request = context.getRequest();
    return {
      feature: "CustomHttpExceptionFilter — @Catch(HttpException) with custom shape",
      statusCode: exception.statusCode,
      message: exception.message,
      error: exception.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }
}

@Catch()
export class CustomCatchAllFilter implements WynkExceptionFilter {
  catch(exception: any, context: ExecutionContext) {
    const request = context.getRequest();
    const statusCode = exception instanceof HttpException
      ? exception.statusCode
      : 500;
    return {
      feature: "CustomCatchAllFilter — @Catch() catch-all filter",
      statusCode,
      message: exception.message || "An error occurred",
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }
}

@Catch(NotFoundException)
export class CustomNotFoundFilter
  implements WynkExceptionFilter<NotFoundException>
{
  catch(exception: NotFoundException, context: ExecutionContext) {
    const request = context.getRequest();
    return {
      feature: "CustomNotFoundFilter — @Catch(NotFoundException)",
      statusCode: 404,
      message: exception.message,
      path: request.url,
      suggestion: "Check the resource ID",
    };
  }
}

@Catch(ForbiddenException)
export class CustomForbiddenFilter
  implements WynkExceptionFilter<ForbiddenException>
{
  catch(exception: ForbiddenException, context: ExecutionContext) {
    const request = context.getRequest();
    return {
      feature: "CustomForbiddenFilter — @Catch(ForbiddenException)",
      statusCode: 403,
      message: exception.message,
      path: request.url,
      hint: "You need the required role to access this resource",
    };
  }
}
