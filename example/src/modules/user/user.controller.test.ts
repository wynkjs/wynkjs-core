import { describe, it, expect, beforeEach } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { UserController } from "./user.controller";
import { EmailService } from "../email/email.service";

describe("UserController", () => {
  let controller: UserController;
  let emailService: EmailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [EmailService],
    }).compile();

    controller = module.get<UserController>(UserController);
    emailService = module.get<EmailService>(EmailService);
  });

  describe("list", () => {
    it("should return an array of users", async () => {
      const result = await controller.list();

      expect(result).toBeDefined();
      expect(result.users).toBeArray();
      expect(result.users).toHaveLength(3);
      expect(result.users).toContain("Alice");
      expect(result.users).toContain("Bob");
      expect(result.users).toContain("Charlie");
    });
  });

  describe("create", () => {
    it("should create a user with all params", async () => {
      const createDto = {
        name: "John Doe",
        email: "john@example.com",
        age: 25,
      };

      // Mock email service to avoid random failures
      emailService.sendWelcomeEmail = async () => {};

      const result = await controller.create(
        createDto,
        "id1-value",
        "id2-value",
        { includePosts: true, includeComments: false }
      );

      expect(result.message).toBe("User created");
      expect(result.data).toEqual(createDto);
      expect(result.params).toEqual({ id1: "id1-value", id2: "id2-value" });
      expect(result.query.includePosts).toBe(true);
    });

    it("should handle user creation without optional fields", async () => {
      const createDto = {
        email: "simple@example.com",
      };

      // Mock email service
      emailService.sendWelcomeEmail = async () => {};

      const result = await controller.create(createDto, "id1", "id2", {
        includePosts: false,
      });

      expect(result.message).toBe("User created");
      expect(result.data.email).toBe(createDto.email);
    });

    it("should not send email when name is missing", async () => {
      const sendEmailSpy = MockFactory.createSpy();
      emailService.sendWelcomeEmail = sendEmailSpy;

      const createDto = {
        email: "test@example.com",
      };

      await controller.create(createDto, "id1", "id2", { includePosts: false });

      expect(sendEmailSpy.calls).toHaveLength(0);
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      const result = await controller.findOne("123", {
        includePosts: true,
        includeComments: false,
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe("123");
      expect(result.user.name).toBe("Alice");
      expect(result.query.includePosts).toBe(true);
    });

    it("should include query parameters in response", async () => {
      const query = {
        includePosts: false,
        includeComments: true,
      };

      const result = await controller.findOne("456", query);

      expect(result.query).toEqual(query);
    });
  });

  describe("getAll", () => {
    it("should return all users", async () => {
      const result = await controller.getAll();

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe("All");
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const updateDto = {
        email: "updated@example.com",
        age: 30,
      };

      const result = await controller.update("123", updateDto, {
        includePosts: false,
      });

      expect(result.message).toBe("User updated");
      expect(result.id).toBe("123");
      expect(result.data).toEqual(updateDto);
    });

    it("should throw NotFoundException when id is 'params'", async () => {
      const updateDto = {
        email: "test@example.com",
      };

      await expect(
        controller.update("params", updateDto, { includePosts: false })
      ).rejects.toThrow();
    });
  });

  describe("sendPasswordReset", () => {
    it("should send password reset email", async () => {
      // Mock email service to avoid random failures
      emailService.sendPasswordResetEmail = async () => {};

      const body = {
        email: "user@example.com",
        userId: "user-123",
      };

      const result = await controller.sendPasswordReset(body);

      expect(result.message).toBe("Password reset email sent");
      expect(result.email).toBe(body.email);
      expect(result.userId).toBe(body.userId);
    });

    it("should handle password reset with different user ids", async () => {
      // Mock email service
      emailService.sendPasswordResetEmail = async () => {};

      const body = {
        email: "test@example.com",
        userId: "user-456",
      };

      const result = await controller.sendPasswordReset(body);

      expect(result.message).toBe("Password reset email sent");
      expect(result.userId).toBe(body.userId);
    });
  });
});
