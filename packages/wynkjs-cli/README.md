# wynkjs-cli

Official CLI tool for WynkJS framework to generate modules, controllers, services, and DTOs.

## 🚀 Installation

### Global Installation (Recommended)

```bash
bun add -g wynkjs-cli
```

### Local Installation

```bash
bun add -D wynkjs-cli
```

## 📖 Usage

### Generate a Complete Module

Generate a complete CRUD module with controller, service, and DTO in a folder:

```bash
wynkjs-cli generate module product
# or
wynkjs-cli g m product
```

This creates:

```
src/modules/product/
├── controllers/
│   └── product.controller.ts
├── services/
│   └── product.service.ts
└── dto/
    └── product.dto.ts
```

### Generate Controller Only

Generate a controller with all HTTP methods (GET, POST, PUT, PATCH, DELETE):

```bash
wynkjs-cli generate controller user
# or
wynkjs-cli g c user
```

This creates:

- `src/controllers/user.controller.ts` with full CRUD operations
- Automatically imports and adds to `src/index.ts` controllers array

### Generate Service Only

Generate a service with all CRUD methods:

```bash
wynkjs-cli generate service user
# or
wynkjs-cli g s user
```

This creates:

- `src/services/user.service.ts` with findAll, findById, create, update, delete methods

### Generate DTO Only

Generate DTOs (Create, Update, and ID parameter DTOs):

```bash
wynkjs-cli generate dto user
# or
wynkjs-cli g d user
```

This creates:

- `src/dto/user.dto.ts` with CreateUserDTO, UpdateUserDTO, and UserIdDto

## 📁 Configuration

You can customize the directory structure by creating a `wynkjs.config.json` in your project root:

```json
{
  "srcDir": "src",
  "controllersDir": "src/controllers",
  "servicesDir": "src/services",
  "dtoDir": "src/dto",
  "modulesDir": "src/modules"
}
```

## 📝 Generated Code Examples

### Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Injectable,
  NotFoundException,
} from "wynkjs";

@Injectable()
@Controller("/products")
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get("/")
  async findAll() {
    const items = this.productService.findAll();
    return { data: items };
  }

  @Get({ path: "/:id", params: ProductIdDto })
  async findOne(@Param("id") id: string) {
    const item = this.productService.findById(id);
    if (!item) {
      throw new NotFoundException("Product not found");
    }
    return { data: item };
  }

  @Post({ path: "/", body: CreateProductDTO })
  async create(@Body() body: CreateProductType) {
    const item = this.productService.create(body);
    return { message: "Product created successfully", data: item };
  }

  // PUT, PATCH, DELETE methods included...
}
```

### Service

```typescript
import { Injectable } from "wynkjs";

@Injectable()
export class ProductService {
  private items: Product[] = [];

  findAll(): Product[] {
    return this.items;
  }

  findById(id: string): Product | undefined {
    return this.items.find((item) => item.id === id);
  }

  create(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const item: Product = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  // update and delete methods included...
}
```

### DTO

```typescript
import { DTO } from "wynkjs";

export const CreateProductDTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 100 }),
  // Add more fields as needed
});

export interface CreateProductType {
  name: string;
}

export const UpdateProductDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 100 })),
});

export interface UpdateProductType {
  name?: string;
}

export const ProductIdDto = DTO.Object({
  id: DTO.String(),
});
```

## ✨ Features

- ✅ **Full CRUD Generation** - Complete module with controller, service, and DTO
- ✅ **Auto Import** - Automatically updates `index.ts` with new controllers
- ✅ **TypeScript First** - All generated code is TypeScript
- ✅ **WynkJS Best Practices** - Following framework conventions
- ✅ **Customizable** - Configure directories via `wynkjs.config.json`
- ✅ **Smart Naming** - Handles kebab-case, camelCase, and PascalCase conversions

## 🎯 Commands Reference

| Command                                 | Alias                   | Description                   |
| --------------------------------------- | ----------------------- | ----------------------------- |
| `wynkjs-cli generate module <name>`     | `wynkjs-cli g m <name>` | Generate complete CRUD module |
| `wynkjs-cli generate controller <name>` | `wynkjs-cli g c <name>` | Generate controller only      |
| `wynkjs-cli generate service <name>`    | `wynkjs-cli g s <name>` | Generate service only         |
| `wynkjs-cli generate dto <name>`        | `wynkjs-cli g d <name>` | Generate DTO only             |
| `wynkjs-cli --help`                     | `wynkjs-cli -h`         | Show help                     |
| `wynkjs-cli --version`                  | `wynkjs-cli -v`         | Show version                  |

## 🔧 Naming Conventions

The CLI handles various naming formats:

```bash
wynkjs-cli g m product        # → ProductController, ProductService
wynkjs-cli g m user-profile   # → UserProfileController, UserProfileService
wynkjs-cli g m orderItem      # → OrderItemController, OrderItemService
```

Generated files use kebab-case:

- `product.controller.ts`
- `user-profile.service.ts`
- `order-item.dto.ts`

## 💡 Tips

1. **Generate Module First**: Use `wynkjs-cli g m <name>` to create everything at once
2. **Customize After**: Edit generated files to add your business logic
3. **Check index.ts**: Verify controller was added to the controllers array
4. **Update DTOs**: Modify DTO schemas to match your data model

## 🤝 Integration with create-wynkjs

If you created your project with `create-wynkjs`, the CLI works out of the box:

```bash
# Create project
bunx create-wynkjs

# Navigate to project
cd my-wynkjs-app

# Install CLI
bun add -D wynkjs-cli

# Generate resources
wynkjs-cli g m product
```

## 📚 Learn More

- [WynkJS Documentation](https://github.com/wynkjs/wynkjs-core)
- [WynkJS Examples](https://github.com/wynkjs/wynkjs-core/tree/main/example)

## 🐛 Issues & Feedback

Report issues at [wynkjs/wynkjs-core/issues](https://github.com/wynkjs/wynkjs-core/issues)

## 📝 License

MIT

---

**Built with ❤️ by the WynkJS Team**
