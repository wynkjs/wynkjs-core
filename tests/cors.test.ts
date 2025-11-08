// @ts-nocheck
import { describe, it, expect } from "bun:test";
import { WynkFactory } from "../core/factory";
import { Controller, Get, Post } from "../core";
import "reflect-metadata";

/**
 * CORS Configuration Tests
 * Tests CORS setup with various configurations
 */

@Controller("/api/test")
class TestController {
  @Get("/")
  async test() {
    return { message: "CORS test" };
  }

  @Post("/")
  async create() {
    return { created: true };
  }
}

describe("CORS Configuration", () => {
  it("should create app with basic CORS enabled", async () => {
    const app = WynkFactory.create({
      controllers: [TestController],
      cors: true,
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should create app with custom CORS options", async () => {
    const app = WynkFactory.create({
      controllers: [TestController],
      cors: {
        origin: ["http://localhost:3000", "http://localhost:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Set-Cookie"],
      },
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should create app with dynamic origin function", async () => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://braindost.tech",
    ];

    const app = WynkFactory.create({
      controllers: [TestController],
      cors: {
        origin: (origin: string) => {
          if (!origin) return true; // Allow no-origin requests
          return allowedOrigins.includes(origin);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Authorization",
          "x-access-token",
        ],
        exposedHeaders: ["Set-Cookie", "Date", "Content-Length"],
        maxAge: 86400,
        preflight: true,
      },
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should create app with RegExp origin", async () => {
    const app = WynkFactory.create({
      controllers: [TestController],
      cors: {
        origin: /^https:\/\/.*\.braindost\.tech$/,
        credentials: true,
      },
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should create app with single origin string", async () => {
    const app = WynkFactory.create({
      controllers: [TestController],
      cors: {
        origin: "https://braindost.tech",
        credentials: true,
        methods: "GET,POST,PUT,DELETE",
        allowedHeaders: "Content-Type,Authorization",
        exposedHeaders: "Set-Cookie",
      },
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should create app without CORS", async () => {
    const app = WynkFactory.create({
      controllers: [TestController],
      // No cors option
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should handle environment-based CORS configuration", async () => {
    const allowedOriginsForProd = [
      "https://www.braindost.tech",
      "https://braindost.tech",
    ];

    const allowedOriginsForDev = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://192.168.1.14:3000",
    ];

    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? allowedOriginsForProd
        : allowedOriginsForDev;

    const app = WynkFactory.create({
      controllers: [TestController],
      cors: {
        origin: (origin: string) => {
          if (!origin) return true;
          return allowedOrigins.includes(origin);
        },
        credentials: true,
        methods: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Origin",
          "X-Requested-With",
          "Content-Type",
          "Accept",
          "Cache-Control",
          "Range",
          "Authorization",
          "x-access-token",
          "x-csrf-token",
        ],
        exposedHeaders: ["Set-Cookie", "Date", "Content-Length"],
      },
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });
});
