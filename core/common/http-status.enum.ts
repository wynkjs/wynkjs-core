/**
 * HTTP Status Codes enum for WynkJS Framework.
 *
 * Provides named constants for all standard HTTP status codes (RFC 7231 and beyond),
 * matching NestJS's HttpStatus enum for API compatibility.
 *
 * @example
 * import { HttpStatus } from 'wynkjs';
 *
 * @Get('/')
 * @HttpCode(HttpStatus.OK)
 * findAll() { return []; }
 *
 * throw new HttpException('Not found', HttpStatus.NOT_FOUND);
 *
 * @since 1.0.0
 */
export enum HttpStatus {
  // 1xx Informational
  /** 100 Continue */
  CONTINUE = 100,
  /** 101 Switching Protocols */
  SWITCHING_PROTOCOLS = 101,
  /** 102 Processing */
  PROCESSING = 102,
  /** 103 Early Hints */
  EARLYHINTS = 103,

  // 2xx Success
  /** 200 OK */
  OK = 200,
  /** 201 Created */
  CREATED = 201,
  /** 202 Accepted */
  ACCEPTED = 202,
  /** 203 Non-Authoritative Information */
  NON_AUTHORITATIVE_INFORMATION = 203,
  /** 204 No Content */
  NO_CONTENT = 204,
  /** 205 Reset Content */
  RESET_CONTENT = 205,
  /** 206 Partial Content */
  PARTIAL_CONTENT = 206,
  /** 207 Multi-Status */
  AMBIGUOUS = 300,

  // 3xx Redirection
  /** 301 Moved Permanently */
  MOVED_PERMANENTLY = 301,
  /** 302 Found */
  FOUND = 302,
  /** 303 See Other */
  SEE_OTHER = 303,
  /** 304 Not Modified */
  NOT_MODIFIED = 304,
  /** 307 Temporary Redirect */
  TEMPORARY_REDIRECT = 307,
  /** 308 Permanent Redirect */
  PERMANENT_REDIRECT = 308,

  // 4xx Client Errors
  /** 400 Bad Request */
  BAD_REQUEST = 400,
  /** 401 Unauthorized */
  UNAUTHORIZED = 401,
  /** 402 Payment Required */
  PAYMENT_REQUIRED = 402,
  /** 403 Forbidden */
  FORBIDDEN = 403,
  /** 404 Not Found */
  NOT_FOUND = 404,
  /** 405 Method Not Allowed */
  METHOD_NOT_ALLOWED = 405,
  /** 406 Not Acceptable */
  NOT_ACCEPTABLE = 406,
  /** 407 Proxy Authentication Required */
  PROXY_AUTHENTICATION_REQUIRED = 407,
  /** 408 Request Timeout */
  REQUEST_TIMEOUT = 408,
  /** 409 Conflict */
  CONFLICT = 409,
  /** 410 Gone */
  GONE = 410,
  /** 411 Length Required */
  LENGTH_REQUIRED = 411,
  /** 412 Precondition Failed */
  PRECONDITION_FAILED = 412,
  /** 413 Payload Too Large */
  PAYLOAD_TOO_LARGE = 413,
  /** 414 URI Too Long */
  URI_TOO_LONG = 414,
  /** 415 Unsupported Media Type */
  UNSUPPORTED_MEDIA_TYPE = 415,
  /** 416 Range Not Satisfiable */
  REQUESTED_RANGE_NOT_SATISFIABLE = 416,
  /** 417 Expectation Failed */
  EXPECTATION_FAILED = 417,
  /** 418 I'm a Teapot */
  I_AM_A_TEAPOT = 418,
  /** 421 Misdirected Request */
  MISDIRECTED = 421,
  /** 422 Unprocessable Entity */
  UNPROCESSABLE_ENTITY = 422,
  /** 424 Failed Dependency */
  FAILED_DEPENDENCY = 424,
  /** 429 Too Many Requests */
  TOO_MANY_REQUESTS = 429,
  /** 500 Internal Server Error */
  INTERNAL_SERVER_ERROR = 500,
  /** 501 Not Implemented */
  NOT_IMPLEMENTED = 501,
  /** 502 Bad Gateway */
  BAD_GATEWAY = 502,
  /** 503 Service Unavailable */
  SERVICE_UNAVAILABLE = 503,
  /** 504 Gateway Timeout */
  GATEWAY_TIMEOUT = 504,
  /** 505 HTTP Version Not Supported */
  HTTP_VERSION_NOT_SUPPORTED = 505,
}
