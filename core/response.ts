/**
 * Response Wrapper for WynkJS Framework
 * Provides a clean API for setting cookies, headers, status codes, and sending responses
 */

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number; // in seconds
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  priority?: "low" | "medium" | "high";
  partitioned?: boolean;
}

/**
 * Response class - wraps Elysia context for response operations
 * Provides methods to set cookies, headers, status codes, and control response behavior
 */
export class Response {
  private ctx: any;
  private _headers: Map<string, string> = new Map();
  private _cookies: Map<string, { value: string; options?: CookieOptions }> = new Map();
  private _status?: number;

  constructor(ctx: any) {
    this.ctx = ctx;
    // Initialize Elysia's set object if it doesn't exist
    if (!this.ctx.set) {
      this.ctx.set = {
        headers: {},
        status: 200,
      };
    }
    if (!this.ctx.set.headers) {
      this.ctx.set.headers = {};
    }
  }

  /**
   * Set HTTP status code
   */
  status(code: number): this {
    this._status = code;
    this.ctx.set.status = code;
    return this;
  }

  /**
   * Get current status code
   */
  getStatus(): number {
    return this._status || this.ctx.set.status || 200;
  }

  /**
   * Set a response header
   */
  header(name: string, value: string): this {
    this._headers.set(name, value);
    this.ctx.set.headers[name] = value;
    return this;
  }

  /**
   * Set multiple headers at once
   */
  headers(headers: Record<string, string>): this {
    Object.entries(headers).forEach(([name, value]) => {
      this.header(name, value);
    });
    return this;
  }

  /**
   * Get a response header
   */
  getHeader(name: string): string | undefined {
    return this._headers.get(name) || this.ctx.set.headers[name];
  }

  /**
   * Remove a response header
   */
  removeHeader(name: string): this {
    this._headers.delete(name);
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.ctx.set.headers[name];
    return this;
  }

  /**
   * Set a cookie
   * 
   * @example
   * response.cookie('sessionId', '12345', {
   *   httpOnly: true,
   *   secure: true,
   *   maxAge: 3600,
   *   sameSite: 'strict'
   * });
   */
  cookie(name: string, value: string, options?: CookieOptions): this {
    this._cookies.set(name, { value, options });
    
    // Build cookie string
    let cookieString = `${name}=${value}`;

    if (options) {
      if (options.domain) {
        cookieString += `; Domain=${options.domain}`;
      }
      if (options.expires) {
        cookieString += `; Expires=${options.expires.toUTCString()}`;
      }
      if (options.httpOnly) {
        cookieString += "; HttpOnly";
      }
      if (options.maxAge !== undefined) {
        cookieString += `; Max-Age=${options.maxAge}`;
      }
      if (options.path) {
        cookieString += `; Path=${options.path}`;
      } else {
        cookieString += "; Path=/"; // Default path
      }
      if (options.sameSite) {
        const sameSiteValue = typeof options.sameSite === "boolean" 
          ? "Strict" 
          : options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1);
        cookieString += `; SameSite=${sameSiteValue}`;
      }
      if (options.secure) {
        cookieString += "; Secure";
      }
      if (options.priority) {
        cookieString += `; Priority=${options.priority.charAt(0).toUpperCase() + options.priority.slice(1)}`;
      }
      if (options.partitioned) {
        cookieString += "; Partitioned";
      }
    } else {
      cookieString += "; Path=/"; // Default path if no options
    }

    // Append to Set-Cookie header (can have multiple)
    const existingSetCookie = this.ctx.set.headers["Set-Cookie"];
    if (existingSetCookie) {
      if (Array.isArray(existingSetCookie)) {
        this.ctx.set.headers["Set-Cookie"] = [...existingSetCookie, cookieString];
      } else {
        this.ctx.set.headers["Set-Cookie"] = [existingSetCookie, cookieString];
      }
    } else {
      this.ctx.set.headers["Set-Cookie"] = cookieString;
    }

    return this;
  }

  /**
   * Clear a cookie by setting it to expire immediately
   */
  clearCookie(name: string, options?: Pick<CookieOptions, "domain" | "path">): this {
    return this.cookie(name, "", {
      ...options,
      expires: new Date(0),
      maxAge: 0,
    });
  }

  /**
   * Get all cookies that have been set
   */
  getCookies(): Map<string, { value: string; options?: CookieOptions }> {
    return this._cookies;
  }

  /**
   * Send JSON response
   */
  json(data: any): any {
    this.header("Content-Type", "application/json");
    return data;
  }

  /**
   * Send HTML response
   */
  html(content: string): string {
    this.header("Content-Type", "text/html");
    return content;
  }

  /**
   * Send plain text response
   */
  text(content: string): string {
    this.header("Content-Type", "text/plain");
    return content;
  }

  /**
   * Redirect to a different URL
   */
  redirect(url: string, statusCode: number = 302): void {
    this.ctx.set.redirect = url;
    this.ctx.set.status = statusCode;
  }

  /**
   * Set content type
   */
  type(contentType: string): this {
    return this.header("Content-Type", contentType);
  }

  /**
   * Set cache control
   */
  cache(maxAge: number, options?: { private?: boolean; noCache?: boolean; noStore?: boolean }): this {
    let cacheControl = "";
    
    if (options?.private) {
      cacheControl = "private";
    } else {
      cacheControl = "public";
    }
    
    if (options?.noCache) {
      cacheControl += ", no-cache";
    }
    
    if (options?.noStore) {
      cacheControl += ", no-store";
    }
    
    if (maxAge > 0) {
      cacheControl += `, max-age=${maxAge}`;
    }
    
    return this.header("Cache-Control", cacheControl);
  }

  /**
   * Disable caching
   */
  noCache(): this {
    return this.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
      .header("Pragma", "no-cache")
      .header("Expires", "0");
  }

  /**
   * Set CORS headers
   */
  cors(options?: {
    origin?: string;
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  }): this {
    this.header("Access-Control-Allow-Origin", options?.origin || "*");
    
    if (options?.methods) {
      this.header("Access-Control-Allow-Methods", options.methods.join(", "));
    }
    
    if (options?.headers) {
      this.header("Access-Control-Allow-Headers", options.headers.join(", "));
    }
    
    if (options?.credentials) {
      this.header("Access-Control-Allow-Credentials", "true");
    }
    
    if (options?.maxAge !== undefined) {
      this.header("Access-Control-Max-Age", options.maxAge.toString());
    }
    
    return this;
  }

  /**
   * Get the raw Elysia set object
   */
  get raw(): any {
    return this.ctx.set;
  }

  /**
   * Send a file download
   */
  download(filename: string): this {
    return this.header("Content-Disposition", `attachment; filename="${filename}"`);
  }

  /**
   * Send response with custom status code
   */
  send(data: any, statusCode?: number): any {
    if (statusCode) {
      this.status(statusCode);
    }
    return data;
  }
}

// Export type alias for proper typing
export type WynkResponse = Response;
