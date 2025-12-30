/**
 * Session Controller - Demonstrates Request/Response architecture
 * Shows how to:
 * 1. Set and read cookies
 * 2. Add custom data in middleware
 * 3. Access Request/Response objects in handlers
 * 4. Persist data through request lifecycle
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  Injectable,
  Use,
  type WynkRequest,
  type WynkResponse,
} from "wynkjs";

// Session data interface
interface SessionData {
  userId: string;
  username: string;
  loginTime: number;
  lastActivity: number;
}

// Login DTO
class LoginSessionDTO {
  username!: string;
  password!: string;
}

/**
 * Request timing middleware
 * Demonstrates adding custom data to request in middleware
 */
export const requestTimingMiddleware = async (ctx: any, next: () => Promise<any>) => {
  // Ensure Request/Response wrappers exist
  if (!ctx.request || typeof ctx.request.set !== 'function') {
    const { Request: WynkRequest, Response: WynkResponse } = await import('wynkjs');
    ctx.request = new Request(ctx);
    ctx.response = new Response(ctx);
  }
  
  const request = ctx.request as WynkRequest;
  
  // Add request start time to request context
  request.set('requestStartTime', Date.now());
  request.set('requestId', Math.random().toString(36).substring(7));
  
  // Call next handler
  const result = await next();
  
  // Calculate request duration
  const startTime = request.get('requestStartTime');
  const duration = Date.now() - startTime;
  
  // Add custom header with request timing
  const response = ctx.response as WynkResponse;
  response.header('X-Request-Duration', `${duration}ms`);
  response.header('X-Request-ID', request.get('requestId'));
  
  return result;
};

/**
 * Session middleware
 * Demonstrates reading cookies and attaching session data to request
 */
export const sessionMiddleware = async (ctx: any, next: () => Promise<any>) => {
  // Ensure Request/Response wrappers exist
  if (!ctx.request || typeof ctx.request.getCookie !== 'function') {
    const { Request: WynkRequest, Response: WynkResponse } = await import('wynkjs');
    ctx.request = new Request(ctx);
    ctx.response = new Response(ctx);
  }
  
  const request = ctx.request as WynkRequest;
  const response = ctx.response as WynkResponse;
  
  // Read session cookie
  const sessionId = request.getCookie('sessionId');
  
  if (sessionId) {
    // In a real app, you would validate the session with a database
    // For demo purposes, we'll decode it from base64
    try {
      const sessionData = JSON.parse(
        Buffer.from(sessionId, 'base64').toString('utf-8')
      ) as SessionData;
      
      // Attach session data to request
      request.set('session', sessionData);
      request.user = { id: sessionData.userId, username: sessionData.username };
      
      // Update last activity time
      sessionData.lastActivity = Date.now();
      
      // Refresh the session cookie
      const newSessionId = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      response.cookie('sessionId', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600, // 1 hour
        sameSite: 'strict',
        path: '/',
      });
    } catch (error) {
      // Invalid session cookie
      response.clearCookie('sessionId');
    }
  }
  
  return await next();
};

