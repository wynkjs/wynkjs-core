import { describe, it, expect, beforeEach } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";

describe("OrderController", () => {
  let controller: OrderController;
  let orderService: OrderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [OrderService],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  describe("findAll", () => {
    it("should return an array of orders", async () => {
      const result = await controller.findAll();

      expect(result).toBeDefined();
      expect(result.data).toBeArray();
    });
  });

  describe("findOne", () => {
    it("should return a single order", async () => {
      // Create a test order first
      const createResult = await controller.create({});
      const createdId = createResult.data.id;

      const result = await controller.findOne(createdId);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(createdId);
    });

    it("should throw NotFoundException when order not found", async () => {
      expect(async () => {
        await controller.findOne("nonexistent-id");
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should create a new order", async () => {
      const createDto = {
        // Add test data here
      };

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(result.message).toBe("Order created successfully");
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update an existing order", async () => {
      // Create a test order first
      const createResult = await controller.create({});
      const createdId = createResult.data.id;

      const updateDto = {
        // Add update data here
      };

      const result = await controller.update(createdId, updateDto);

      expect(result).toBeDefined();
      expect(result.message).toBe("Order updated successfully");
      expect(result.data).toBeDefined();
    });

    it("should throw NotFoundException when updating non-existent order", async () => {
      expect(async () => {
        await controller.update("nonexistent-id", {});
      }).toThrow();
    });
  });

  describe("remove", () => {
    it("should delete an existing order", async () => {
      // Create a test order first
      const createResult = await controller.create({});
      const createdId = createResult.data.id;

      const result = await controller.remove(createdId);

      expect(result).toBeDefined();
      expect(result.message).toBe("Order deleted successfully");
    });

    it("should throw NotFoundException when deleting non-existent order", async () => {
      expect(async () => {
        await controller.remove("nonexistent-id");
      }).toThrow();
    });
  });
});
