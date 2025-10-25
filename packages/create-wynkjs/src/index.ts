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
  mkdirSync(join(targetDir, "src/modules/user"), { recursive: true });
  mkdirSync(join(targetDir, "test/e2e"), { recursive: true });

  // package.json
  const packageJson = {
    name: targetDir.split("/").pop(),
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "bun --watch src/index.ts",
      build: "tsc",
      "build:start": "bun run build && bun dist/index.js",
      start: "bun src/index.ts",
      test: "bun test src/modules/",
      "test:unit": "bun test src/modules/",
      "test:e2e": "bun test test/e2e/",
      "test:e2e:watch": "bun test --watch test/e2e/",
      "test:all": "bun test src/modules/ && bun test test/e2e/",
      "test:watch": "bun test --watch",
      ...(eslint && { lint: "eslint src/**/*.ts" }),
      ...(prettier && { format: "prettier --write src/**/*.ts" }),
      ...(eslint && prettier && { "lint:fix": "eslint src/**/*.ts --fix" }),
    },
    dependencies: {
      wynkjs: "^1.0.3",
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
    include: ["src/**/*.ts", "test/**/*.ts"],
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
├── modules/
│   └── user/
│       ├── user.controller.ts
│       ├── user.service.ts
│       └── user.dto.ts
└── index.ts         # Application entry point

test/
└── e2e/
    ├── setup.ts     # E2E test utilities
    └── user.e2e.test.ts
\`\`\`

## 🔧 Available Scripts

- \`bun run dev\` - Start development server with hot reload
- \`bun run start\` - Start production server
- \`bun run build\` - Build TypeScript to JavaScript
- \`bun test\` - Run unit tests
- \`bun test:unit\` - Run unit tests
- \`bun test:e2e\` - Run E2E tests
- \`bun test:all\` - Run all tests
${eslint ? "- `bun run lint` - Run ESLint" : ""}
${prettier ? "- `bun run format` - Format code with Prettier" : ""}

## 📚 Documentation

- [WynkJS Documentation](https://github.com/wynkjs/wynkjs-core)

## 🛠️ Built With

- [WynkJS](https://github.com/wynkjs/wynkjs-core) - NestJS-style framework for Bun
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

  // E2E test files
  createE2ETestFiles(targetDir);
}

function createSourceFiles(targetDir: string) {
  // WynkJS is TypeScript-first, always use .ts extension
  const ext = "ts";

  // src/modules/user/user.dto.ts
  const userDtoContent = `import { DTO, CommonDTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 50 }),
  email: CommonDTO.Email(),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface CreateUserType {
  name: string;
  email: string;
  age: number;
}

export const UserIdDto = DTO.Object({
  id: DTO.String(),
});
`;

  writeFileSync(
    join(targetDir, `src/modules/user/user.dto.${ext}`),
    userDtoContent
  );

  // src/modules/user/user.service.ts
  const userServiceContent = `import { Injectable } from "wynkjs";

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

@Injectable()
export class UserService {
  private users: User[] = [
    { id: "1", name: "Alice", email: "alice@example.com", age: 25 },
    { id: "2", name: "Bob", email: "bob@example.com", age: 30 },
  ];

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(data: { name: string; email: string; age: number }): User {
    const user: User = { id: Date.now().toString(), ...data };
    this.users.push(user);
    return user;
  }
}
`;

  writeFileSync(
    join(targetDir, `src/modules/user/user.service.${ext}`),
    userServiceContent
  );

  // src/modules/user/user.controller.ts
  const userControllerContent = `import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { CreateUserDTO, UserIdDto } from "./user.dto.js";
