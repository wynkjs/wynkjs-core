import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { green, cyan } from "kleur/colors";
import { loadConfig, toKebabCase, toPascalCase } from "../utils.js";
import { generateControllerTemplate } from "../templates/controller.template.js";
import { generateServiceTemplate } from "../templates/service.template.js";
import { generateDtoTemplate } from "../templates/dto.template.js";

export function generateModule(name: string) {
  const kebabName = toKebabCase(name);
  const config = loadConfig();
  const modulePath = join(config.modulesDir, kebabName);

  console.log(cyan(`\n📦 Generating module: ${kebabName}\n`));

  // Create module directory structure
  const controllersDir = join(modulePath, "controllers");
  const servicesDir = join(modulePath, "services");
  const dtoDir = join(modulePath, "dto");

  mkdirSync(controllersDir, { recursive: true });
  mkdirSync(servicesDir, { recursive: true });
  mkdirSync(dtoDir, { recursive: true });

  // Generate DTO
  const dtoContent = generateDtoTemplate(kebabName);
  const dtoPath = join(dtoDir, `${kebabName}.dto.ts`);
  writeFileSync(dtoPath, dtoContent);
  console.log(green(`✔ Generated DTO: ${kebabName}.dto.ts`));

  // Generate Service
  const serviceContent = generateServiceTemplate(kebabName);
  const servicePath = join(servicesDir, `${kebabName}.service.ts`);
  writeFileSync(servicePath, serviceContent);
  console.log(green(`✔ Generated service: ${kebabName}.service.ts`));

  // Generate Controller
  const controllerContent = generateControllerTemplate(kebabName);
  const controllerPath = join(controllersDir, `${kebabName}.controller.ts`);
  writeFileSync(controllerPath, controllerContent);
  console.log(green(`✔ Generated controller: ${kebabName}.controller.ts`));

  console.log(green(`\n✨ Module ${kebabName} generated successfully!\n`));
  console.log(cyan(`📁 Module structure:`));
  console.log(cyan(`   ${modulePath}/`));
  console.log(cyan(`   ├── controllers/`));
  console.log(cyan(`   │   └── ${kebabName}.controller.ts`));
  console.log(cyan(`   ├── services/`));
  console.log(cyan(`   │   └── ${kebabName}.service.ts`));
  console.log(cyan(`   └── dto/`));
  console.log(cyan(`       └── ${kebabName}.dto.ts`));
  console.log();
  console.log(cyan(`📝 Don't forget to:`));
  console.log(cyan(`   1. Import the controller in src/index.ts`));
  console.log(cyan(`   2. Add business logic to the service`));
  console.log(cyan(`   3. Update DTOs with your schema\n`));
}
