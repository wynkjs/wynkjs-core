import {
  Controller,
  Get,
  Injectable,
  UseInterceptors,
  TransformInterceptor,
  TimeoutInterceptor,
  CacheInterceptor,
  LoggingInterceptor,
  ResponseInterceptor,
  ErrorHandlingInterceptor,
  RateLimitInterceptor,
  SanitizeInterceptor,
  PaginationInterceptor,
} from "wynkjs";

@Injectable()
@Controller("/interceptors")
@UseInterceptors(LoggingInterceptor)  // controller-level
export class InterceptorsController {
  @Get("/transform")
  @UseInterceptors(TransformInterceptor)
  transform() {
    return {
      raw: "data",
      feature: "TransformInterceptor — wraps response in { data, statusCode, timestamp }",
    };
  }

  @Get("/transform-custom")
  @UseInterceptors(new TransformInterceptor((d) => ({ result: d, ok: true })))
  transformCustom() {
    return { hello: "world" };
  }

  @Get("/timeout")
  @UseInterceptors(new TimeoutInterceptor(5000))
  timeout() {
    return {
      message: "Responded within 5 seconds",
      feature: "TimeoutInterceptor(5000ms) — rejects if handler takes longer than timeout",
    };
  }

  @Get("/cached")
  @UseInterceptors(new CacheInterceptor(30000))
  cached() {
    return {
      data: `Generated at ${new Date().toISOString()}`,
      feature: "CacheInterceptor(30s TTL) — second request within 30s returns same timestamp",
    };
  }

  @Get("/logging")
  @UseInterceptors(LoggingInterceptor)
  logging() {
    return {
      feature: "LoggingInterceptor — logs request/response timing to console (check server logs)",
    };
  }

  @Get("/response")
  @UseInterceptors(ResponseInterceptor)
  response() {
    return {
      payload: "hello",
      feature: "ResponseInterceptor — standardises response envelope",
    };
  }

  @Get("/error-handling")
  @UseInterceptors(ErrorHandlingInterceptor)
  errorHandling() {
    return {
      status: "ok",
      feature: "ErrorHandlingInterceptor — catches errors and returns structured error response",
    };
  }

  @Get("/rate-limited")
  @UseInterceptors(new RateLimitInterceptor({ limit: 5, windowMs: 60000 }))
  rateLimited() {
    return {
      feature: "RateLimitInterceptor(5 req/min) — returns 429 after limit exceeded",
    };
  }

  @Get("/sanitize")
  @UseInterceptors(SanitizeInterceptor)
  sanitize() {
    return {
      htmlContent: "<script>alert('xss')</script>Safe content",
      feature: "SanitizeInterceptor — sanitizes response data",
    };
  }

  @Get("/paginated")
  @UseInterceptors(PaginationInterceptor)
  paginated() {
    return Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
  }

  @Get("/stacked")
  @UseInterceptors(
    new TimeoutInterceptor(3000),
    LoggingInterceptor,
    TransformInterceptor
  )
  stacked() {
    return {
      feature: "Multiple interceptors stacked: TimeoutInterceptor → LoggingInterceptor → TransformInterceptor",
    };
  }
}