@Injectable()
@Controller("/session")
@Use(requestTimingMiddleware) // Apply timing middleware to all routes
export class SessionController {
  /**
   * Create a new session (login)
   * POST /session/login
   */
  @Post("/login")
  async login(@Body() body: LoginSessionDTO, @Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    // Demo: Simple authentication (in real app, verify with database)
    if (body.password !== "demo123") {
      response.status(401);
      return {
        success: false,
        message: "Invalid credentials",
      };
    }
    
    // Create session data
    const sessionData: SessionData = {
      userId: Math.random().toString(36).substring(7),
      username: body.username,
      loginTime: Date.now(),
      lastActivity: Date.now(),
    };
    
    // Encode session as base64 and set as cookie
    const sessionId = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    response.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
      sameSite: 'strict',
      path: '/',
    });
    
    // Also set a user preferences cookie (not httpOnly, for client-side access)
    response.cookie('userPrefs', JSON.stringify({ theme: 'dark', lang: 'en' }), {
      httpOnly: false,
      maxAge: 86400 * 7, // 7 days
      path: '/',
    });
    
    return response.json({
      success: true,
      message: "Login successful",
      session: sessionData,
      requestId: request.get('requestId'),
    });
  }
  
  /**
   * Get current session
   * GET /session/current
   * Requires session middleware
   */
  @Get("/current")
  @Use(sessionMiddleware)
  async getCurrentSession(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    const session = request.get('session') as SessionData | undefined;
    
    if (!session) {
      response.status(401);
      return {
        success: false,
        message: "No active session",
      };
    }
    
    return response.json({
      success: true,
      session,
      requestId: request.get('requestId'),
      requestDuration: `${Date.now() - request.get('requestStartTime')}ms`,
    });
  }
  
  /**
   * Logout (clear session)
   * DELETE /session/logout
   */
  @Delete("/logout")
  async logout(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    // Clear session cookie
    response.clearCookie('sessionId');
    response.clearCookie('userPrefs');
    
    return response.json({
      success: true,
      message: "Logged out successfully",
      requestId: request.get('requestId'),
    });
  }
  
  /**
   * Demonstrates using Response object directly
   * GET /session/demo-response
   */
  @Get("/demo-response")
  async demoResponse(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    // Set multiple headers
    response
      .header('X-Custom-Header', 'Custom Value')
      .header('X-API-Version', '1.0.0')
      .cache(3600, { private: true }); // Cache for 1 hour
    
    // Set multiple cookies
    response
      .cookie('demo1', 'value1', { maxAge: 60 })
      .cookie('demo2', 'value2', { maxAge: 120, httpOnly: true });
    
    return response.json({
      message: "Response with headers and cookies",
      headers: ['X-Custom-Header', 'X-API-Version', 'Cache-Control'],
      cookies: ['demo1', 'demo2'],
      requestData: {
        method: request.method,
        path: request.path,
        ip: request.ip,
        requestId: request.get('requestId'),
      },
    });
  }
  
  /**
   * Demonstrates HTML response
   * GET /session/demo-html
   */
  @Get("/demo-html")
  async demoHtml(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    const sessionId = request.getCookie('sessionId');
    
    return response.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Session Demo</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .info { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Session Demo - HTML Response</h1>
          <div class="info">
            <strong>Session ID:</strong> ${sessionId || 'No session'}
          </div>
          <div class="info">
            <strong>Request ID:</strong> ${request.get('requestId')}
          </div>
          <div class="info">
            <strong>Request Method:</strong> ${request.method}
          </div>
          <div class="info">
            <strong>Request Path:</strong> ${request.path}
          </div>
        </body>
      </html>
    `);
  }
  
  /**
   * Demonstrates redirect
   * GET /session/demo-redirect
   */
  @Get("/demo-redirect")
  async demoRedirect(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    // Redirect to current session endpoint
    response.redirect('/session/current', 302);
  }
  
  /**
   * Demonstrates middleware context passing
   * GET /session/demo-middleware
   */
  @Get("/demo-middleware")
  @Use(async (ctx: any, next: () => Promise<any>) => {
    const request = ctx.request as WynkRequest;
    
    // Add custom data in route-specific middleware
    request.set('routeData', {
      handler: 'demo-middleware',
      timestamp: Date.now(),
      extra: 'This data was added by route-specific middleware',
    });
    
    return await next();
  })
  async demoMiddleware(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    // Access data added by middleware
    const routeData = request.get('routeData');
    const requestStartTime = request.get('requestStartTime');
    const requestId = request.get('requestId');
    
    return response.json({
      message: "Middleware context demo",
      globalMiddlewareData: {
        requestId,
        requestStartTime,
        elapsed: `${Date.now() - requestStartTime}ms`,
      },
      routeMiddlewareData: routeData,
      allCustomData: request.getAllCustomData(),
    });
  }
  
  /**
   * Demonstrates file download
   * GET /session/demo-download
   */
  @Get("/demo-download")
  async demoDownload(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    const csvContent = `Name,Email,Role\nJohn Doe,john@example.com,Admin\nJane Smith,jane@example.com,User`;
    
    response
      .type('text/csv')
      .download('users.csv');
    
    return csvContent;
  }
  
  /**
   * Demonstrates no-cache response
   * GET /session/demo-no-cache
   */
  @Get("/demo-no-cache")
  async demoNoCache(@Req() request: WynkRequest) {
    const response = request.getResponse() as WynkResponse;
    
    response.noCache();
    
    return response.json({
      message: "This response is not cached",
      timestamp: Date.now(),
      random: Math.random(),
    });
  }
}
