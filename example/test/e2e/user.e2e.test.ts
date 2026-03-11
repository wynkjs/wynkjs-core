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
  const testPort = 3005;

  beforeAll(async () => {
    app = await startTestApp(testPort);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("GET /users/", () => {
    test("should return list of users", async () => {
      const response = await request(`${app.baseUrl}/users/`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    test("should include seeded users", async () => {
      const response = await request(`${app.baseUrl}/users/`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.users.length).toBeGreaterThanOrEqual(2);
    });

    test("should accept valid query parameters", async () => {
      const response = await request(
        `${app.baseUrl}/users/?includePosts=true&query1=hello`,
      );
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.users).toBeDefined();
      expect(data.query).toBeDefined();
    });
  });

  describe("GET /users/:id", () => {
    test("should return seeded user by id", async () => {
      const response = await request(`${app.baseUrl}/users/user-1`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe("user-1");
      expect(data.user.email).toBe("alice@example.com");
    });

    test("should return second seeded user", async () => {
      const response = await request(`${app.baseUrl}/users/user-2`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.user.id).toBe("user-2");
      expect(data.user.email).toBe("bob@example.com");
    });

    test("should return 404 for non-existent user", async () => {
      const response = await request(`${app.baseUrl}/users/ghost-999`);
      expectStatus(response, 404);

      const data = await parseJson(response);
      expect(data.message).toBeDefined();
    });
  });

  describe("POST /users/", () => {
    test("should create a user and return 201", async () => {
      const user = createTestUser({
        name: "John Doe",
        email: `john-${Date.now()}@example.com`,
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
      expect(data.user.id).toBeDefined();
    });

    test("should reject duplicate email with 409", async () => {
      const email = `dup-${Date.now()}@example.com`;
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

    test("should reject missing email with 400", async () => {
      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "No Email", age: 25 }),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors || data.message).toBeDefined();
    });

    test("should reject invalid email format with 400", async () => {
      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", age: 25 }),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors).toBeDefined();
    });

    test("should reject age below 18 with 400", async () => {
      const user = createTestUser({
        email: `young-${Date.now()}@example.com`,
        age: 10,
      });

      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors).toBeDefined();
    });

    test("should reject invalid mobile number with 400", async () => {
      const user = {
        email: `mobile-${Date.now()}@example.com`,
        mobile: "1234567890", // Invalid: must start with 6-9
        age: 25,
      };

      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors).toBeDefined();
      const mobileError = data.errors.find((e: any) => e.field === "mobile");
      expect(mobileError).toBeDefined();
      expect(mobileError.message).toBe("Invalid mobile number");
    });

    test("should accept valid mobile number", async () => {
      const user = {
        email: `mobile-valid-${Date.now()}@example.com`,
        mobile: "9876543210",
        age: 25,
      };

      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 201);
      const data = await parseJson(response);
      expect(data.user.mobile).toBe("9876543210");
    });
  });

  describe("PATCH /users/:id", () => {
    test("should update a seeded user", async () => {
      const response = await request(`${app.baseUrl}/users/user-2`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 35 }),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.message).toBe("User updated");
      expect(data.user.id).toBe("user-2");
    });

    test("should return 404 for non-existent user", async () => {
      const response = await request(`${app.baseUrl}/users/ghost-patch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 25 }),
      });

      expectStatus(response, 404);
      const data = await parseJson(response);
      expect(data.message).toBeDefined();
    });

    test("should include query in response", async () => {
      const response = await request(
        `${app.baseUrl}/users/user-1?query1=test`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ age: 28 }),
        },
      );

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.query).toBeDefined();
    });
  });

  describe("PUT /users/:id", () => {
    test("should replace a seeded user", async () => {
      const body = {
        email: `replaced-${Date.now()}@example.com`,
        name: "Replaced User",
        age: 30,
      };

      const response = await request(`${app.baseUrl}/users/user-2`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.message).toBe("User replaced");
      expect(data.user.id).toBe("user-2");
    });

    test("should return 404 for non-existent user", async () => {
      const response = await request(`${app.baseUrl}/users/ghost-put`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `ghost-${Date.now()}@example.com`,
          age: 25,
        }),
      });

      expectStatus(response, 404);
    });
  });

  describe("DELETE /users/:id", () => {
    test("should delete a newly created user", async () => {
      const createRes = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          createTestUser({ email: `delete-me-${Date.now()}@example.com` }),
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

    test("should return 404 when deleting non-existent user", async () => {
      const response = await request(`${app.baseUrl}/users/ghost-delete`, {
        method: "DELETE",
      });

      expectStatus(response, 404);
    });
  });

  describe("Concurrent Operations", () => {
    test("should handle multiple concurrent user creations", async () => {
      const timestamp = Date.now();
      const users = Array.from({ length: 5 }, (_, i) => ({
        email: `concurrent-${timestamp}-${i}@example.com`,
        age: 20 + i,
      }));

      const responses = await Promise.all(
        users.map((user) =>
          request(`${app.baseUrl}/users/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          }),
        ),
      );

      const successCount = responses.filter((r) => r.status === 201).length;
      expect(successCount).toBe(5);
    });
  });
});
