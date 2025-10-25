import { Injectable } from "wynkjs";

export interface Product {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add your fields here
}

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

  update(id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Product | undefined {
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
