# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-10-25

### Added

- 🧪 **Testing Module** - Built-in testing utilities similar to @nestjs/testing
  - `Test.createTestingModule()` - Create isolated test modules with DI
  - `MockFactory` - Create mocks and spies for testing
  - Test utilities for creating mock requests, responses, and execution contexts
  - Full integration with Bun's built-in test runner
- 🧪 **Automatic Test Generation** - wynkjs-cli now generates test files
  - Controller tests with full CRUD coverage
  - Service tests with comprehensive test cases
  - Tests are generated alongside controllers and services
  - Uses Bun's built-in test runner (no Jest needed!)

### Changed

- 📦 **wynkjs-cli**: Updated module generator to create flat structure (`modules/user/*.ts`)
- 📦 **wynkjs-cli**: Controller and service imports updated for flat structure
- 📝 Updated examples to show testing patterns

## [1.0.2] - 2025-10-22

### Added

- 🎉 **create-wynkjs CLI** - New CLI tool to scaffold WynkJS projects with `bunx create-wynkjs` or `npx create-wynkjs`
  - Interactive project setup
  - TypeScript, ESLint, Prettier, Husky configuration options
  - Hot reload with `bun --watch` (faster than nodemon)
  - Complete working example with CRUD operations

### Fixed

- 🔧 **Improved IntelliSense for DTO** - Changed `DTO` export from `any` to `typeof t & { Strict: ... }` for full TypeScript autocomplete support
- 💡 **Better Developer Experience** - When typing `DTO.` in VS Code, all TypeBox methods now appear with proper documentation (String, Number, Object, Array, Optional, etc.)

### Changed

- 📝 Updated JSDoc comments for DTO with better examples
- 📝 Updated README with real, tested code examples from the example directory
- 🎯 **Clarified Bun-only support** - Removed Node.js references, WynkJS is built specifically for Bun runtime
- 📦 Updated package.json to use `@types/bun` instead of `@types/node`
- 🔄 Updated examples to use Bun-specific patterns and database drivers

## [1.0.1] - 2025-10-22

### Added

- ✨ **Auto-loaded reflect-metadata** - Users no longer need to manually import `reflect-metadata`
- ✨ **Capital-cased DI decorators** - Added `@Injectable()`, `@Inject()`, `@Singleton()`, `@AutoInjectable()`, `Registry`, and `Container` for consistency with framework naming conventions
- ✨ **Dual naming convention support** - Both capital-cased (recommended) and lowercase (tsyringe convention) decorators are available
- 📝 **Customizable validation error formatters** - Added `FormatErrorFormatter`, `SimpleErrorFormatter`, and `DetailedErrorFormatter` with `validationErrorFormatter` option in `ApplicationOptions`
- 📚 **Enhanced documentation** - Updated both main and core README files with DI improvements
- 🎨 **NestJS-style exception filters** - Complete exception filter pattern with production/development modes

### Changed

- 🔧 **Simplified imports** - All framework features now importable from single `wynkjs` package
- 📦 **Removed peer dependency requirement** - `reflect-metadata` now included as direct dependency, automatically loaded

### Fixed

- 🐛 **DI setup friction** - Eliminated need for manual `import "reflect-metadata"` in user code
- 🐛 **Inconsistent naming** - Aligned DI decorator naming with framework conventions (`Injectable` matches `Controller`, `Get`, etc.)

## [1.0.0] - 2025-10-21

### Added

- 🎉 Initial release of WynkJS
- 🚀 High-performance framework built on Elysia
- 🎨 NestJS-style decorator-based API
- 💉 Dependency injection with tsyringe
- 🔒 Type-safe TypeScript support
- 🔌 Complete middleware system (Guards, Interceptors, Pipes, Filters)
- ✅ DTO validation with TypeBox
- 📦 Database helpers (optional)
- 🌐 RESTful routing decorators
- ⚡ 20x faster than Express/NestJS

[1.0.1]: https://github.com/wynkjs/wynkjs-core/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/wynkjs/wynkjs-core/releases/tag/v1.0.0
