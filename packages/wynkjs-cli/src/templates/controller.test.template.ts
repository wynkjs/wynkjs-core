import { toPascalCase } from "../utils.js";

export function generateControllerTestTemplate(name: string): string {
  const className = toPascalCase(name) + "Controller";
  const entityName = toPascalCase(name);
  const serviceName = `${entityName}Service`;
  const serviceVarName =
    entityName.charAt(0).toLowerCase() + entityName.slice(1) + "Service";

  return `import { describe, it, expect, beforeAll } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { ${className} } from "./${name}.controller";
import { ${serviceName} } from "./${name}.service";

describe("${className}", () => {
  let controller: ${className};
  let ${serviceVarName}: ${serviceName};

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [${className}],
      providers: [${serviceName}],
    }).compile();

    controller = module.get<${className}>(${className});
    ${serviceVarName} = module.get<${serviceName}>(${serviceName});
  });

  describe("findAll", () => {
    it("should return an array of ${name}s", async () => {
      const result = await controller.findAll();
      
      expect(result).toBeDefined();
      expect(result.data).toBeArray();
    });
  });

  describe("create", () => {
    it("should create a new ${name}", async () => {
      const createDto = {
        name: "Test ${entityName}",
      };

      const result = await controller.create(createDto);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("${entityName} created successfully");
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    });
  });

  describe("findOne", () => {
    it("should return a single ${name}", async () => {
      // Create a test ${name} first
      const createDto = { name: "Test ${entityName} for FindOne" };
      const created = await controller.create(createDto);
      
      const result = await controller.findOne(created.data.id);
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(created.data.id);
    });

    it("should throw NotFoundException when ${name} not found", async () => {
      expect(async () => {
        await controller.findOne("nonexistent-id");
      }).toThrow();
    });
  });

  describe("update", () => {
    it("should update an existing ${name}", async () => {
      // Create a test ${name} first
      const createDto = { name: "Test ${entityName} for Update" };
      const created = await controller.create(createDto);
      
      const updateDto = {
        name: "Updated ${entityName}",
      };

      const result = await controller.update(created.data.id, updateDto);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("${entityName} updated successfully");
      expect(result.data).toBeDefined();
    });

    it("should throw NotFoundException when updating non-existent ${name}", async () => {
      expect(async () => {
        await controller.update("nonexistent-id", {});
      }).toThrow();
    });
  });

  describe("remove", () => {
    it("should delete an existing ${name}", async () => {
      // Create a test ${name} first
      const createDto = { name: "Test ${entityName} for Delete" };
      const created = await controller.create(createDto);
      
      const result = await controller.remove(created.data.id);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("${entityName} deleted successfully");
    });

    it("should throw NotFoundException when deleting non-existent ${name}", async () => {
      expect(async () => {
        await controller.remove("nonexistent-id");
      }).toThrow();
    });
  });
});
`;
}
