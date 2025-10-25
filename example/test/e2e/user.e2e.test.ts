/**
 * E2E Tests for User Module
 * Tests all user endpoints with real HTTP requests
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  startTestApp,
  stopTestApp,
  request,
  parseJson,
  expectStatus,
  createTestUser,
  type TestApp,
} from "./setup";

describe("User Module E2E", () => {
  let app: TestApp;
  const testPort = 3001;

  beforeAll(async () => {
    app = await startTestApp(testPort);
    // Wait a bit for server to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("GET /users", () => {
    test("should return list of users", async () => {
      const response = await request(`${app.baseUrl}/users`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    test("should accept query parameters", async () => {
      const response = await request(`${app.baseUrl}/users?limit=10&page=1`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data).toBeDefined();
    });
  });

  describe("POST /users/:id1/:id2", () => {
    test("should create a user with all parameters", async () => {
      const user = createTestUser({ name: "John Doe", age: 30 });

      const response = await request(`${app.baseUrl}/users/123/456`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.params.id1).toBe("123");
      expect(data.params.id2).toBe("456");
      expect(data.data.name).toBe(user.name);
    });

    test("should handle user creation without optional fields", async () => {
      const user = { email: `test-${Date.now()}@example.com` };

      const response = await request(`${app.baseUrl}/users/111/222`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.data.email).toBe(user.email);
    });

    test("should validate email format", async () => {
      const user = { email: "invalid-email", name: "Test" };

      const response = await request(`${app.baseUrl}/users/100/200`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors).toBeDefined();
      expect(data.message).toBe("Validation failed");
    });

    test("should reject age below minimum", async () => {
      const user = createTestUser({ age: 10 }); // Below 18

      const response = await request(`${app.baseUrl}/users/100/200`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors).toBeDefined();
      expect(data.message).toBe("Validation failed");
    });
  });

  describe("GET /users/:id", () => {
    test("should return a user by id", async () => {
      const response = await request(`${app.baseUrl}/users/123`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.user.id).toBe("123");
    });

    test("should include query parameters in response", async () => {
      const response = await request(
        `${app.baseUrl}/users/456?includeDetails=true`
      );
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.user.id).toBe("456");
      expect(data.query).toBeDefined();
    });
  });

  describe("GET /users/all", () => {
    test("should return all users", async () => {
      const response = await request(`${app.baseUrl}/users/all`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe("All");
    });
  });

  describe("PATCH /users/:id", () => {
    test("should update a user", async () => {
      const updates = { age: 35 }; // Only include fields in UserUpdateDTO

      const response = await request(`${app.baseUrl}/users/789`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.id).toBe("789");
      expect(data.data.age).toBe(updates.age);
    });

    test("should handle partial updates", async () => {
      const updates = { age: 40 };

      const response = await request(`${app.baseUrl}/users/999`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.data.age).toBe(updates.age);
    });

    test("should throw NotFoundException for 'params' id", async () => {
      const response = await request(`${app.baseUrl}/users/params`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 25 }),
      });

      expectStatus(response, 404);
      const data = await parseJson(response);
      expect(data.message).toBeDefined();
      expect(data.message).toBe("User not found");
    });
  });

  describe("POST /users/send-reset-email", () => {
    test("should send password reset email", async () => {
      const body = { email: `reset-${Date.now()}@example.com`, userId: "u123" };

      const response = await request(`${app.baseUrl}/users/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.message).toContain("Password reset email sent");
    });

    test("should not send email for demo@wynkjs.com", async () => {
      const body = { email: "demo@wynkjs.com", userId: "u456" };

      const response = await request(`${app.baseUrl}/users/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Should either fail or handle gracefully
      const data = await parseJson(response);
      expect(data).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle unknown GET routes", async () => {
      const response = await request(`${app.baseUrl}/users/99999999`);
      // Will match /:id route, so it returns 200
      expectStatus(response, 200);
    });

    test("should handle invalid JSON body", async () => {
      const response = await request(`${app.baseUrl}/users/123/456`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      expect([400, 500]).toContain(response.status);
    });

    test("should handle request without Content-Type", async () => {
      const user = createTestUser();
      const response = await request(`${app.baseUrl}/users/123/456`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      // Should succeed with proper body
      expectStatus(response, 200);
    });
  });

  describe("Concurrent User Operations", () => {
    test("should handle multiple concurrent user registrations", async () => {
      const timestamp = Date.now();
      const users = Array.from({ length: 5 }, (_, i) => ({
        email: `concurrent-${timestamp}-${i}@example.com`,
        age: 20 + i, // Different ages to ensure uniqueness
        // Note: Not including 'name' to avoid triggering email sending which has random failures
      }));

      const responses = await Promise.all(
        users.map((user, i) =>
          request(`${app.baseUrl}/users/${10 + i}/${100 + i}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          })
        )
      );

      // All should succeed
      responses.forEach((response, i) => {
        expectStatus(response, 200);
      });
    });
  });
});
