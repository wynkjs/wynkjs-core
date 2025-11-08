import { describe, it, expect, mock } from "bun:test";
import { setupCors, validateCorsOptions } from "../core/cors";
import { Elysia } from "elysia";

/**
 * CORS Module Test Suite
 * Tests CORS configuration functionality
 */

describe("CORS Module", () => {
  describe("setupCors", () => {
    it("should setup basic CORS when true is passed", () => {
      const app = new Elysia();
      const consoleLogSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleLogSpy;

      setupCors(app, true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✅ CORS enabled (all origins allowed)"
      );

      console.log = originalLog;
    });

    it("should setup advanced CORS with custom config", () => {
      const app = new Elysia();
      const consoleLogSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleLogSpy;

      setupCors(app, {
        origin: "https://example.com",
        methods: ["GET", "POST"],
        credentials: true,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✅ CORS enabled with custom configuration"
      );

      console.log = originalLog;
    });

    it("should handle function-based origin validator", () => {
      const app = new Elysia();
      const originValidator = (origin: string) => {
        return origin === "https://allowed.com";
      };

      expect(() => {
        setupCors(app, {
          origin: originValidator,
        });
      }).not.toThrow();
    });

    it("should handle array of allowed origins", () => {
      const app = new Elysia();

      expect(() => {
        setupCors(app, {
          origin: ["https://example.com", "https://app.example.com"],
        });
      }).not.toThrow();
    });

    it("should handle RegExp origin", () => {
      const app = new Elysia();

      expect(() => {
        setupCors(app, {
          origin: /^https:\/\/.*\.example\.com$/,
        });
      }).not.toThrow();
    });
  });

  describe("validateCorsOptions", () => {
    it("should validate boolean CORS options", () => {
      expect(validateCorsOptions(true)).toBe(true);
      expect(validateCorsOptions(false)).toBe(true);
    });

    it("should validate object CORS options", () => {
      expect(
        validateCorsOptions({
          origin: "https://example.com",
          methods: ["GET", "POST"],
          credentials: true,
        })
      ).toBe(true);
    });

    it("should validate array origin", () => {
      expect(
        validateCorsOptions({
          origin: ["https://example.com", "https://app.example.com"],
        })
      ).toBe(true);
    });

    it("should validate function origin", () => {
      expect(
        validateCorsOptions({
          origin: (origin: string) => true,
        })
      ).toBe(true);
    });

    it("should throw error for invalid origin array", () => {
      expect(() => {
        validateCorsOptions({
          origin: [123, 456] as any,
        });
      }).toThrow("CORS origin array must contain only strings");
    });

    it("should throw error for invalid methods type", () => {
      expect(() => {
        validateCorsOptions({
          methods: 123 as any,
        });
      }).toThrow("CORS methods must be string or array of strings");
    });

    it("should throw error for invalid maxAge type", () => {
      expect(() => {
        validateCorsOptions({
          maxAge: "invalid" as any,
        });
      }).toThrow("CORS maxAge must be a number");
    });

    it("should throw error for invalid credentials type", () => {
      expect(() => {
        validateCorsOptions({
          credentials: "yes" as any,
        });
      }).toThrow("CORS credentials must be a boolean");
    });

    it("should throw error for invalid CORS options type", () => {
      expect(() => {
        validateCorsOptions("invalid" as any);
      }).toThrow("CORS options must be boolean or CorsOptions object");
    });
  });

  describe("CORS configuration options", () => {
    it("should accept all CORS options", () => {
      const app = new Elysia();

      expect(() => {
        setupCors(app, {
          origin: "https://example.com",
          methods: ["GET", "POST", "PUT", "DELETE"],
          allowedHeaders: ["Content-Type", "Authorization"],
          exposedHeaders: ["X-Custom-Header"],
          credentials: true,
          maxAge: 86400,
          preflight: true,
        });
      }).not.toThrow();
    });

    it("should handle string methods", () => {
      const app = new Elysia();

      expect(() => {
        setupCors(app, {
          methods: "GET,POST,PUT",
        });
      }).not.toThrow();
    });

    it("should handle string allowed headers", () => {
      const app = new Elysia();

      expect(() => {
        setupCors(app, {
          allowedHeaders: "Content-Type,Authorization",
        });
      }).not.toThrow();
    });
  });
});
