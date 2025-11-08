import { Controller, Get, Post, Body, Headers } from "wynkjs";

/**
 * CORS Test Controller
 * Provides endpoints specifically for testing CORS functionality
 */
@Controller("/cors-test")
export class CorsTestController {
  @Get("/")
  testGet() {
    return {
      message: "CORS GET test successful",
      timestamp: new Date().toISOString(),
      method: "GET",
    };
  }

  @Post("/")
  testPost(@Body() body: any) {
    return {
      message: "CORS POST test successful",
      timestamp: new Date().toISOString(),
      method: "POST",
      receivedData: body,
    };
  }

  @Get("/headers")
  testHeaders(@Headers("origin") origin?: string) {
    return {
      message: "CORS headers test",
      origin: origin || "No origin header",
      timestamp: new Date().toISOString(),
    };
  }

  @Post("/credentials")
  testCredentials(@Headers("cookie") cookie?: string) {
    return {
      message: "CORS credentials test",
      hasCookie: !!cookie,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("/info")
  getCorsInfo() {
    return {
      message: "CORS Configuration Information",
      supportedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowsCredentials: true,
      timestamp: new Date().toISOString(),
      endpoints: [
        "GET /cors-test/",
        "POST /cors-test/",
        "GET /cors-test/headers",
        "POST /cors-test/credentials",
        "GET /cors-test/info",
      ],
    };
  }
}
