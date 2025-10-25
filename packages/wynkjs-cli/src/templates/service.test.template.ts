import { toPascalCase } from "../utils.js";

export function generateServiceTestTemplate(name: string): string {
  const entityName = toPascalCase(name);
  const className = `${entityName}Service`;
  const varName = entityName.charAt(0).toLowerCase() + entityName.slice(1);

  return `import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { ${className} } from "./${name}.service";

describe("${className}", () => {
  let service: ${className};

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [${className}],
    }).compile();

    service = module.get<${className}>(${className});
  });

  describe("findAll", () => {
    it("should return an empty array initially", () => {
      const result = service.findAll();
      
      expect(result).toBeArray();
      expect(result).toHaveLength(0);
    });

    it("should return all ${name}s", () => {
      // Create test ${name}s
      service.create({});
      service.create({});
      
      const result = service.findAll();
      
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    it("should return undefined when ${name} not found", () => {
      const result = service.findById("nonexistent-id");
      
      expect(result).toBeUndefined();
    });

    it("should return a ${name} by id", () => {
      const created = service.create({});
      const result = service.findById(created.id);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });
  });

  describe("create", () => {
    it("should create a new ${name}", () => {
      const data = {
        // Add test data here
      };

      const result = service.create(data);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should add the ${name} to the list", () => {
      const data = {};
      
      service.create(data);
      
      const all = service.findAll();
      expect(all).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("should return undefined when ${name} not found", () => {
      const result = service.update("nonexistent-id", {});
      
      expect(result).toBeUndefined();
    });

    it("should update an existing ${name}", () => {
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
    it("should return false when ${name} not found", () => {
      const result = service.delete("nonexistent-id");
      
      expect(result).toBe(false);
    });

    it("should delete an existing ${name}", () => {
      const created = service.create({});
      
      const result = service.delete(created.id);
      
      expect(result).toBe(true);
      
      const found = service.findById(created.id);
      expect(found).toBeUndefined();
    });
  });
});
`;
}
