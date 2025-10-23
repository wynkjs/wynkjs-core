import { Injectable } from "wynkjs";

export interface Cart {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add your fields here
}

@Injectable()
export class CartService {
  private items: Cart[] = [];

  findAll(): Cart[] {
    return this.items;
  }

  findById(id: string): Cart | undefined {
    return this.items.find((item) => item.id === id);
  }

  create(data: Omit<Cart, "id" | "createdAt" | "updatedAt">): Cart {
    const item: Cart = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  update(
    id: string,
    data: Partial<Omit<Cart, "id" | "createdAt" | "updatedAt">>
  ): Cart | undefined {
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
