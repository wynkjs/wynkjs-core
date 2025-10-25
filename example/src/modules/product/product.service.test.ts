import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { ProductService } from "./product.service";

describe("ProductService", () => {
  let service: ProductService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe("findAll", () => {
    it("should return an empty array initially", () => {
      const result = service.findAll();
      
      expect(result).toBeArray();
      expect(result).toHaveLength(0);
    });

    it("should return all products", () => {
      // Create test products
      service.create({});
      service.create({});
      
      const result = service.findAll();
      
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    it("should return undefined when product not found", () => {
      const result = service.findById("nonexistent-id");
      
      expect(result).toBeUndefined();
    });

    it("should return a product by id", () => {
      const created = service.create({});
      const result = service.findById(created.id);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });
  });

  describe("create", () => {
    it("should create a new product", () => {
      const data = {
        // Add test data here
      };

      const result = service.create(data);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should add the product to the list", () => {
      const data = {};
      
      service.create(data);
      
      const all = service.findAll();
      expect(all).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should return undefined when product not found", () => {
      const result = service.update("nonexistent-id", {});
      
      expect(result).toBeUndefined();
    });

    it("should update an existing product", () => {
      const created = service.create({});
      const updateData = {
        // Add update data here
      };

      const result = service.update(created.id, updateData);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.updatedAt).not.toBe(created.updatedAt);
    });
  });

  describe("delete", () => {
    it("should return false when product not found", () => {
      const result = service.delete("nonexistent-id");
      
      expect(result).toBe(false);
    });

    it("should delete an existing product", () => {
      const created = service.create({});
      
      const result = service.delete(created.id);
      
      expect(result).toBe(true);
      
      const found = service.findById(created.id);
      expect(found).toBeUndefined();
    });
  });
});
