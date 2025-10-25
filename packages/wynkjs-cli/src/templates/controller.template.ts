import { toPascalCase } from "../utils.js";

export function generateControllerTemplate(name: string): string {
  const className = toPascalCase(name) + "Controller";
  const entityName = toPascalCase(name);
  const serviceName = `${entityName}Service`;
  const serviceVarName =
    entityName.charAt(0).toLowerCase() + entityName.slice(1) + "Service";
  const dtoImport = `./${name}.dto.js`;
  const serviceImport = `./${name}.service.js`;

  return `import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { Create${entityName}DTO, Update${entityName}DTO, ${entityName}IdDto } from "${dtoImport}";
import type { Create${entityName}Type, Update${entityName}Type } from "${dtoImport}";
import { ${serviceName} } from "${serviceImport}";

@Injectable()
@Controller("/${name}")
export class ${className} {
  constructor(private ${serviceVarName}: ${serviceName}) {}

  @Get("/")
  async findAll() {
    const items = this.${serviceVarName}.findAll();
    return { data: items };
  }

  @Get({ path: "/:id", params: ${entityName}IdDto })
  async findOne(@Param("id") id: string) {
    const item = this.${serviceVarName}.findById(id);
    
    if (!item) {
      throw new NotFoundException("${entityName} not found");
    }

    return { data: item };
  }

  @Post({ path: "/", body: Create${entityName}DTO })
  async create(@Body() body: Create${entityName}Type) {
    const item = this.${serviceVarName}.create(body);
    return { message: "${entityName} created successfully", data: item };
  }

  @Put({ path: "/:id", params: ${entityName}IdDto, body: Update${entityName}DTO })
  async update(@Param("id") id: string, @Body() body: Update${entityName}Type) {
    const item = this.${serviceVarName}.update(id, body);
    
    if (!item) {
      throw new NotFoundException("${entityName} not found");
    }

    return { message: "${entityName} updated successfully", data: item };
  }

  @Patch({ path: "/:id", params: ${entityName}IdDto })
  async partialUpdate(@Param("id") id: string, @Body() body: Partial<Update${entityName}Type>) {
    const item = this.${serviceVarName}.update(id, body);
    
    if (!item) {
      throw new NotFoundException("${entityName} not found");
    }

    return { message: "${entityName} updated successfully", data: item };
  }

  @Delete({ path: "/:id", params: ${entityName}IdDto })
  async remove(@Param("id") id: string) {
    const deleted = this.${serviceVarName}.delete(id);
    
    if (!deleted) {
      throw new NotFoundException("${entityName} not found");
    }

    return { message: "${entityName} deleted successfully" };
  }
}
`;
}
