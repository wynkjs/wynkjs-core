import { describe, it, expect } from "bun:test";
import {
  normalizePrefixPath,
  validateGlobalPrefix,
  isRouteExcluded,
} from "../core/global-prefix";

/**
 * Global Prefix Module Test Suite
 * Tests global prefix functionality
 */

describe("Global Prefix Module", () => {
  describe("normalizePrefixPath", () => {
    it("should add leading slash if missing", () => {
      expect(normalizePrefixPath("api")).toBe("/api");
      expect(normalizePrefixPath("v1")).toBe("/v1");
    });

    it("should remove trailing slash", () => {
      expect(normalizePrefixPath("/api/")).toBe("/api");
      expect(normalizePrefixPath("/v1/")).toBe("/v1");
    });

    it("should keep single slash", () => {
      expect(normalizePrefixPath("/")).toBe("/");
    });

    it("should handle nested paths", () => {
      expect(normalizePrefixPath("/api/v1")).toBe("/api/v1");
      expect(normalizePrefixPath("api/v1/")).toBe("/api/v1");
    });

    it("should handle empty string", () => {
      expect(normalizePrefixPath("")).toBe("");
      // Whitespace-only strings normalize to "/"
      expect(normalizePrefixPath("   ")).toBe("/");
    });

    it("should trim whitespace", () => {
      expect(normalizePrefixPath("  /api  ")).toBe("/api");
    });

    it("should throw error for invalid characters", () => {
      expect(() => normalizePrefixPath("/api v1")).toThrow(
        "Invalid global prefix format"
      );
      expect(() => normalizePrefixPath("/api@v1")).toThrow(
        "Invalid global prefix format"
      );
    });

    it("should allow hyphens and underscores", () => {
      expect(normalizePrefixPath("/api-v1")).toBe("/api-v1");
      expect(normalizePrefixPath("/api_v1")).toBe("/api_v1");
    });
  });

  describe("validateGlobalPrefix", () => {
    it("should validate string prefix", () => {
      expect(validateGlobalPrefix("/api")).toBe(true);
      expect(validateGlobalPrefix("api")).toBe(true);
      expect(validateGlobalPrefix("/api/v1")).toBe(true);
    });

    it("should validate object prefix", () => {
      expect(
        validateGlobalPrefix({
          prefix: "/api",
        })
      ).toBe(true);

      expect(
        validateGlobalPrefix({
          prefix: "/api",
          exclude: ["/health", "/metrics"],
        })
      ).toBe(true);
    });

    it("should throw error for empty string prefix", () => {
      expect(() => validateGlobalPrefix("")).toThrow(
        "Global prefix cannot be an empty string"
      );
    });

    it("should throw error for object without prefix", () => {
      expect(() =>
        validateGlobalPrefix({
          exclude: ["/health"],
        } as any)
      ).toThrow("GlobalPrefixOptions must have a 'prefix' property");
    });

    it("should throw error for non-string prefix in object", () => {
      expect(() =>
        validateGlobalPrefix({
          prefix: 123,
        } as any)
      ).toThrow("Global prefix must be a string");
    });

    it("should throw error for non-array exclude", () => {
      expect(() =>
        validateGlobalPrefix({
          prefix: "/api",
          exclude: "/health" as any,
        })
      ).toThrow("GlobalPrefixOptions.exclude must be an array");
    });

    it("should throw error for invalid exclude array items", () => {
      expect(() =>
        validateGlobalPrefix({
          prefix: "/api",
          exclude: [123, 456] as any,
        })
      ).toThrow("All routes in GlobalPrefixOptions.exclude must be strings");
    });

    it("should throw error for invalid type", () => {
      expect(() => validateGlobalPrefix(123 as any)).toThrow(
        "Global prefix must be string or GlobalPrefixOptions object"
      );
    });
  });

  describe("isRouteExcluded", () => {
    it("should return false for empty exclusion list", () => {
      expect(isRouteExcluded("/users", [])).toBe(false);
    });

    it("should match exact route", () => {
      expect(isRouteExcluded("/health", ["/health"])).toBe(true);
      expect(isRouteExcluded("/metrics", ["/metrics"])).toBe(true);
    });

    it("should not match different route", () => {
      expect(isRouteExcluded("/users", ["/health"])).toBe(false);
    });

    it("should match wildcard routes", () => {
      expect(isRouteExcluded("/health/status", ["/health/*"])).toBe(true);
      expect(isRouteExcluded("/health/check", ["/health/*"])).toBe(true);
    });

    it("should not match routes outside wildcard base", () => {
      expect(isRouteExcluded("/users/list", ["/health/*"])).toBe(false);
    });

    it("should handle routes without leading slash", () => {
      expect(isRouteExcluded("health", ["/health"])).toBe(true);
    });

    it("should handle multiple exclusions", () => {
      const excluded = ["/health", "/metrics", "/admin/*"];

      expect(isRouteExcluded("/health", excluded)).toBe(true);
      expect(isRouteExcluded("/metrics", excluded)).toBe(true);
      expect(isRouteExcluded("/admin/dashboard", excluded)).toBe(true);
      expect(isRouteExcluded("/users", excluded)).toBe(false);
    });
  });

  describe("Global Prefix Integration", () => {
    it("should handle common prefixes", () => {
      expect(normalizePrefixPath("/api")).toBe("/api");
      expect(normalizePrefixPath("/v1")).toBe("/v1");
      expect(normalizePrefixPath("/api/v1")).toBe("/api/v1");
    });

    it("should validate typical configurations", () => {
      expect(
        validateGlobalPrefix({
          prefix: "/api",
          exclude: ["/health", "/metrics", "/docs"],
        })
      ).toBe(true);
    });

    it("should handle prefix with route exclusions", () => {
      const excluded = ["/health", "/metrics"];

      expect(isRouteExcluded("/api/users", excluded)).toBe(false);
      expect(isRouteExcluded("/health", excluded)).toBe(true);
    });
  });
});
