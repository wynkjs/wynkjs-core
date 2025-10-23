import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface WynkConfig {
  srcDir: string;
  controllersDir: string;
  servicesDir: string;
  dtoDir: string;
  modulesDir: string;
}

export function loadConfig(): WynkConfig {
  const configPath = join(process.cwd(), "wynkjs.config.json");

  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return {
      srcDir: config.srcDir || "src",
      controllersDir: config.controllersDir || "src/controllers",
      servicesDir: config.servicesDir || "src/services",
      dtoDir: config.dtoDir || "src/dto",
      modulesDir: config.modulesDir || "src/modules",
    };
  }

  return {
    srcDir: "src",
    controllersDir: "src/controllers",
    servicesDir: "src/services",
    dtoDir: "src/dto",
    modulesDir: "src/modules",
  };
}

export function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toLowerCase());
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toUpperCase());
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function pluralize(str: string): string {
  if (str.endsWith("y")) {
    return str.slice(0, -1) + "ies";
  }
  if (str.endsWith("s")) {
    return str;
  }
  return str + "s";
}
