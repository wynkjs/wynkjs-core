import { Injectable, OnModuleInit } from "wynkjs";

@Injectable()
export class DemoService implements OnModuleInit {
  private items: string[] = ["item-alpha", "item-beta", "item-gamma"];

  onModuleInit() {
    console.log("[DemoService] onModuleInit lifecycle hook fired — service ready");
  }

  getItems(): string[] {
    return this.items;
  }

  addItem(name: string): string[] {
    this.items.push(name);
    return this.items;
  }

  transform(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
  }
}
