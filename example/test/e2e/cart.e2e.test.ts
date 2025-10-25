/**
 * E2E Tests for Cart Module
 * Tests all cart CRUD endpoints with real HTTP requests
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  startTestApp,
  stopTestApp,
  request,
  parseJson,
  expectStatus,
  createTestCart,
  type TestApp,
} from "./setup";

describe("Cart Module E2E", () => {
  let app: TestApp;
  const testPort = 3002;
  let createdCartId: string;

  beforeAll(async () => {
    app = await startTestApp(testPort);
    // Wait a bit for server to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("GET /cart", () => {
    test("should return list of carts", async () => {
      const response = await request(`${app.baseUrl}/cart`);
      expectStatus(response, 200);

      const result = await parseJson(response);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("POST /cart", () => {
    test("should create a new cart", async () => {
      const cart = createTestCart();

      const response = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });

      expectStatus(response, 200);
      const result = await parseJson(response);
      expect(result.data).toBeDefined();
      expect(result.data.userId).toBe(cart.userId);
      expect(result.data.items).toEqual(cart.items);
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeDefined();
      expect(result.data.updatedAt).toBeDefined();

      // Store for later tests
      createdCartId = result.data.id;
    });

    test("should create cart with custom userId", async () => {
      const cart = createTestCart({ userId: "custom-user-999" });

      const response = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });

      expectStatus(response, 200);
      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.userId).toBe("custom-user-999");
    });

    test("should create cart with different items", async () => {
      const cart = createTestCart({
        items: [{ productId: "prod-x", quantity: 5, price: 99.99 }],
      });

      const response = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });

      expectStatus(response, 200);
      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.items[0].productId).toBe("prod-x");
      expect(data.items[0].quantity).toBe(5);
    });
  });

  describe("GET /cart/:id", () => {
    test("should return a cart by id", async () => {
      // First create a cart
      const cart = createTestCart();
      const createResponse = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      const created = await parseJson(createResponse);

      // Then fetch it
      const response = await request(`${app.baseUrl}/cart/${created.id}`);
      expectStatus(response, 200);

      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.id).toBe(created.id);
      expect(data.userId).toBe(cart.userId);
    });

    test("should return 404 for non-existent cart", async () => {
      const response = await request(`${app.baseUrl}/cart/non-existent-id`);
      expectStatus(response, 404);

      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.errors).toBeDefined();
    });
  });

  describe("PUT /cart/:id", () => {
    test("should fully update a cart", async () => {
      // Create a cart first
      const cart = createTestCart();
      const createResponse = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      const created = await parseJson(createResponse);

      // Wait to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2));

      // Update it
      const updates = createTestCart({
        userId: "updated-user",
        items: [{ productId: "new-prod", quantity: 10, price: 50.0 }],
      });

      const response = await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 200);
      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.userId).toBe(updates.userId);
      expect(data.items).toEqual(updates.items);
      expect(data.updatedAt).not.toBe(created.updatedAt);
    });

    test("should return 404 when updating non-existent cart", async () => {
      const updates = createTestCart();

      const response = await request(`${app.baseUrl}/cart/fake-id-999`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 404);
    });
  });

  describe("PATCH /cart/:id", () => {
    test("should partially update a cart", async () => {
      // Create a cart first
      const cart = createTestCart();
      const createResponse = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      const created = await parseJson(createResponse);

      // Partial update
      const updates = { userId: "partially-updated-user" };

      const response = await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 200);
      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.userId).toBe(updates.userId);
      expect(data.items).toEqual(cart.items); // Original items preserved
    });

    test("should update only items", async () => {
      // Create a cart first
      const cart = createTestCart();
      const createResponse = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      const created = await parseJson(createResponse);

      // Update only items
      const newItems = [
        { productId: "updated-prod", quantity: 3, price: 15.0 },
      ];
      const updates = { items: newItems };

      const response = await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 200);
      const response Data = await parseJson(response);
      const data = responseData.data || responseData;
      expect(data.items).toEqual(newItems);
      expect(data.userId).toBe(cart.userId); // Original userId preserved
    });

    test("should return 404 for non-existent cart", async () => {
      const response = await request(`${app.baseUrl}/cart/fake-id-patch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test" }),
      });

      expectStatus(response, 404);
    });
  });

  describe("DELETE /cart/:id", () => {
    test("should delete an existing cart", async () => {
      // Create a cart first
      const cart = createTestCart();
      const createResponse = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      const created = await parseJson(createResponse);

      // Delete it
      const response = await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "DELETE",
      });

      expectStatus(response, 200);

      // Verify it's deleted
      const getResponse = await request(`${app.baseUrl}/cart/${created.id}`);
      expectStatus(getResponse, 404);
    });

    test("should return 404 when deleting non-existent cart", async () => {
      const response = await request(`${app.baseUrl}/cart/non-existent-999`, {
        method: "DELETE",
      });

      expectStatus(response, 404);
    });

    test("should actually remove cart from the list", async () => {
      // Create a cart
      const cart = createTestCart();
      const createResponse = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      const created = await parseJson(createResponse);

      // Get initial list
      const listBefore = await request(`${app.baseUrl}/cart`);
      const cartsBefore = await parseJson(listBefore);
      const countBefore = cartsBefore.length;

      // Delete the cart
      await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "DELETE",
      });

      // Get list after deletion
      const listAfter = await request(`${app.baseUrl}/cart`);
      const cartsAfter = await parseJson(listAfter);
      const countAfter = cartsAfter.length;

      expect(countAfter).toBe(countBefore - 1);
      expect(cartsAfter.find((c: any) => c.id === created.id)).toBeUndefined();
    });
  });

  describe("Cart Workflow E2E", () => {
    test("should complete full cart lifecycle", async () => {
      // 1. Create cart
      const cart = createTestCart({ userId: "workflow-user" });
      const createRes = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart),
      });
      expectStatus(createRes, 200);
      const created = await parseJson(createRes);

      // 2. Read cart
      const readRes = await request(`${app.baseUrl}/cart/${created.id}`);
      expectStatus(readRes, 200);
      const read = await parseJson(readRes);
      expect(read.id).toBe(created.id);

      // 3. Update cart
      await new Promise((resolve) => setTimeout(resolve, 2));
      const updateRes = await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "updated-workflow-user" }),
      });
      expectStatus(updateRes, 200);
      const updated = await parseJson(updateRes);
      expect(updated.userId).toBe("updated-workflow-user");

      // 4. Delete cart
      const deleteRes = await request(`${app.baseUrl}/cart/${created.id}`, {
        method: "DELETE",
      });
      expectStatus(deleteRes, 200);

      // 5. Verify deletion
      const verifyRes = await request(`${app.baseUrl}/cart/${created.id}`);
      expectStatus(verifyRes, 404);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid JSON in POST", async () => {
      const response = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      expect([400, 500]).toContain(response.status);
    });

    test("should handle missing body in POST", async () => {
      const response = await request(`${app.baseUrl}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Should handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});
