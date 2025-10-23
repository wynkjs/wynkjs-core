import { toPascalCase } from "../utils.js";

export function generateServiceTemplate(name: string): string {
  const entityName = toPascalCase(name);
  const className = `${entityName}Service`;

  return `import { Injectable } from "wynkjs";

export interface ${entityName} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add your fields here
}

@Injectable()
export class ${className} {
  private items: ${entityName}[] = [];

  findAll(): ${entityName}[] {
    return this.items;
  }

  findById(id: string): ${entityName} | undefined {
    return this.items.find((item) => item.id === id);
  }

  create(data: Omit<${entityName}, "id" | "createdAt" | "updatedAt">): ${entityName} {
    const item: ${entityName} = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  update(id: string, data: Partial<Omit<${entityName}, "id" | "createdAt" | "updatedAt">>): ${entityName} | undefined {
    const index = this.items.findIndex((item) => item.id === id);
    
    if (index === -1) {
      return undefined;
    }

    this.items[index] = {
      ...this.items[index],
      ...data,
      updatedAt: new Date(),
    };

    return this.items[index];
  }

  delete(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    
    if (index === -1) {
      return false;
    }

    this.items.splice(index, 1);
    return true;
  }
}
`;
}
