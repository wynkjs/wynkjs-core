import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe("list", () => {
    it("should return an array of users with query", async () => {
      const query: import("./user.dto").UserQueryType = {
        includePosts: true,
        includeComments: false,
      };
      const result = await controller.list(query);

      expect(result).toBeDefined();
      expect(result.users).toBeArray();
      expect(result.users.length).toBeGreaterThanOrEqual(2);
      expect(result.users[0]).toHaveProperty("email");
      expect(result.query).toEqual(query);
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      const result = await controller.findOne("user-1");

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe("user-1");
      expect(result.user.email).toBe("alice@example.com");
    });

    it("should throw NotFoundException for unknown id", async () => {
      await expect(controller.findOne("does-not-exist")).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should create a user and return message", async () => {
      const body = {
        email: "newuser@example.com",
        name: "New User",
        mobile: "1234567890",
      };

      const result = await controller.create(body as any);

      expect(result.message).toBe("User created");
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(body.email);
    });

    it("should throw ConflictException for duplicate email", async () => {
      const body = { email: "alice@example.com", name: "Alice Again" };
      await expect(controller.create(body as any)).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update a user and return updated data", async () => {
      const body = { email: "updated@example.com" };
      const query = {};

      const result = await controller.update(
        "user-1",
        body as any,
        query as any,
      );

      expect(result.message).toBe("User updated");
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("updated@example.com");
    });

    it("should throw NotFoundException for unknown id", async () => {
      await expect(
        controller.update("ghost", { email: "x@x.com" } as any, {} as any),
      ).rejects.toThrow();
    });
  });

  describe("replace", () => {
    it("should replace a user and return replaced data", async () => {
      const body = {
        email: "replaced@example.com",
        name: "Replaced User",
        mobile: "9999999999",
      };

      const result = await controller.replace("user-2", body as any);

      expect(result.message).toBe("User replaced");
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("replaced@example.com");
    });

    it("should throw NotFoundException for unknown id", async () => {
      await expect(
        controller.replace("ghost", { email: "x@x.com", name: "X" } as any),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("should delete a user and return confirmation", async () => {
      const result = await controller.remove("user-1");

      expect(result.message).toBe("User deleted");
      expect(result.id).toBe("user-1");
    });

    it("should throw NotFoundException for unknown id", async () => {
      await expect(controller.remove("ghost")).rejects.toThrow();
    });
  });
});
