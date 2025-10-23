import { toPascalCase } from "../utils.js";

export function generateDtoTemplate(name: string): string {
  const entityName = toPascalCase(name.replace(/-dto$/, ""));

  return `import { DTO, CommonDTO } from "wynkjs";

// Create DTO
export const Create${entityName}DTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 100 }),
  // Add more fields as needed
});

export interface Create${entityName}Type {
  name: string;
  // Add more fields as needed
}

// Update DTO
export const Update${entityName}DTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 100 })),
  // Add more fields as needed
});

export interface Update${entityName}Type {
  name?: string;
  // Add more fields as needed
}

// ID Parameter DTO
export const ${entityName}IdDto = DTO.Object({
  id: DTO.String(),
});
`;
}
