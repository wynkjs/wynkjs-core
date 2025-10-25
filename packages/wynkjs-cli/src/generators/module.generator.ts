import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { green, cyan } from "kleur/colors";
import { loadConfig, toKebabCase, toPascalCase } from "../utils.js";
import { generateControllerTemplate } from "../templates/controller.template.js";
import { generateServiceTemplate } from "../templates/service.template.js";
import { generateDtoTemplate } from "../templates/dto.template.js";
import { generateControllerTestTemplate } from "../templates/controller.test.template.js";
import { generateServiceTestTemplate } from "../templates/service.test.template.js";
import { e2eTestTemplate } from "../templates/e2e.test.template.js";

export function generateModule(name: string) {
  const kebabName = toKebabCase(name);
  const config = loadConfig();
  const modulePath = join(config.modulesDir, kebabName);

  console.log(cyan(`\n📦 Generating module: ${kebabName}\n`));

  // Create module directory (flat structure)
  mkdirSync(modulePath, { recursive: true });

  // Generate DTO
  const dtoContent = generateDtoTemplate(kebabName);
  const dtoPath = join(modulePath, `${kebabName}.dto.ts`);
  writeFileSync(dtoPath, dtoContent);
  console.log(green(`✔ Generated DTO: ${kebabName}.dto.ts`));

  // Generate Service
  const serviceContent = generateServiceTemplate(kebabName);
  const servicePath = join(modulePath, `${kebabName}.service.ts`);
  writeFileSync(servicePath, serviceContent);
  console.log(green(`✔ Generated service: ${kebabName}.service.ts`));

  // Generate Service Test
  const serviceTestContent = generateServiceTestTemplate(kebabName);
  const serviceTestPath = join(modulePath, `${kebabName}.service.test.ts`);
  writeFileSync(serviceTestPath, serviceTestContent);
  console.log(green(`✔ Generated service test: ${kebabName}.service.test.ts`));

  // Generate Controller
  const controllerContent = generateControllerTemplate(kebabName);
  const controllerPath = join(modulePath, `${kebabName}.controller.ts`);
  writeFileSync(controllerPath, controllerContent);
  console.log(green(`✔ Generated controller: ${kebabName}.controller.ts`));

  // Generate Controller Test
  const controllerTestContent = generateControllerTestTemplate(kebabName);
  const controllerTestPath = join(
    modulePath,
    `${kebabName}.controller.test.ts`
  );
  writeFileSync(controllerTestPath, controllerTestContent);
  console.log(
    green(`✔ Generated controller test: ${kebabName}.controller.test.ts`)
  );

  // Generate E2E Test
  const e2eDir = join(process.cwd(), "test", "e2e");
  mkdirSync(e2eDir, { recursive: true });

  const e2eTestContent = e2eTestTemplate(kebabName);
  const e2eTestPath = join(e2eDir, `${kebabName}.e2e.test.ts`);
  writeFileSync(e2eTestPath, e2eTestContent);
  console.log(green(`✔ Generated E2E test: test/e2e/${kebabName}.e2e.test.ts`));

  console.log(green(`\n✨ Module ${kebabName} generated successfully!\n`));
  console.log(cyan(`📁 Module structure:`));
  console.log(cyan(`   ${modulePath}/`));
  console.log(cyan(`   ├── ${kebabName}.controller.ts`));
  console.log(cyan(`   ├── ${kebabName}.controller.test.ts`));
  console.log(cyan(`   ├── ${kebabName}.service.ts`));
  console.log(cyan(`   ├── ${kebabName}.service.test.ts`));
  console.log(cyan(`   └── ${kebabName}.dto.ts`));
  console.log();
  console.log(cyan(`   test/e2e/`));
  console.log(cyan(`   └── ${kebabName}.e2e.test.ts`));
  console.log();
  console.log(cyan(`📝 Don't forget to:`));
  console.log(cyan(`   1. Import the controller in src/index.ts`));
  console.log(cyan(`   2. Add business logic to the service`));
  console.log(cyan(`   3. Update DTOs with your schema`));
  console.log(cyan(`   4. Run unit tests: bun test ${modulePath}`));
  console.log(
    cyan(`   5. Run E2E tests: bun test test/e2e/${kebabName}.e2e.test.ts\n`)
  );
}
