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
    app = await startTestApp(3006);
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("User Module", () => {
    describe("GET /users/", () => {
      test("should return list of users", async () => {
        const response = await request(`${app.baseUrl}/users/`);
        expectStatus(response, 200);

        const data = await parseJson(response);
        expect(data.users).toBeDefined();
        expect(Array.isArray(data.users)).toBe(true);
      });

      test("should include seeded users in response", async () => {
        const response = await request(`${app.baseUrl}/users/`);
        expectStatus(response, 200);

        const data = await parseJson(response);
        expect(data.users.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("GET /users/:id", () => {
      test("should return a seeded user by id", async () => {
        const response = await request(`${app.baseUrl}/users/user-1`);
        expectStatus(response, 200);

        const data = await parseJson(response);
        expect(data.user.id).toBe("user-1");
        expect(data.user.email).toBe("alice@example.com");
      });

      test("should return 404 for non-existent user", async () => {
        const response = await request(`${app.baseUrl}/users/no-such-user`);
        expectStatus(response, 404);
      });
    });

    describe("POST /users/", () => {
      test("should create a user with all parameters", async () => {
        const user = createTestUser({
          name: "John Doe",
          email: `app-e2e-${Date.now()}@example.com`,
          age: 30,
        });

        const response = await request(`${app.baseUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        expectStatus(response, 201);
        const data = await parseJson(response);
        expect(data.message).toBe("User created");
        expect(data.user.email).toBe(user.email);
      });

      test("should create user without optional name", async () => {
        const user = {
          email: `app-no-name-${Date.now()}@example.com`,
          age: 25,
        };

        const response = await request(`${app.baseUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        expectStatus(response, 201);
        const data = await parseJson(response);
        expect(data.user.email).toBe(user.email);
      });

      test("should reject duplicate email with 409", async () => {
        const email = `app-dup-${Date.now()}@example.com`;
        const user = createTestUser({ email });

        await request(`${app.baseUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        const response = await request(`${app.baseUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        expectStatus(response, 409);
      });
    });

    describe("PATCH /users/:id", () => {
      test("should update a seeded user", async () => {
        const updates = { age: 35 };

        const response = await request(`${app.baseUrl}/users/user-2`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        expectStatus(response, 200);
        const data = await parseJson(response);
        expect(data.message).toBe("User updated");
        expect(data.user.id).toBe("user-2");
      });

      test("should return 404 for non-existent user on PATCH", async () => {
        const response = await request(`${app.baseUrl}/users/ghost-app`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ age: 25 }),
        });

        expectStatus(response, 404);
      });
    });

    describe("DELETE /users/:id", () => {
      test("should delete a created user", async () => {
        const createRes = await request(`${app.baseUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            createTestUser({ email: `app-delete-${Date.now()}@example.com` }),
          ),
        });
        expectStatus(createRes, 201);
        const created = await parseJson(createRes);
        const userId = created.user.id;

        const deleteRes = await request(`${app.baseUrl}/users/${userId}`, {
          method: "DELETE",
        });

        expectStatus(deleteRes, 200);
        const data = await parseJson(deleteRes);
        expect(data.message).toBe("User deleted");
        expect(data.id).toBe(userId);
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid JSON body", async () => {
      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 404 for non-existent routes", async () => {
      const response = await request(`${app.baseUrl}/nonexistent/route`);
      expectStatus(response, 404);
    });
  });

  describe("CORS and Headers", () => {
    test("should include CORS headers", async () => {
      const response = await request(`${app.baseUrl}/users/`);
      expect(response.headers.get("access-control-allow-origin")).toBeDefined();
    });
  });
});
