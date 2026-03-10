import {
  Controller,
  Get,
  Injectable,
  UseFilters,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  AlreadyExistsException,
  GoneException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
  TooManyRequestsException,
  InternalServerErrorException,
  NotImplementedException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  HttpVersionNotSupportedException,
  MethodNotAllowedException,
  NotAcceptableException,
  RequestTimeoutException,
  HttpWynkExceptionFilter,
  AllExceptions,
} from "wynkjs";
import {
  CustomHttpExceptionFilter,
  CustomCatchAllFilter,
  CustomNotFoundFilter,
  CustomForbiddenFilter,
} from "./custom.filter";

@Injectable()
@Controller("/filters")
@UseFilters(CustomHttpExceptionFilter)
export class FiltersController {
  @Get("/http-exception")
  httpException() {
    throw new HttpException("Custom HTTP exception", 418, "I'm a teapot");
  }

  @Get("/bad-request")
  badRequest() {
    throw new BadRequestException("Invalid input data");
  }

  @Get("/unauthorized")
  unauthorized() {
    throw new UnauthorizedException("Authentication required");
  }

  @Get("/forbidden")
  @UseFilters(CustomForbiddenFilter)
  forbidden() {
    throw new ForbiddenException("Admin role required");
  }

  @Get("/not-found")
  @UseFilters(CustomNotFoundFilter)
  notFound() {
    throw new NotFoundException("Resource with id=99 not found");
  }

  @Get("/conflict")
  conflict() {
    throw new ConflictException("Email already registered");
  }

  @Get("/already-exists")
  alreadyExists() {
    throw new AlreadyExistsException("Username taken");
  }

  @Get("/gone")
  gone() {
    throw new GoneException("This resource was permanently deleted");
  }

  @Get("/payload-too-large")
  payloadTooLarge() {
    throw new PayloadTooLargeException("File exceeds 10MB limit");
  }

  @Get("/unsupported-media-type")
  unsupportedMediaType() {
    throw new UnsupportedMediaTypeException("Only application/json accepted");
  }

  @Get("/unprocessable-entity")
  unprocessableEntity() {
    throw new UnprocessableEntityException("Business rule violated");
  }

  @Get("/too-many-requests")
  tooManyRequests() {
    throw new TooManyRequestsException("Rate limit: 100 req/min");
  }

  @Get("/method-not-allowed")
  methodNotAllowed() {
    throw new MethodNotAllowedException("DELETE not allowed on this resource");
  }

  @Get("/not-acceptable")
  notAcceptable() {
    throw new NotAcceptableException("text/html not supported");
  }

  @Get("/request-timeout")
  requestTimeout() {
    throw new RequestTimeoutException("Upstream timed out");
  }

  @Get("/internal-server-error")
  internalServerError() {
    throw new InternalServerErrorException("Unexpected failure");
  }

  @Get("/not-implemented")
  notImplemented() {
    throw new NotImplementedException("This endpoint is not yet implemented");
  }

  @Get("/bad-gateway")
  badGateway() {
    throw new BadGatewayException("Upstream returned invalid response");
  }

  @Get("/service-unavailable")
  serviceUnavailable() {
    throw new ServiceUnavailableException("Maintenance in progress");
  }

  @Get("/gateway-timeout")
  gatewayTimeout() {
    throw new GatewayTimeoutException("Upstream did not respond in time");
  }

  @Get("/http-version-not-supported")
  httpVersionNotSupported() {
    throw new HttpVersionNotSupportedException("HTTP/1.0 not supported");
  }

  @Get("/builtin-http-filter")
  @UseFilters(HttpWynkExceptionFilter)
  builtinHttpFilter() {
    throw new BadRequestException("Handled by built-in HttpWynkExceptionFilter");
  }

  @Get("/builtin-catch-all")
  @UseFilters(AllExceptions)
  builtinCatchAll() {
    throw new InternalServerErrorException("Handled by built-in AllExceptions filter");
  }

  @Get("/custom-catch-all")
  @UseFilters(CustomCatchAllFilter)
  customCatchAll() {
    throw new ConflictException("Handled by CustomCatchAllFilter (@Catch())");
  }

  @Get("/ok")
  ok() {
    return {
      feature: "FiltersController — demonstrates @UseFilters, @Catch, and all HTTP exception types",
      routes: [
        "GET /filters/http-exception — HttpException (418)",
        "GET /filters/bad-request — BadRequestException (400)",
        "GET /filters/unauthorized — UnauthorizedException (401)",
        "GET /filters/forbidden — ForbiddenException (403) + @UseFilters(CustomForbiddenFilter)",
        "GET /filters/not-found — NotFoundException (404) + @UseFilters(CustomNotFoundFilter)",
        "GET /filters/conflict — ConflictException (409)",
        "GET /filters/already-exists — AlreadyExistsException (409)",
        "GET /filters/gone — GoneException (410)",
        "GET /filters/payload-too-large — PayloadTooLargeException (413)",
        "GET /filters/unsupported-media-type — UnsupportedMediaTypeException (415)",
        "GET /filters/unprocessable-entity — UnprocessableEntityException (422)",
        "GET /filters/too-many-requests — TooManyRequestsException (429)",
        "GET /filters/method-not-allowed — MethodNotAllowedException (405)",
        "GET /filters/not-acceptable — NotAcceptableException (406)",
        "GET /filters/request-timeout — RequestTimeoutException (408)",
        "GET /filters/internal-server-error — InternalServerErrorException (500)",
        "GET /filters/not-implemented — NotImplementedException (501)",
        "GET /filters/bad-gateway — BadGatewayException (502)",
        "GET /filters/service-unavailable — ServiceUnavailableException (503)",
        "GET /filters/gateway-timeout — GatewayTimeoutException (504)",
        "GET /filters/http-version-not-supported — HttpVersionNotSupportedException (505)",
        "GET /filters/builtin-http-filter — HttpWynkExceptionFilter (built-in)",
        "GET /filters/builtin-catch-all — AllExceptions (built-in catch-all)",
        "GET /filters/custom-catch-all — CustomCatchAllFilter (@Catch())",
      ],
    };
  }
}
