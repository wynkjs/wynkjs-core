/**
 * Request Wrapper for WynkJS Framework
 * Provides a clean API for accessing request data and adding custom properties
 */

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  priority?: "low" | "medium" | "high";
  partitioned?: boolean;
}

/**
 * Request class - wraps Elysia context for request operations
 * Allows middleware to add custom properties that persist through the request lifecycle
 */
export class Request {
  private ctx: any;
  private customData: Map<string, any> = new Map();
  private originalRequest: any;

  constructor(ctx: any) {
    this.ctx = ctx;
    // Store reference to original request object before it gets overwritten
    this.originalRequest = ctx.request;
  }

  /**
   * Get request body
   */
  get body(): any {
    return this.ctx.body;
  }

  /**
   * Get route parameters
   */
  get params(): any {
    return this.ctx.params;
  }

  /**
   * Get query parameters
   */
  get query(): any {
    return this.ctx.query;
  }

  /**
   * Get request headers
   */
  get headers(): any {
    // Get headers from ctx or from the original Elysia request object
    const headers = this.ctx.headers || this.originalRequest?.headers;
    
    if (!headers) return {};
    
    // If headers is a plain object, wrap it to provide get() method
    if (typeof headers === 'object' && !headers.get) {
      return {
        ...headers,
        get(name: string) {
          return headers[name] || headers[name.toLowerCase()];
        },
        has(name: string) {
          return name in headers || name.toLowerCase() in headers;
        }
      };
    }
    
    return headers;
  }

  /**
   * Get request method (GET, POST, etc.)
   */
  get method(): string {
    return this.originalRequest?.method || this.ctx.method || "GET";
  }

  /**
   * Get request URL
   */
  get url(): string {
    return this.originalRequest?.url || this.ctx.url || "";
  }

  /**
   * Get request path
   */
  get path(): string {
    return this.ctx.path || new URL(this.url).pathname;
  }

  /**
   * Get client IP address
   */
  get ip(): string | undefined {
    return (
      this.headers.get?.("x-forwarded-for") ||
      this.headers.get?.("x-real-ip") ||
      this.originalRequest?.ip
    );
  }

  /**
   * Get cookies from request
   */
  get cookies(): Record<string, string> {
    const cookieHeader = this.headers.get?.("cookie");
    if (!cookieHeader) return {};

    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((cookie: string) => {
      const [name, ...rest] = cookie.split("=");
      if (name && rest.length > 0) {
        cookies[name.trim()] = rest.join("=").trim();
      }
    });

    return cookies;
  }

  /**
   * Get a specific cookie value
   */
  getCookie(name: string): string | undefined {
    return this.cookies[name];
  }

  /**
   * Get user object (set by authentication middleware)
   */
  get user(): any {
    return this.ctx.user;
  }

  /**
   * Set user object (typically used by authentication middleware)
   */
  set user(value: any) {
    this.ctx.user = value;
  }

  /**
   * Get the raw Elysia context
   */
  get raw(): any {
    return this.ctx;
  }

  /**
   * Get the Response wrapper instance
   */
  getResponse(): any {
    return this.ctx.response;
  }

  /**
   * Set custom data that persists through request lifecycle
   * Useful for middleware to pass data to handlers
   * 
   * @example
   * // In middleware
   * request.set('startTime', Date.now());
   * 
   * // In handler
   * const startTime = request.get('startTime');
   */
  set(key: string, value: any): this {
    this.customData.set(key, value);
    // Also set on ctx for backward compatibility
    if (!this.ctx.customData) {
      this.ctx.customData = {};
    }
    this.ctx.customData[key] = value;
    return this;
  }

  /**
   * Get custom data set by middleware
   */
  get(key: string): any {
    return this.customData.get(key) || this.ctx.customData?.[key];
  }

  /**
   * Check if custom data exists
   */
  has(key: string): boolean {
    return this.customData.has(key) || (this.ctx.customData && key in this.ctx.customData);
  }

  /**
   * Delete custom data
   */
  delete(key: string): boolean {
    const deleted = this.customData.delete(key);
    if (this.ctx.customData && key in this.ctx.customData) {
      delete this.ctx.customData[key];
    }
    return deleted;
  }

  /**
   * Get all custom data
   */
  getAllCustomData(): Record<string, any> {
    const data: Record<string, any> = {};
    this.customData.forEach((value, key) => {
      data[key] = value;
    });
    return { ...data, ...this.ctx.customData };
  }

  /**
   * Check if request accepts a certain content type
   */
  accepts(type: string): boolean {
    const acceptHeader = this.headers.get?.("accept") || "";
    return acceptHeader.includes(type);
  }

  /**
   * Check if request is JSON
   */
  isJson(): boolean {
    const contentType = this.headers.get?.("content-type") || "";
    return contentType.includes("application/json");
  }

  /**
   * Check if request is form data
   */
  isFormData(): boolean {
    const contentType = this.headers.get?.("content-type") || "";
    return contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded");
  }

  /**
   * Get bearer token from Authorization header
   */
  getBearerToken(): string | undefined {
    const authHeader = this.headers.get?.("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return undefined;
    }
    return authHeader.substring(7);
  }
}

// Export type alias for proper typing
export type WynkRequest = Request;