import type { CreateUserType } from "./user.dto.js";
import { UserService } from "./user.service.js";

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
    join(targetDir, `src/modules/user/user.controller.${ext}`),
    userControllerContent
  );

  // src/modules/user/user.controller.test.ts
  const userControllerTestContent = `import { describe, test, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

describe("UserController", () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe("list", () => {
    test("should return an array of users", async () => {
      const result = await controller.list();
      
      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);
    });
  });

  describe("create", () => {
    test("should create a user", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        age: 25,
      };

      const result = await controller.create(userData);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("User created");
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe(userData.name);
      expect(result.user.email).toBe(userData.email);
    });

    test("should handle user creation without optional fields", async () => {
      const userData = {
        name: "Minimal User",
        email: "minimal@example.com",
      };

      const result = await controller.create(userData);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("User created");
    });
  });

  describe("findOne", () => {
    test("should return a user by id", async () => {
      const result = await controller.findOne("1");
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe("1");
    });
  });

  describe("update", () => {
    test("should update a user", async () => {
      const updateData = {
        email: "updated@example.com",
        age: 30,
      };

      const result = await controller.update("1", updateData);
      
      expect(result).toBeDefined();
      expect(result.message).toBe("User updated");
      expect(result.id).toBe("1");
    });
  });
});
`;

  writeFileSync(
    join(targetDir, `src/modules/user/user.controller.test.${ext}`),
    userControllerTestContent
  );

  // src/modules/user/user.service.test.ts
  const userServiceTestContent = `import { describe, test, expect } from "bun:test";
import { UserService } from "./user.service";

describe("UserService", () => {
  const service = new UserService();

  describe("getUsers", () => {
    test("should return an array of users", () => {
      const users = service.getUsers();
      
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    test("should include Alice, Bob, and Charlie", () => {
      const users = service.getUsers();
      
      expect(users).toContain("Alice");
      expect(users).toContain("Bob");
      expect(users).toContain("Charlie");
    });
  });

  describe("createUser", () => {
    test("should create a user with provided data", () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        age: 25,
      };

      const result = service.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
      expect(result.age).toBe(userData.age);
    });
  });

  describe("getUserById", () => {
    test("should return user data for valid id", () => {
      const result = service.getUserById("123");
      
      expect(result).toBeDefined();
      expect(result.id).toBe("123");
      expect(result.name).toBe("Alice");
    });
  });

  describe("updateUser", () => {
    test("should return updated user data", () => {
      const updateData = {
        email: "updated@example.com",
        age: 30,
      };

      const result = service.updateUser("123", updateData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(updateData.email);
      expect(result.age).toBe(updateData.age);
    });
  });
});
`;

  writeFileSync(
    join(targetDir, `src/modules/user/user.service.test.${ext}`),
    userServiceTestContent
  );

  // src/index.ts
  const indexContent = `import { WynkFactory } from "wynkjs";
import { UserController } from "./modules/user/user.controller.js";

const app = WynkFactory.create({
  controllers: [UserController],
});

const PORT = process.env.PORT || 3000;

await app.listen(Number(PORT));

console.log(\`🚀 WynkJS server running on http://localhost:\${PORT}\`);
console.log(\`📝 API endpoints:\`);
console.log(\`   GET    http://localhost:\${PORT}/users\`);
console.log(\`   POST   http://localhost:\${PORT}/users\`);
console.log(\`   GET    http://localhost:\${PORT}/users/:id\`);
`;

  writeFileSync(join(targetDir, `src/index.${ext}`), indexContent);
}

