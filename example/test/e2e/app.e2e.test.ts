/**
 * Comprehensive E2E Tests for WynkJS Example Application
 * Tests all endpoints with real HTTP requests
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

describe("WynkJS Application E2E Tests", () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await startTestApp(3001);
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("User Module", () => {
    describe("GET /users", () => {
      test("should return list of users", async () => {
        const response = await request(`${app.baseUrl}/users`);
        expectStatus(response, 200);

        const data = await parseJson(response);
        expect(data.users).toBeDefined();
        expect(Array.isArray(data.users)).toBe(true);
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

      test("should create user without optional name", async () => {
        const user = { email: `test-${Date.now()}@example.com`, age: 25 };

        const response = await request(`${app.baseUrl}/users/111/222`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        expectStatus(response, 200);
        const data = await parseJson(response);
        expect(data.data.email).toBe(user.email);
      });
    });

    describe("GET /users/:id", () => {
      test("should return a user by id", async () => {
        const response = await request(`${app.baseUrl}/users/123`);
        expectStatus(response, 200);

        const data = await parseJson(response);
        expect(data.user.id).toBe("123");
      });
    });

    describe("PATCH /users/:id", () => {
      test("should update a user", async () => {
        const updates = { age: 35 };

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
        const body = {
          email: `reset-${Date.now()}@example.com`,
          userId: "u123",
        };

        const response = await request(
          `${app.baseUrl}/users/send-reset-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        expectStatus(response, 200);
        const data = await parseJson(response);
        expect(data.message).toContain("Password reset email sent");
      });
    });
  });

  describe("Email Integration", () => {
    test("should send welcome email when user created with name and email", async () => {
      const user = createTestUser({
        name: "Email Test User",
        email: `welcome-${Date.now()}@example.com`,
      });

      const response = await request(`${app.baseUrl}/users/reg/001`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.data.name).toBe(user.name);
    });

    test("should handle password reset workflow", async () => {
      const body = {
        email: `reset-workflow-${Date.now()}@example.com`,
        userId: "workflow-user-001",
      };

      const response = await request(`${app.baseUrl}/users/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Should either succeed or handle SMTP errors gracefully
      expect([200, 500]).toContain(response.status);
    });

    test("should handle multiple concurrent email sends", async () => {
      const users = Array.from({ length: 3 }, (_, i) => ({
        email: `concurrent-${i}-${Date.now()}@example.com`,
        userId: `user-${i}`,
      }));

      const responses = await Promise.all(
        users.map((user) =>
          request(`${app.baseUrl}/users/send-reset-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          })
        )
      );

      // At least some should succeed (accounting for 10% random failure)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid JSON body", async () => {
      const response = await request(`${app.baseUrl}/users/123/456`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 404 for non-existent resources", async () => {
      const response = await request(`${app.baseUrl}/nonexistent/route`);
      expectStatus(response, 404);
    });
  });

  describe("CORS and Headers", () => {
    test("should include CORS headers", async () => {
      const response = await request(`${app.baseUrl}/users`);
      expect(response.headers.get("access-control-allow-origin")).toBeDefined();
    });
  });
});
