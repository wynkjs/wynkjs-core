#!/usr/bin/env node

import { Command } from "commander";
import { bold, cyan } from "kleur/colors";
import { generateModule } from "./generators/module.generator.js";
import { generateController } from "./generators/controller.generator.js";
import { generateService } from "./generators/service.generator.js";
import { generateDto } from "./generators/dto.generator.js";

const program = new Command();

program
  .name("wynkjs")
  .description(
    "CLI tool to generate WynkJS modules, controllers, services, and DTOs"
  )
  .version("1.0.0");

// Generate command
const generate = program
  .command("generate")
  .alias("g")
  .description("Generate WynkJS resources");

// Generate module
generate
  .command("module <name>")
  .alias("m")
  .description("Generate a complete CRUD module (controller, service, DTO)")
  .action((name: string) => {
    console.log(bold(cyan("\n🚀 WynkJS Generator\n")));
    generateModule(name);
  });

// Generate controller
generate
  .command("controller <name>")
  .alias("c")
  .description("Generate a controller with all HTTP methods")
  .action((name: string) => {
    console.log(bold(cyan("\n🚀 WynkJS Generator\n")));
    generateController(name);
  });

// Generate service
generate
  .command("service <name>")
  .alias("s")
  .description("Generate a service with all CRUD methods")
  .action((name: string) => {
    console.log(bold(cyan("\n🚀 WynkJS Generator\n")));
    generateService(name);
  });

// Generate DTO
generate
  .command("dto <name>")
  .alias("d")
  .description("Generate DTOs (Create, Update, and ID DTOs)")
  .action((name: string) => {
    console.log(bold(cyan("\n🚀 WynkJS Generator\n")));
    generateDto(name);
  });

program.parse();
