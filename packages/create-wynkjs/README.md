# create-wynkjs

Scaffold a new WynkJS project with best practices and developer tools.

## 🚀 Usage

```bash
# Using bunx (recommended)
bunx create-wynkjs

# Using npx
npx create-wynkjs
```

## ✨ Features

**WynkJS is TypeScript-first!** All projects are created with TypeScript.

The CLI will prompt you to configure:

- ✅ **ESLint** - Code linting with TypeScript rules (optional)
- ✅ **Prettier** - Code formatting (optional)
- ✅ **Husky** - Git hooks for pre-commit checks (optional)
- ✅ **Hot Reload** - Watch mode with `bun --watch` (like nodemon, always included)

## 📦 What's Included

### Project Structure

```
my-wynkjs-app/
├── src/
│   ├── controllers/
│   │   └── user.controller.ts    # Example CRUD controller
│   ├── services/
│   │   └── user.service.ts       # Example service with DI
│   ├── dto/
│   │   └── user.dto.ts           # Validation schemas
│   └── index.ts                   # Application entry point
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── tsconfig.json                  # TypeScript configuration
├── .gitignore
├── .env.example
├── package.json
└── README.md
```

### Scripts

All generated projects include:

```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts", // Hot reload development
    "start": "bun src/index.ts", // Production start
    "build": "tsc", // Build TypeScript
    "lint": "eslint src/**/*.ts", // Run linter
    "format": "prettier --write src/**/*.ts" // Format code
  }
}
```

### Example Code

The generated project includes a complete working example:

- **User Controller** - CRUD operations with dependency injection
- **User Service** - Business logic layer
- **User DTOs** - Request validation with WynkJS DTO builder
- **Proper TypeScript types** - Full type safety

## 🎯 Quick Start After Creation

```bash
# Create your project
bunx create-wynkjs

# Navigate to project
cd my-wynkjs-app

# Start development server
bun run dev
```

The server will start on `http://localhost:3000` with hot reload enabled!

### Test the API

```bash
# Get all users
curl http://localhost:3000/users

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25}'

# Get user by ID
curl http://localhost:3000/users/1
```

## 🔧 Configuration Options

### TypeScript (Always Included)

Every project includes strict TypeScript configuration with:

- Experimental decorators enabled (required for WynkJS)
- Strict mode for type safety
- Source maps for debugging
- Declaration files for library publishing
- Optimized for Bun runtime

### ESLint

Configured for TypeScript with:

- Recommended rules
- TypeScript-specific linting
- Unused variable detection

### Prettier

Opinionated formatting with:

- 2 space indentation
- Semicolons
- Double quotes
- 80 character line width

### Husky + lint-staged

Pre-commit hooks that automatically:

- Run ESLint and auto-fix
- Format code with Prettier
- Only on staged files

## 🚀 Hot Reload

Development mode uses `bun --watch` which:

- ⚡ Automatically restarts on file changes
- 🔥 Faster than nodemon
- 💪 Native to Bun (no extra dependencies)

## 📚 Learn More

- [WynkJS Documentation](https://github.com/wynkjs/wynkjs-core)
- [WynkJS Examples](https://github.com/wynkjs/wynkjs-core/tree/main/example)
- [Elysia Documentation](https://elysiajs.com)

## 🤝 Contributing

Issues and PRs welcome at [wynkjs/wynkjs-core](https://github.com/wynkjs/wynkjs-core)

## 📝 License

MIT - see LICENSE file for details

---

**Built with ❤️ by the WynkJS Team**
