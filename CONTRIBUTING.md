# Contributing to WynkJS

Thank you for considering contributing to WynkJS! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

**Examples of encouraged behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy towards other community members

**Unacceptable behavior:**
- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information without permission
- Other unprofessional or unethical conduct

---

## How Can I Contribute?

### Reporting Bugs

Found a bug? Please [create an issue](https://github.com/wynkjs/wynkjs-core/issues/new) with:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Create a controller with '...'
2. Make a request to '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- WynkJS version: [e.g., 1.0.5]
- Bun version: [e.g., 1.0.20]
- OS: [e.g., macOS 14.0]

**Code snippet:**
```typescript
// Minimal reproduction code
```

**Additional context**
Any other relevant information.
```

### Suggesting Features

Have an idea? [Open a feature request](https://github.com/wynkjs/wynkjs-core/issues/new) with:

**Feature Request Template:**

```markdown
**Problem description**
What problem does this solve?

**Proposed solution**
How should it work?

**Example usage**
```typescript
// Show how the feature would be used
```

**Alternatives considered**
Other approaches you've thought about.

**Additional context**
Why is this important?
```

### Contributing Code

We welcome code contributions! See the [Development Workflow](#development-workflow) section.

### Improving Documentation

Documentation improvements are always welcome! See the [Documentation](#documentation) section.

---

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Git
- Code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/wynkjs-core.git
cd wynkjs-core

# Add upstream remote
git remote add upstream https://github.com/wynkjs/wynkjs-core.git
```

### Install Dependencies

```bash
# Install dependencies
bun install

# Build core package
bun run build
```

### Verify Setup

```bash
# Run tests
bun test

# Test in example project
cd example
bun install
bun run dev
```

---

## Project Structure

```
wynkjs-core/
├── core/                    # Core framework code
│   ├── decorators/          # Decorator implementations
│   ├── filters/             # Exception filters
│   ├── pipes/               # Pipes
│   ├── testing/             # Testing utilities
│   ├── interfaces/          # TypeScript interfaces
│   ├── factory.ts           # WynkFactory implementation
│   ├── dto.ts               # DTO helpers
│   ├── cors.ts              # CORS support
│   └── index.ts             # Public API
├── packages/
│   ├── create-wynkjs/       # Project scaffolding CLI
│   └── wynkjs-cli/          # Code generator CLI
├── example/                 # Example application
├── tests/                   # Test files
├── docs-wynkjs/             # Documentation
└── benchmark/               # Performance benchmarks
```

### Key Files

- **core/factory.ts**: Main framework factory
- **core/decorators/**: All decorator implementations
- **core/filters/exception.filters.ts**: Global exception filters
- **core/testing/**: Testing utilities

---

## Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

Edit files in appropriate locations:

- **Core features**: `core/`
- **CLI tools**: `packages/create-wynkjs/` or `packages/wynkjs-cli/`
- **Tests**: `tests/`
- **Documentation**: `docs-wynkjs/` or root `*.md` files
- **Examples**: `example/`

### 3. Build and Test

```bash
# Build core package
bun run build

# Run tests
bun test

# Test specific file
bun test tests/decorators.test.ts

# Test in example app
cd example
bun run dev
```

### 4. Manual Testing

```bash
# Test CLI in example project
cd example
bunx ../packages/wynkjs-cli/dist/index.js generate module test

# Test create-wynkjs
cd /tmp
bunx /path/to/wynkjs-core/packages/create-wynkjs
```

---

## Coding Standards

### TypeScript Style

```typescript
// ✅ Good
export class UserController {
  constructor(private userService: UserService) {}

  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }
}

// ❌ Bad
export class UserController {
  private userService;

  constructor(userService) {
    // Missing types
    this.userService = userService;
  }

  findAll() {
    // Missing return type
    return this.userService.findAll();
  }
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `user.controller.ts`)
- **Classes**: `PascalCase` (e.g., `UserController`)
- **Interfaces**: `PascalCase` with `I` prefix optional (e.g., `ExecutionContext`)
- **Functions**: `camelCase` (e.g., `getUserById`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PORT`)

### Code Organization

```typescript
// 1. Imports (grouped)
import { Injectable } from "wynkjs";
import type { User } from "./types";

// 2. Types/Interfaces
export interface UserServiceOptions {
  cacheEnabled: boolean;
}

// 3. Class implementation
@Injectable()
export class UserService {
  // 3a. Properties
  private users: User[] = [];

  // 3b. Constructor
  constructor(private options: UserServiceOptions) {}

  // 3c. Public methods
  async findAll(): Promise<User[]> {
    return this.users;
  }

  // 3d. Private methods
  private validateUser(user: User): boolean {
    return !!user.email;
  }
}
```

### Comments

```typescript
// ✅ Good - Explain WHY, not WHAT
// Using Map for O(1) lookup performance with large datasets
const cache = new Map<string, User>();

// ❌ Bad - States the obvious
// Create a new Map
const cache = new Map();
```

### Error Handling

```typescript
// ✅ Good - Specific error handling
try {
  await this.databaseService.connect();
} catch (error) {
  throw new InternalServerErrorException(
    `Database connection failed: ${error.message}`
  );
}

// ❌ Bad - Silent failures
try {
  await this.databaseService.connect();
} catch (error) {
  // Error ignored
}
```

---

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Test } from "wynkjs";

describe("UserController", () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const result = await controller.findAll();

      expect(result).toBeArray();
      expect(result.data).toBeDefined();
    });

    it("should return empty array when no users exist", async () => {
      const result = await controller.findAll();

      expect(result.data).toHaveLength(0);
    });
  });
});
```

### Test Coverage

- **Unit tests**: Test individual functions/methods
- **Integration tests**: Test controller + service interactions
- **E2E tests**: Test full HTTP request/response cycles

### Running Tests

```bash
# All tests
bun test

# Specific test file
bun test tests/decorators.test.ts

# Watch mode
bun test --watch

# With coverage (when available)
bun test --coverage
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic changes)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(decorators): add @Redirect decorator"

# Bug fix
git commit -m "fix(factory): resolve circular dependency in DI container"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(filters): simplify exception filter logic"
```

### Commit Message Guidelines

**Good commits:**

```
feat(cli): add module generation command

- Implements 'wynkjs-cli generate module <name>'
- Creates controller, service, and DTO files
- Auto-imports controller in index.ts

Closes #123
```

**Bad commits:**

```
updated files
fix bug
changes
```

---

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`bun test`)
- [ ] Code builds without errors (`bun run build`)
- [ ] Code follows style guidelines
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines

### Submitting a PR

1. **Push your branch:**

```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request** on GitHub

3. **Fill out the PR template:**

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how you tested your changes:

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Tested in example application
- [ ] Tested CLI tools

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No new warnings generated
- [ ] Added tests that prove fix/feature works
- [ ] New and existing tests pass

## Screenshots (if applicable)

## Related Issues

Closes #123
Related to #456
```

### PR Review Process

1. **Automated checks** run (tests, build)
2. **Maintainer review** (1-2 business days)
3. **Feedback addressed** if needed
4. **Approval and merge**

### After Merge

Your contribution will be included in the next release!

---

## Documentation

### Types of Documentation

1. **API Reference**: Document all public APIs
2. **Guides**: Step-by-step tutorials
3. **Examples**: Working code samples
4. **README**: Overview and quick start

### Documentation Style

```typescript
/**
 * Creates a new user in the database.
 *
 * @param data - User creation data
 * @returns The created user with generated ID
 * @throws {BadRequestException} If email is invalid
 * @throws {ConflictException} If email already exists
 *
 * @example
 * ```typescript
 * const user = await userService.create({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
async create(data: CreateUserDto): Promise<User> {
  // Implementation
}
```

### Updating Documentation

- **README.md**: Main project overview
- **docs-wynkjs/**: Detailed guides
- **Code comments**: JSDoc for public APIs
- **CHANGELOG.md**: Track changes between versions

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and discussions
- **Twitter**: [@wynkjs](https://twitter.com/wynkjs) - Updates and news

### Getting Help

- Check [existing documentation](../README.md)
- Search [existing issues](https://github.com/wynkjs/wynkjs-core/issues)
- Ask in [GitHub Discussions](https://github.com/wynkjs/wynkjs-core/discussions)

### Recognition

Contributors are recognized in:
- README contributors section
- Release notes
- CHANGELOG.md

---

## License

By contributing to WynkJS, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

- Open an issue
- Start a discussion
- Reach out to maintainers

---

**Thank you for contributing to WynkJS! 🎉**

**Built with ❤️ by the WynkJS Team**
