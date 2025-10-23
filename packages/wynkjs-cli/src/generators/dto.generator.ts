import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { green, yellow } from "kleur/colors";
import { loadConfig, toKebabCase } from "../utils.js";
import { generateDtoTemplate } from "../templates/dto.template.js";

export function generateDto(name: string) {
  const config = loadConfig();
  const kebabName = toKebabCase(name);
  const dtoName = `${kebabName}.dto`;
  const fileName = `${dtoName}.ts`;
  const filePath = join(config.dtoDir, fileName);

  // Check if file exists
  if (existsSync(filePath)) {
    console.log(yellow(`⚠ DTO ${fileName} already exists`));
    return;
  }

  // Create directory if it doesn't exist
  mkdirSync(dirname(filePath), { recursive: true });

  // Generate DTO content
  const content = generateDtoTemplate(kebabName);

  // Write file
  writeFileSync(filePath, content);
  console.log(green(`✔ Generated DTO: ${fileName}`));
}
