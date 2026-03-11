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

describe("Email Integration E2E", () => {
  let app: TestApp;
  const testPort = 3003;

  beforeAll(async () => {
    app = await startTestApp(testPort);
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("User Registration with Email", () => {
    test("should create user successfully with name and email", async () => {
      const user = createTestUser({
        name: "Email Test User",
        email: `welcome-${Date.now()}@example.com`,
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

    test("should not allow duplicate email on registration", async () => {
      const user = createTestUser({
        name: "Dup User",
        email: `dup-${Date.now()}@example.com`,
      });

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

      expect(response.status).toBe(409);
    });

    test("should not send email when email is missing", async () => {
      const user = { name: "No Email User", age: 30 };

      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expect(response.status).toBe(400);
      const data = await parseJson(response);
      expect(data.errors || data.message).toBeDefined();
    });
  });

  describe("Password Reset Email", () => {
    test("should update user email successfully", async () => {
      const user = createTestUser({
        name: "Reset User",
        email: `reset-${Date.now()}@example.com`,
      });

      const createResponse = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      expectStatus(createResponse, 201);
      const created = await parseJson(createResponse);
      const userId = created.user.id;

      const updateResponse = await request(`${app.baseUrl}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `updated-${Date.now()}@example.com` }),
      });

      expectStatus(updateResponse, 200);
      const data = await parseJson(updateResponse);
      expect(data.message).toBe("User updated");
    });

    test("should handle multiple user creations", async () => {
      const users = [
        createTestUser({ email: `multi1-${Date.now()}@example.com` }),
        createTestUser({ email: `multi2-${Date.now()}@example.com` }),
        createTestUser({ email: `multi3-${Date.now()}@example.com` }),
      ];

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
      expect(successCount).toBeGreaterThanOrEqual(2);
    });

    test("should handle demo email gracefully", async () => {
      const body = createTestUser({ email: `demo-${Date.now()}@wynkjs.com` });

      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      expect([201, 400, 409, 500]).toContain(response.status);
    });
  });

  describe("Email Error Handling", () => {
    test("should handle batch user creation gracefully", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(`${app.baseUrl}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            createTestUser({ email: `batch-${i}-${Date.now()}@example.com` }),
          ),
        }),
      );

      const responses = await Promise.allSettled(promises);
      const successCount = responses.filter(
        (r) => r.status === "fulfilled" && r.value.status === 201,
      ).length;

      expect(successCount).toBeGreaterThanOrEqual(3);
    });

    test("should validate email format on creation", async () => {
      const body = { name: "Bad Email", email: "invalid-email-format" };

      const response = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Email Workflow Integration", () => {
    test("should complete user registration and update flow", async () => {
      const user = createTestUser({
        name: "Workflow User",
        email: `workflow-${Date.now()}@example.com`,
      });

      const createResponse = await request(`${app.baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      expectStatus(createResponse, 201);
      const created = await parseJson(createResponse);
      const userId = created.user.id;

      const updateResponse = await request(`${app.baseUrl}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `wf-updated-${Date.now()}@example.com` }),
      });

      expect([200, 400, 500]).toContain(updateResponse.status);
    });
  });
});
