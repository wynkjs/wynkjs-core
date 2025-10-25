/**
 * Testing utilities and helpers
 */

/**
 * Create a mock request object for testing controllers
 */
export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    body?: any;
    params?: Record<string, string>;
    query?: Record<string, any>;
    headers?: Record<string, string>;
  } = {}
): any {
  return {
    method: options.method || "GET",
    url: options.url || "/",
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
  };
}

/**
 * Create a mock response object for testing controllers
 */
export function createMockResponse(): any {
  const response: any = {
    statusCode: 200,
    headers: {},
    body: null,
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    send: function (data: any) {
      this.body = data;
      return this;
    },
    json: function (data: any) {
      this.body = data;
      return this;
    },
    setHeader: function (name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };

  return response;
}

/**
 * Create a mock execution context for testing guards, interceptors, etc.
 */
export function createMockExecutionContext(
  request: any = createMockRequest(),
  response: any = createMockResponse()
): any {
  return {
    getRequest: () => request,
    getResponse: () => response,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error("Expected value to be defined");
  }
}

/**
 * Assert that a value is an instance of a class
 */
export function assertInstanceOf<T>(
  value: any,
  type: new (...args: any[]) => T
): asserts value is T {
  if (!(value instanceof type)) {
    throw new Error(`Expected value to be instance of ${type.name}`);
  }
}
