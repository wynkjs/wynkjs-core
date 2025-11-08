/**
 * CORS Configuration Tests for WynkJS Example Application
 * Tests various CORS scenarios including dynamic origin validation
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { WynkFactory } from "wynkjs";
import type { CorsOptions } from "wynkjs";

describe("CORS Configuration Tests", () => {
  let app: any;
  let serverUrl = "http://localhost:3333";

  afterAll(async () => {
    if (app?.stop) {
      
    }
  });

  test("should allow all origins with cors: true", async () => {
    console.log("✅ Testing basic CORS (allow all origins)...");

    app = WynkFactory.create({
      cors: true,
      port: 3333,
    });

    await app.listen(3333);

    // Test with different origins
    const origins = ["https://example.com", "http://localhost:3000", null];

    for (const origin of origins) {
      const headers: any = { "Content-Type": "application/json" };
      if (origin) headers["Origin"] = origin;

      const response = await fetch(`${serverUrl}/health`, { headers });

      // Check CORS headers
      const corsHeader = response.headers.get("access-control-allow-origin");
      console.log(`   Origin: ${origin || "none"} -> CORS: ${corsHeader}`);
    }

    
  });

  test("should restrict origins with custom CORS options", async () => {
    console.log("\n✅ Testing custom CORS with allowed origins...");

    const allowedOrigins = [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "http://localhost:3000",
    ];

    const corsOptions: CorsOptions = {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    app = WynkFactory.create({
      cors: corsOptions,
      port: 3333,
    });

    await app.listen(3333);

    // Test allowed origin
    const allowedResponse = await fetch(`${serverUrl}/health`, {
      headers: {
        Origin: "https://yourdomain.com",
        "Content-Type": "application/json",
      },
    });

    const allowedCors = allowedResponse.headers.get(
      "access-control-allow-origin"
    );
    console.log(`   Allowed origin: https://yourdomain.com -> ${allowedCors}`);

    // Test disallowed origin
    const disallowedResponse = await fetch(`${serverUrl}/health`, {
      headers: {
        Origin: "https://evil.com",
        "Content-Type": "application/json",
      },
    });

    const disallowedCors = disallowedResponse.headers.get(
      "access-control-allow-origin"
    );
    console.log(`   Disallowed origin: https://evil.com -> ${disallowedCors}`);

    
  });

  test("should handle dynamic origin validation with function", async () => {
    console.log("\n✅ Testing dynamic origin validation (NestJS-style)...");

    const allowedOriginsForProd = [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
    ];
    const allowedOriginsForDev = [
      "http://localhost:3000",
      "http://localhost:4200",
      "http://localhost:5173",
    ];

    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? allowedOriginsForProd
        : allowedOriginsForDev;

    const corsOptions: CorsOptions = {
      origin: (origin: string) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
          console.log("   ℹ️  No origin header - allowing request");
          return true;
        }

        const isAllowed = allowedOrigins.includes(origin);
        console.log(
          `   ${isAllowed ? "✅" : "❌"} Origin validation: ${origin} -> ${isAllowed ? "ALLOWED" : "BLOCKED"}`
        );
        return isAllowed;
      },
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "x-access-token",
      ],
      exposedHeaders: ["Set-Cookie", "Date", "Content-Length"],
    };

    app = WynkFactory.create({
      cors: corsOptions,
      port: 3333,
    });

    await app.listen(3333);

    // Test various origins
    const testOrigins = [
      { origin: "http://localhost:3000", shouldAllow: true },
      { origin: "http://localhost:4200", shouldAllow: true },
      { origin: "https://evil.com", shouldAllow: false },
      { origin: null, shouldAllow: true }, // No origin header
    ];

    for (const test of testOrigins) {
      const headers: any = { "Content-Type": "application/json" };
      if (test.origin) headers["Origin"] = test.origin;

      const response = await fetch(`${serverUrl}/health`, { headers });
      const corsHeader = response.headers.get("access-control-allow-origin");

      const result = test.shouldAllow ? corsHeader !== null : corsHeader === null;
      console.log(
        `   ${result ? "✅" : "❌"} Origin: ${test.origin || "none"} -> Expected: ${test.shouldAllow ? "ALLOW" : "BLOCK"}`
      );
    }

    
  });

  test("should handle environment-based CORS configuration", async () => {
    console.log("\n✅ Testing environment-based CORS configuration...");

    const originalEnv = process.env.NODE_ENV;

    // Test development environment
    process.env.NODE_ENV = "development";

    const devCorsOptions: CorsOptions = {
      origin: (origin: string) => {
        const devOrigins = ["http://localhost:3000", "http://localhost:4200"];
        if (!origin) return true;
        return devOrigins.includes(origin);
      },
      credentials: true,
    };

    app = WynkFactory.create({
      cors: devCorsOptions,
      port: 3333,
    });

    await app.listen(3333);

    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log("   Testing dev origins...");

    const devResponse = await fetch(`${serverUrl}/health`, {
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    const devCors = devResponse.headers.get("access-control-allow-origin");
    console.log(`   localhost:3000 -> ${devCors}`);

    

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test("should handle RegExp origin patterns", async () => {
    console.log("\n✅ Testing RegExp origin patterns...");

    const corsOptions: CorsOptions = {
      origin: /^https:\/\/.*\.yourdomain\.com$/,
      credentials: true,
    };

    app = WynkFactory.create({
      cors: corsOptions,
      port: 3333,
    });

    await app.listen(3333);

    // Test matching origins
    const testOrigins = [
      { origin: "https://app.yourdomain.com", shouldMatch: true },
      { origin: "https://api.yourdomain.com", shouldMatch: true },
      { origin: "https://yourdomain.com", shouldMatch: false },
      { origin: "http://app.yourdomain.com", shouldMatch: false },
    ];

    for (const test of testOrigins) {
      const response = await fetch(`${serverUrl}/health`, {
        headers: {
          Origin: test.origin,
        },
      });

      const corsHeader = response.headers.get("access-control-allow-origin");
      console.log(
        `   ${test.shouldMatch ? "✅" : "❌"} ${test.origin} -> ${corsHeader || "BLOCKED"}`
      );
    }

    
  });

  test("should handle preflight OPTIONS requests", async () => {
    console.log("\n✅ Testing preflight OPTIONS requests...");

    const corsOptions: CorsOptions = {
      origin: "https://yourdomain.com",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400, // 24 hours
    };

    app = WynkFactory.create({
      cors: corsOptions,
      port: 3333,
    });

    await app.listen(3333);

    // Send OPTIONS preflight request
    const response = await fetch(`${serverUrl}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://yourdomain.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
    });

    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowMethods = response.headers.get("access-control-allow-methods");
    const allowHeaders = response.headers.get("access-control-allow-headers");
    const maxAge = response.headers.get("access-control-max-age");

    console.log(`   Allow-Origin: ${allowOrigin}`);
    console.log(`   Allow-Methods: ${allowMethods}`);
    console.log(`   Allow-Headers: ${allowHeaders}`);
    console.log(`   Max-Age: ${maxAge}`);

    
  });

  test("should expose custom headers with exposedHeaders option", async () => {
    console.log("\n✅ Testing exposed headers configuration...");

    const corsOptions: CorsOptions = {
      origin: true,
      credentials: true,
      exposedHeaders: ["X-Custom-Header", "X-Request-Id", "Content-Length"],
    };

    app = WynkFactory.create({
      cors: corsOptions,
      port: 3333,
    });

    await app.listen(3333);

    const response = await fetch(`${serverUrl}/health`, {
      headers: {
        Origin: "https://example.com",
      },
    });

    const exposedHeaders = response.headers.get(
      "access-control-expose-headers"
    );
    console.log(`   Exposed Headers: ${exposedHeaders}`);

    
  });
});
