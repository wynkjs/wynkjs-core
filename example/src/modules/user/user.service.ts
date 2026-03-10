import { Injectable } from "wynkjs";

export interface User {
  id: string;
  username?: string;
  email: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  private store: Map<string, User> = new Map();
  private counter = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    const demo: User[] = [
      {
        id: "user-1",
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Smith",
        username: "alice",
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "user-2",
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Jones",
        username: "bob",
        isActive: true,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      },
    ];
    demo.forEach((u) => this.store.set(u.id, u));
    this.counter = 3;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<User | undefined> {
    return this.store.get(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.store.values()).find((u) => u.email === email);
  }

  async create(data: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
  }): Promise<User> {
    const emailTaken = Array.from(this.store.values()).some((u) => u.email === data.email);
    if (emailTaken) throw new Error("User with this email already exists");
    const id = `user-${this.counter++}`;
    const now = new Date();
    const user: User = {
      id,
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, user);
    return user;
  }

  async update(
    id: string,
    data: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      mobile: string;
      age: number;
    }>
  ): Promise<User | undefined> {
    const user = this.store.get(id);
    if (!user) return undefined;
    if (data.email && Array.from(this.store.values()).some((u) => u.id !== id && u.email === data.email)) {
      throw new Error("User with this email already exists");
    }
    const updated: User = { ...user, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
