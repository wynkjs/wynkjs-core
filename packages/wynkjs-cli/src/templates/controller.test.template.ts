import { toPascalCase } from "../utils.js";

export function generateControllerTestTemplate(name: string): string {
  const className = toPascalCase(name) + "Controller";
  const entityName = toPascalCase(name);
  const serviceName = `${entityName}Service`;
  const serviceVarName =
    entityName.charAt(0).toLowerCase() + entityName.slice(1) + "Service";

  return `import { describe, it, expect, beforeEach } from "bun:test";
import { Test, MockFactory } from "wynkjs";
import { ${className} } from "./${name}.controller";
import { ${serviceName} } from "./${name}.service";

describe("${className}", () => {
  let controller: ${className};
  let ${serviceVarName}: ${serviceName};

  beforeEach(async () => {
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

  describe("findOne", () => {
    it("should return a single ${name}", async () => {
      // Create a test ${name}
      const created = ${serviceVarName}.create({});
      
      const result = await controller.findOne(created.id);
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(created.id);
    });

    it("should throw NotFoundException when ${name} not found", async () => {
      expect(async () => {
        await controller.findOne("nonexistent-id");
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should create a new ${name}", async () => {
      const createDto = {
        // Add test data here
      };

      const result = await controller.create(createDto);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("${entityName} created successfully");
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update an existing ${name}", async () => {
      // Create a test ${name}
      const created = ${serviceVarName}.create({});
      
      const updateDto = {
        // Add update data here
      };

      const result = await controller.update(created.id, updateDto);
      
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
      // Create a test ${name}
      const created = ${serviceVarName}.create({});
      
      const result = await controller.remove(created.id);
      
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
