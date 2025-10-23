#!/usr/bin/env node

import prompts from "prompts";
import { cyan, green, red, yellow, bold } from "kleur/colors";
import { existsSync, mkdirSync, writeFileSync, cpSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(bold(cyan("\n🚀 Create WynkJS App\n")));

async function main() {
  const response = await prompts([
    {
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-wynkjs-app",
      validate: (value: string) =>
        value.length > 0 ? true : "Project name is required",
    },
    {
      type: "confirm",
      name: "eslint",
      message: "Add ESLint for code linting?",
      initial: true,
    },
    {
      type: "confirm",
      name: "prettier",
      message: "Add Prettier for code formatting?",
      initial: true,
    },
    {
      type: "confirm",
      name: "husky",
      message: "Add Husky for Git hooks (pre-commit)?",
      initial: false,
    },
  ]);

  if (!response.projectName) {
    console.log(red("✖ Project creation cancelled"));
    process.exit(1);
  }

  const { projectName, eslint, prettier, husky } = response;
  const targetDir = resolve(process.cwd(), projectName);

  // Check if directory exists
  if (existsSync(targetDir)) {
    console.log(red(`✖ Directory ${projectName} already exists`));
    process.exit(1);
  }

  console.log(cyan(`\n📁 Creating TypeScript project in ${targetDir}...\n`));
  console.log(yellow("ℹ WynkJS is a TypeScript-first framework\n"));

  // Create project directory
  mkdirSync(targetDir, { recursive: true });

  // Create project structure (TypeScript is always included)
  createProjectStructure(targetDir, {
    eslint,
    prettier,
    husky,
  });

  console.log(green("✔ Project structure created"));

  // Install dependencies
  console.log(cyan("\n📦 Installing dependencies...\n"));

  try {
    execSync("bun install", {
      cwd: targetDir,
      stdio: "inherit",
    });
    console.log(green("\n✔ Dependencies installed"));
  } catch (error) {
    console.log(yellow("\n⚠ Failed to install dependencies automatically"));
    console.log(yellow("Please run 'bun install' manually\n"));
  }

  // Success message
  console.log(green(bold("\n✨ Project created successfully!\n")));
  console.log("Next steps:");
  console.log(cyan(`  cd ${projectName}`));
  console.log(cyan("  bun run dev"));
  console.log();
  console.log("Happy coding! 🎉\n");
}

function createProjectStructure(
  targetDir: string,
  options: {
    eslint: boolean;
    prettier: boolean;
    husky: boolean;
  }
) {
  const { eslint, prettier, husky } = options;
  // TypeScript is always included - WynkJS is TypeScript-first!

  // Create directories
  mkdirSync(join(targetDir, "src"), { recursive: true });
  mkdirSync(join(targetDir, "src/controllers"), { recursive: true });
  mkdirSync(join(targetDir, "src/services"), { recursive: true });
  mkdirSync(join(targetDir, "src/dto"), { recursive: true });

  // package.json
  const packageJson = {
    name: targetDir.split("/").pop(),
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "bun --watch src/index.ts",
      build: "tsc",
      start: "bun src/index.ts",
      ...(eslint && { lint: "eslint src/**/*.ts" }),
      ...(prettier && { format: "prettier --write src/**/*.ts" }),
      ...(eslint && prettier && { "lint:fix": "eslint src/**/*.ts --fix" }),
    },
    dependencies: {
      wynkjs: "^1.0.2",
      elysia: "^1.0.0",
    },
    devDependencies: {
      typescript: "^5.0.0",
      "@types/bun": "latest",
      ...(eslint && {
        eslint: "^8.57.0",
        "@typescript-eslint/eslint-plugin": "^6.21.0",
        "@typescript-eslint/parser": "^6.21.0",
      }),
      ...(prettier && {
        prettier: "^3.2.5",
      }),
      ...(husky && {
        husky: "^9.0.11",
        "lint-staged": "^15.2.2",
      }),
    },
  };

  writeFileSync(
    join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // tsconfig.json (TypeScript is mandatory)
  const tsConfig = {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      lib: ["ES2022"],
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
    include: ["src/**/*.ts"],
    exclude: ["node_modules", "dist"],
  };

  writeFileSync(
    join(targetDir, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );

  // .eslintrc.json (if ESLint)
  if (eslint) {
    const eslintConfig = {
      parser: "@typescript-eslint/parser",
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      env: {
        es2022: true,
        node: true,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_" },
        ],
      },
    };

    writeFileSync(
      join(targetDir, ".eslintrc.json"),
      JSON.stringify(eslintConfig, null, 2)
    );

    // .eslintignore
    writeFileSync(
      join(targetDir, ".eslintignore"),
      "node_modules\ndist\n*.js\n"
    );
  }

  // .prettierrc (if Prettier)
  if (prettier) {
    const prettierConfig = {
      semi: true,
      trailingComma: "es5",
      singleQuote: false,
      printWidth: 80,
      tabWidth: 2,
    };

    writeFileSync(
      join(targetDir, ".prettierrc"),
      JSON.stringify(prettierConfig, null, 2)
    );

    // .prettierignore
    writeFileSync(
      join(targetDir, ".prettierignore"),
      "node_modules\ndist\n*.md\n"
    );
  }

  // .gitignore
  writeFileSync(
    join(targetDir, ".gitignore"),
    `node_modules
dist
.env
.DS_Store
*.log
`
  );

  // .env.example
  writeFileSync(
    join(targetDir, ".env.example"),
    `PORT=3000
NODE_ENV=development
`
  );

  // README.md
  const readmeContent = `# ${targetDir.split("/").pop()}

WynkJS application created with \`create-wynkjs\`.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
bun install

# Run development server with hot reload
bun run dev

# Build TypeScript
bun run build

# Run production
bun run start
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── controllers/     # API controllers
│   └── user.controller.ts
├── services/        # Business logic
│   └── user.service.ts
├── dto/             # Data Transfer Objects
│   └── user.dto.ts
└── index.ts         # Application entry point
\`\`\`

## 🔧 Available Scripts

- \`bun run dev\` - Start development server with hot reload
- \`bun run start\` - Start production server
- \`bun run build\` - Build TypeScript to JavaScript
${eslint ? "- `bun run lint` - Run ESLint" : ""}
${prettier ? "- `bun run format` - Format code with Prettier" : ""}

## 📚 Documentation

- [WynkJS Documentation](https://github.com/wynkjs/wynkjs-core)
- [Elysia Documentation](https://elysiajs.com)

## 🛠️ Built With

- [WynkJS](https://github.com/wynkjs/wynkjs-core) - NestJS-style framework for Bun
- [Elysia](https://elysiajs.com) - Fast web framework for Bun
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
${eslint ? "- [ESLint](https://eslint.org/) - Code linting" : ""}
${prettier ? "- [Prettier](https://prettier.io/) - Code formatting" : ""}

## 📝 License

MIT
`;

  writeFileSync(join(targetDir, "README.md"), readmeContent);

  // Husky setup (if selected)
  if (husky) {
    // .husky/pre-commit
    mkdirSync(join(targetDir, ".husky"), { recursive: true });
    writeFileSync(
      join(targetDir, ".husky/pre-commit"),
      `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bunx lint-staged
`
    );

    // lint-staged config in package.json will be added
    const pkgPath = join(targetDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    pkg["lint-staged"] = {
      "*.ts": [
        ...(eslint ? ["eslint --fix"] : []),
        ...(prettier ? ["prettier --write"] : []),
      ],
    };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  // Source files (always TypeScript)
  createSourceFiles(targetDir);
}

function createSourceFiles(targetDir: string) {
  // WynkJS is TypeScript-first, always use .ts extension
  const ext = "ts";

  // src/dto/user.dto.ts
  const userDtoContent = `import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 50 }),
  email: CommonDTO.Email(),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface CreateUserType {
  name: string;
  email: string;
  age?: number;
}

export const UserIdDto = DTO.Object({
  id: DTO.String(),
});
`;

  writeFileSync(join(targetDir, `src/dto/user.dto.${ext}`), userDtoContent);

  // src/services/user.service.ts
  const userServiceContent = `import { Injectable } from "wynkjs";

@Injectable()
export class UserService {
  private users = [
    { id: "1", name: "Alice", email: "alice@example.com", age: 25 },
    { id: "2", name: "Bob", email: "bob@example.com", age: 30 },
  ];

  findAll() {
    return this.users;
  }

  findById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  create(data: { name: string; email: string; age?: number }) {
    const user = { id: Date.now().toString(), ...data };
    this.users.push(user);
    return user;
  }
}
`;

  writeFileSync(
    join(targetDir, `src/services/user.service.${ext}`),
    userServiceContent
  );

  // src/controllers/user.controller.ts
  const userControllerContent = `import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { CreateUserDTO, UserIdDto } from "../dto/user.dto.js";
import type { CreateUserType } from "../dto/user.dto.js";
import { UserService } from "../services/user.service.js";

@Injectable()
@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  async list() {
    const users = this.userService.findAll();
    return { users };
  }

  @Post({ path: "/", body: CreateUserDTO })
  async create(@Body() body: CreateUserType) {
    const user = this.userService.create(body);
    return { message: "User created", user };
  }

  @Get({ path: "/:id", params: UserIdDto })
  async findOne(@Param("id") id: string) {
    const user = this.userService.findById(id);
    
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return { user };
  }
}
`;

  writeFileSync(
    join(targetDir, `src/controllers/user.controller.${ext}`),
    userControllerContent
  );

  // src/index.ts
  const indexContent = `import { WynkFactory } from "wynkjs";
import { UserController } from "./controllers/user.controller.js";

const app = WynkFactory.create({
  controllers: [UserController],
});

const PORT = process.env.PORT || 3000;

await app.listen(PORT);

console.log(\`🚀 WynkJS server running on http://localhost:\${PORT}\`);
console.log(\`📝 API endpoints:\`);
console.log(\`   GET    http://localhost:\${PORT}/users\`);
console.log(\`   POST   http://localhost:\${PORT}/users\`);
console.log(\`   GET    http://localhost:\${PORT}/users/:id\`);
`;

  writeFileSync(join(targetDir, `src/index.${ext}`), indexContent);
}

// Handle process exit
process.on("SIGINT", () => {
  console.log(red("\n✖ Project creation cancelled"));
  process.exit(1);
});

main().catch((error) => {
  console.error(red("✖ Error creating project:"), error);
  process.exit(1);
});