function createE2ETestFiles(targetDir: string) {
  // test/e2e/setup.ts
  const setupContent = `import { WynkFactory } from "wynkjs";

export interface TestApp {
  baseUrl: string;
  stop: () => Promise<void>;
}

let currentServer: any = null;

/**
 * Start the WynkJS test server on a separate port
 * @param controllersOrPort - Either an array of controllers or a port number
 * @param portParam - Port number (only used if first param is controllers array)
 */
export async function startTestApp(
  controllersOrPort: any[] | number = 3001,
  portParam?: number
): Promise<TestApp> {
  // Stop existing server if running
  if (currentServer) {
    await stopTestApp();
  }

  // Parse parameters
  let controllers: any[];
  let port: number;

  if (Array.isArray(controllersOrPort)) {
    controllers = controllersOrPort;
    port = portParam || 3001;
  } else {
    // If only port passed, import and use UserController
    const { UserController } = await import("./modules/user/user.controller.js");
    controllers = [UserController];
    port = controllersOrPort;
  }

  const app = WynkFactory.create({ controllers });
  currentServer = await app.listen(port);

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    baseUrl: \`http://localhost:\${port}\`,
    stop: async () => {
      if (currentServer) {
        await currentServer.stop();
        currentServer = null;
      }
    },
  };
}

/**
 * Stop the test server
 */
export async function stopTestApp(app?: TestApp): Promise<void> {
  if (currentServer) {
    await currentServer.stop();
    currentServer = null;
  }
  if (app?.stop) {
    await app.stop();
  }
}

/**
 * Make an HTTP request to the test server
 */
export async function request(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, options);
}

/**
 * Parse JSON response safely
 */
export async function parseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Failed to parse JSON", body: text };
  }
}

/**
 * Assert response status
 */
export function expectStatus(response: Response, expectedStatus: number) {
  if (response.status !== expectedStatus) {
    throw new Error(
      \`Expected status \${expectedStatus}, got \${response.status}\`
    );
  }
}

/**
 * Create test user for testing
 */
export function createTestUser(overrides?: Partial<any>) {
  return {
    name: "Test User",
    email: "test@example.com",
    age: 25,
    ...overrides,
  };
}
`;

  writeFileSync(join(targetDir, "test/e2e/setup.ts"), setupContent);

  // test/e2e/user.e2e.test.ts
  const userE2EContent = `import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  startTestApp,
  stopTestApp,
  request,
  parseJson,
  expectStatus,
  createTestUser,
  type TestApp,
} from "./setup";
import { UserController } from "../../src/modules/user/user.controller";

describe("User E2E Tests", () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await startTestApp([UserController]);
  });

  afterAll(async () => {
    await stopTestApp(app);
  });

  describe("GET /users", () => {
    test("should list all users", async () => {
      const response = await request(\`\${app.baseUrl}/users\`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data).toHaveProperty("users");
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThan(0);
    });
  });

  describe("POST /users", () => {
    test("should create a new user with valid data", async () => {
      const newUser = createTestUser({ name: "John Doe", email: "john@example.com" });

      const response = await request(\`\${app.baseUrl}/users\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data).toHaveProperty("message", "User created");
      expect(data).toHaveProperty("user");
      expect(data.user.name).toBe("John Doe");
      expect(data.user.email).toBe("john@example.com");
    });

    test("should reject user creation with invalid email", async () => {
      const invalidUser = createTestUser({ email: "invalid-email" });

      const response = await request(\`\${app.baseUrl}/users\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });
      expectStatus(response, 400);
      
      const data = await parseJson(response);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toBeDefined();
    });

    test("should reject user creation with missing name", async () => {
      const invalidUser = { email: "test@example.com", age: 25 };

      const response = await request(\`\${app.baseUrl}/users\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });
      expectStatus(response, 400);
      
      const data = await parseJson(response);
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toBeDefined();
    });
  });

  describe("GET /users/:id", () => {
    test("should get user by id", async () => {
      const response = await request(\`\${app.baseUrl}/users/1\`);
      expectStatus(response, 200);

      const data = await parseJson(response);
      expect(data).toHaveProperty("user");
      expect(data.user.id).toBe("1");
    });

    test("should return 404 for non-existent user", async () => {
      const response = await request(\`\${app.baseUrl}/users/999999\`);
      expectStatus(response, 404);

      const data = await parseJson(response);
      expect(data).toHaveProperty("message", "User not found");
    });
  });

  describe("Full User Lifecycle", () => {
    test("should create, retrieve, and verify user", async () => {
      // Create user
      const newUser = createTestUser({ 
        name: "Lifecycle Test", 
        email: "lifecycle@example.com",
        age: 28
      });

      const createResponse = await request(\`\${app.baseUrl}/users\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      expectStatus(createResponse, 200);

      const createData = await parseJson(createResponse);
      expect(createData.user).toBeDefined();
      const userId = createData.user.id;

      // Retrieve user
      const getResponse = await request(\`\${app.baseUrl}/users/\${userId}\`);
      expectStatus(getResponse, 200);

      const getData = await parseJson(getResponse);
      expect(getData.user.id).toBe(userId);
      expect(getData.user.name).toBe("Lifecycle Test");
      expect(getData.user.email).toBe("lifecycle@example.com");
    });
  });
});
`;

  writeFileSync(join(targetDir, "test/e2e/user.e2e.test.ts"), userE2EContent);
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
