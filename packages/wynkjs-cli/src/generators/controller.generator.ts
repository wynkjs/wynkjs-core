import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { green, yellow, cyan } from "kleur/colors";
import { loadConfig, toKebabCase, toPascalCase } from "../utils.js";
import { generateControllerTemplate } from "../templates/controller.template.js";
import { updateIndexFile } from "./index-updater.js";

export function generateController(name: string) {
  const config = loadConfig();
  const kebabName = toKebabCase(name);
  const controllerName = `${kebabName}.controller`;
  const fileName = `${controllerName}.ts`;
  const filePath = join(config.controllersDir, fileName);

  // Check if file exists
  if (existsSync(filePath)) {
    console.log(yellow(`⚠ Controller ${fileName} already exists`));
    return;
  }

  // Create directory if it doesn't exist
  mkdirSync(dirname(filePath), { recursive: true });

  // Generate controller content
  const content = generateControllerTemplate(kebabName);

  // Write file
  writeFileSync(filePath, content);
  console.log(green(`✔ Generated controller: ${fileName}`));

  // Update index.ts
  const className = toPascalCase(name) + "Controller";
  updateIndexFile(className, `./controllers/${fileName.replace(".ts", ".js")}`);

  console.log(cyan(`\n📝 Next steps:`));
  console.log(
    cyan(`   1. Generate the service: wynkjs generate service ${name}`)
  );
  console.log(cyan(`   2. Generate the DTO: wynkjs generate dto ${name}`));
  console.log(
    cyan(`   3. Update the generated files with your business logic\n`)
  );
}
