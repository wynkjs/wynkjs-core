/**
 * E2E Tests for Product Module
 * Tests all product endpoints with real HTTP requests
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  startTestApp,
  stopTestApp,
  request,
  parseJson,
  expectStatus,
  type TestApp,
} from "./setup";
import { ProductController } from "../../src/modules/product/product.controller";

describe("Product Module E2E", () => {
  let app: TestApp;
  let createdProductId: string;

  beforeAll(async () => {
    app = await startTestApp([ProductController], 3002);
  });

  afterAll(async () => {
    await stopTestApp();
  });

  describe("GET /product", () => {
    test("should return list of products", async () => {
      const response = await request(`${app.baseUrl}/product`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("POST /product", () => {
    test("should create a new product", async () => {
      const productData = {
        name: "Test Product",
        // Add more fields as needed
      };

      const response = await request(`${app.baseUrl}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      expectStatus(response, 200);
      const responseData = await parseJson(response);
      expect(responseData.data.name).toBe(productData.name);
      expect(responseData.data.id).toBeDefined();

      createdProductId = responseData.data.id;
    });

    test("should validate required fields", async () => {
      const invalidProduct = {};

      const response = await request(`${app.baseUrl}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidProduct),
      });

      expectStatus(response, 400);
      const data = await parseJson(response);
      expect(data.errors).toBeDefined();
    });
  });

  describe("GET /product/:id", () => {
    test("should return a product by id", async () => {
      const response = await request(
        `${app.baseUrl}/product/${createdProductId}`
      );
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data.data.id).toBe(createdProductId);
    });

    test("should return 404 for non-existent product", async () => {
      const response = await request(`${app.baseUrl}/product/non-existent-id`);
      expectStatus(response, 404);
    });
  });

  describe("PUT /product/:id", () => {
    test("should fully update a product", async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));

      const updates = {
        name: "Updated Product Name",
        // Add more fields as needed
      };

      const response = await request(
        `${app.baseUrl}/product/${createdProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      expectStatus(response, 200);
      const responseData = await parseJson(response);
      expect(responseData.data.name).toBe(updates.name);
    });

    test("should return 404 when updating non-existent product", async () => {
      const updates = { name: "Test" };

      const response = await request(`${app.baseUrl}/product/fake-id-999`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      expectStatus(response, 404);
    });
  });

  describe("PATCH /product/:id", () => {
    test("should partially update a product", async () => {
      const updates = { name: "Partially Updated Product" };

      const response = await request(
        `${app.baseUrl}/product/${createdProductId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      expectStatus(response, 200);
      const responseData = await parseJson(response);
      expect(responseData.data.name).toBe(updates.name);
    });

    test("should return 404 for non-existent product", async () => {
      const response = await request(`${app.baseUrl}/product/fake-id-patch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });

      expectStatus(response, 404);
    });
  });

  describe("DELETE /product/:id", () => {
    test("should delete an existing product", async () => {
      const response = await request(
        `${app.baseUrl}/product/${createdProductId}`,
        {
          method: "DELETE",
        }
      );

      expectStatus(response, 200);

      // Verify it's deleted
      const getResponse = await request(
        `${app.baseUrl}/product/${createdProductId}`
      );
      expectStatus(getResponse, 404);
    });

    test("should return 404 when deleting non-existent product", async () => {
      const response = await request(
        `${app.baseUrl}/product/non-existent-999`,
        {
          method: "DELETE",
        }
      );

      expectStatus(response, 404);
    });
  });

  describe("Full Product Lifecycle", () => {
    test("should complete create, read, update, delete workflow", async () => {
      // 1. Create
      const productData = { name: "Workflow Product" };
      const createRes = await request(`${app.baseUrl}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      expectStatus(createRes, 200);
      const created = await parseJson(createRes);

      // 2. Read
      const readRes = await request(
        `${app.baseUrl}/product/${created.data.id}`
      );
      expectStatus(readRes, 200);
      const read = await parseJson(readRes);
      expect(read.data.id).toBe(created.data.id);

      // 3. Update
      await new Promise((resolve) => setTimeout(resolve, 2));
      const updateRes = await request(
        `${app.baseUrl}/product/${created.data.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Workflow Product" }),
        }
      );
      expectStatus(updateRes, 200);
      const updated = await parseJson(updateRes);
      expect(updated.data.name).toBe("Updated Workflow Product");

      // 4. Delete
      const deleteRes = await request(
        `${app.baseUrl}/product/${created.data.id}`,
        {
          method: "DELETE",
        }
      );
      expectStatus(deleteRes, 200);

      // 5. Verify deletion
      const verifyRes = await request(
        `${app.baseUrl}/product/${created.data.id}`
      );
      expectStatus(verifyRes, 404);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid JSON body", async () => {
      const response = await request(`${app.baseUrl}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 404 for non-existent resources", async () => {
      const response = await request(`${app.baseUrl}/product/non-existent`);
      expectStatus(response, 404);
    });
  });
});
