import { describe, it, expect, beforeEach } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";

describe("ProductController", () => {
  let controller: ProductController;
  let productService: ProductService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [ProductService],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  describe("findAll", () => {
    it("should return an array of products", async () => {
      const result = await controller.findAll();

      expect(result).toBeDefined();
      expect(result.data).toBeArray();
    });
  });

  describe("findOne", () => {
    it("should return a single product", async () => {
      // Create a test product via controller
      const createResult = await controller.create({ name: "Test Product" });

      const result = await controller.findOne(createResult.data.id);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(createResult.data.id);
    });

    it("should throw NotFoundException when product not found", async () => {
      expect(async () => {
        await controller.findOne("nonexistent-id");
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should create a new product", async () => {
      const createDto = {
        name: "New Test Product",
      };

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(result.message).toBe("Product created successfully");
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update an existing product", async () => {
      // Create a test product via controller
      const createResult = await controller.create({
        name: "Original Product",
      });

      const updateDto = {
        name: "Updated Product",
      };

      const result = await controller.update(createResult.data.id, updateDto);

      expect(result).toBeDefined();
      expect(result.message).toBe("Product updated successfully");
      expect(result.data).toBeDefined();
    });

    it("should throw NotFoundException when updating non-existent product", async () => {
      expect(async () => {
        await controller.update("nonexistent-id", {});
      }).toThrow();
    });
  });

  describe("remove", () => {
    it("should delete an existing product", async () => {
      // Create a test product via controller
      const createResult = await controller.create({
        name: "Product to Delete",
      });

      const result = await controller.remove(createResult.data.id);

      expect(result).toBeDefined();
      expect(result.message).toBe("Product deleted successfully");
    });

    it("should throw NotFoundException when deleting non-existent product", async () => {
      expect(async () => {
        await controller.remove("nonexistent-id");
      }).toThrow();
    });
  });
});
