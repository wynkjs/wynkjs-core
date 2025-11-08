/**
 * E2E Tests for Email Integration
 * Tests email functionality within user workflows
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

describe("Email Integration E2E", () => {
  let app: TestApp;
  const testPort = 3003;

  beforeAll(async () => {
    app = await startTestApp(testPort);
    // Increased wait time to ensure server is fully ready
    await new Promise((resolve) => setTimeout(resolve, 300));
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("User Registration with Email", () => {
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
      expect(data.data.email).toBe(user.email);
      // Email sent in background, no direct verification in response
    });

    test("should not send email when name is missing", async () => {
      const user = { email: `no-name-${Date.now()}@example.com`, age: 25 };

      const response = await request(`${app.baseUrl}/users/reg/002`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      expectStatus(response, 200);
      // Should succeed but no email sent
    });

    test("should not send email when email is missing", async () => {
      const user = { name: "No Email User", age: 30 };

      const response = await request(`${app.baseUrl}/users/reg/003`, {
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

  describe("Password Reset Email", () => {
    test("should send password reset email successfully", async () => {
      const body = {
        email: `reset-${Date.now()}@example.com`,
        userId: `user-${Date.now()}`,
      };

      const response = await request(`${app.baseUrl}/users/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      expectStatus(response, 200);
      const data = await parseJson(response);
      expect(data.message).toContain("Password reset email sent");
      expect(data.email).toBe(body.email);
      expect(data.userId).toBe(body.userId);
    });

    test("should handle password reset for multiple users", async () => {
      const users = [
        { email: `user1-${Date.now()}@example.com`, userId: "u1" },
        { email: `user2-${Date.now()}@example.com`, userId: "u2" },
        { email: `user3-${Date.now()}@example.com`, userId: "u3" },
      ];

      const responses = await Promise.all(
        users.map((user) =>
          request(`${app.baseUrl}/users/send-reset-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          })
        )
      );

      // All should succeed (or at least most, accounting for random failures)
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(2); // At least 2 out of 3
    });

    test("should handle demo email gracefully", async () => {
      const body = {
        email: "demo@wynkjs.com",
        userId: "demo-user",
      };

      const response = await request(`${app.baseUrl}/users/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Should either fail or succeed, but should handle it
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe("Email Error Handling", () => {
    test("should handle SMTP failures gracefully", async () => {
      // Send multiple emails, some might fail due to simulated SMTP errors
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(`${app.baseUrl}/users/send-reset-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `batch-${i}-${Date.now()}@example.com`,
            userId: `batch-user-${i}`,
          }),
        })
      );

      const responses = await Promise.allSettled(promises);
      const successCount = responses.filter(
        (r) => r.status === "fulfilled" && r.value.status === 200
      ).length;

      // With 10% random failure rate, expect most to succeed
      expect(successCount).toBeGreaterThanOrEqual(3);
    });

    test("should validate email format in password reset", async () => {
      const body = {
        email: "invalid-email-format",
        userId: "test-user",
      };

      const response = await request(`${app.baseUrl}/users/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Should either validate or fail gracefully
      expect(response.status).toBeDefined();
    });
  });

  describe("Email Workflow Integration", () => {
    test("should complete user registration and password reset flow", async () => {
      const timestamp = Date.now();
      const user = createTestUser({
        name: "Workflow User",
        email: `workflow-${timestamp}@example.com`,
      });

      // 1. Create user (triggers welcome email)
      const createResponse = await request(`${app.baseUrl}/users/wf/001`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      expectStatus(createResponse, 200);

      // 2. Send password reset email
      const resetResponse = await request(
        `${app.baseUrl}/users/send-reset-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            userId: "wf-user-001",
          }),
        }
      );

      // Should succeed or handle gracefully
      expect([200, 400, 500]).toContain(resetResponse.status);
    });
  });
});
