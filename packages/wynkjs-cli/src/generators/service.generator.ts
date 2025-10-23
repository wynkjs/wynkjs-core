import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { green, yellow } from "kleur/colors";
import { loadConfig, toKebabCase } from "../utils.js";
import { generateServiceTemplate } from "../templates/service.template.js";

export function generateService(name: string) {
  const config = loadConfig();
  const kebabName = toKebabCase(name);
  const fileName = `${kebabName}.service.ts`;
  const filePath = join(config.servicesDir, fileName);

  // Check if file exists
  if (existsSync(filePath)) {
    console.log(yellow(`⚠ Service ${fileName} already exists`));
    return;
  }

  // Create directory if it doesn't exist
  mkdirSync(dirname(filePath), { recursive: true });

  // Generate service content
  const content = generateServiceTemplate(kebabName);

  // Write file
  writeFileSync(filePath, content);
  console.log(green(`✔ Generated service: ${fileName}`));
}
