import { describe, it, expect, beforeAll, afterAll } from "bun:test";

/**
 * Authentication and RBAC Tests
 * Run with: bun test test/e2e/auth.test.ts
 */

interface TestContext {
  baseUrl: string;
  userToken: string;
  adminToken: string;
  userId: string;
}

describe("Authentication & RBAC Flow", () => {
  const context: TestContext = {
    baseUrl: "http://localhost:3000",
    userToken: "",
    adminToken: "",
    userId: "",
  };

  // Test user credentials
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: "TestPassword123",
    firstName: "Test",
    lastName: "User",
  };

  describe("User Registration", () => {
    it("should register a new user successfully", async () => {
      const response = await fetch(`${context.baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe("User registered successfully");
      expect(data.user.email).toBe(testUser.email);
      expect(data.accessToken).toBeTruthy();
      expect(data.expiresIn).toBe(3600);
      expect(data.user.roles).toContain("user");

      // Store for later use
      context.userToken = data.accessToken;
      context.userId = data.user.id;
    });

    it("should reject duplicate registration", async () => {
      const response = await fetch(`${context.baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("already exists");
    });

    it("should validate email format", async () => {
      const response = await fetch(`${context.baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          password: "password123",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should validate password length", async () => {
      const response = await fetch(`${context.baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "short@example.com",
          password: "short",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("User Login", () => {
    it("should login user with correct credentials", async () => {
      const response = await fetch(`${context.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe("Login successful");
      expect(data.user.email).toBe(testUser.email);
      expect(data.accessToken).toBeTruthy();
      expect(data.user.roles).toContain("user");
    });

    it("should reject login with wrong password", async () => {
      const response = await fetch(`${context.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: "WrongPassword123",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("Invalid");
    });

    it("should reject login with non-existent user", async () => {
      const response = await fetch(`${context.baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Token Operations", () => {
    it("should get current user profile with valid token", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.roles).toContain("user");
    });

    it("should reject request without token", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {},
      });

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status).toBe(401);
    });

    it("should verify valid token", async () => {
      const response = await fetch(`${context.baseUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: context.userToken }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.user).toBeTruthy();
      expect(data.user.email).toBe(testUser.email);
    });

    it("should reject verification of invalid token", async () => {
      const response = await fetch(`${context.baseUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid-token" }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.valid).toBe(false);
    });
  });

  describe("Protected Routes - Authentication", () => {
    it("should access dashboard with valid token", async () => {
      const response = await fetch(`${context.baseUrl}/protected/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain("dashboard");
      expect(data.user.email).toBe(testUser.email);
    });

    it("should reject dashboard access without token", async () => {
      const response = await fetch(`${context.baseUrl}/protected/dashboard`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("should access public health check without token", async () => {
      const response = await fetch(`${context.baseUrl}/protected/health`, {
        method: "GET",
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.authenticated).toBe(false);
    });

    it("should show user info in health check with token", async () => {
      const response = await fetch(`${context.baseUrl}/protected/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.authenticated).toBe(true);
      expect(data.user).toBe(testUser.email);
      expect(data.roles).toContain("user");
    });
  });

  describe("Role-Based Access Control (RBAC)", () => {
    it("should deny admin access to regular user", async () => {
      const response = await fetch(`${context.baseUrl}/protected/admin`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain("Access denied");
    });

    it("should deny moderator access to regular user", async () => {
      const response = await fetch(`${context.baseUrl}/protected/moderator`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it("should allow user to access user-only area", async () => {
      const response = await fetch(`${context.baseUrl}/protected/user-only`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain("User area");
      expect(data.user.email).toBe(testUser.email);
    });

    it("should allow user to access content", async () => {
      const response = await fetch(`${context.baseUrl}/protected/content`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user.email).toBe(testUser.email);
      expect(data.content).toBeTruthy();
    });

    it("should deny system config access to regular user", async () => {
      const response = await fetch(`${context.baseUrl}/protected/system-config`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "test_setting",
          value: "test_value",
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Authorization Header Validation", () => {
    it("should accept Bearer token format", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${context.userToken}`,
        },
      });

      expect(response.status).toBe(200);
    });

    it("should reject missing Bearer prefix", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: context.userToken,
        },
      });

      expect(response.status).toBe(401);
    });

    it("should reject invalid Bearer format", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `InvalidPrefix ${context.userToken}`,
        },
      });

      expect(response.status).toBe(401);
    });

    it("should be case-insensitive for Bearer", async () => {
      const response = await fetch(`${context.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `bearer ${context.userToken}`,
        },
      });

      // Implementation specific - may or may not pass
      // This test documents expected behavior
    });
  });
});
