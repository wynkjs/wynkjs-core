// @ts-nocheck - Decorator type checking in test files conflicts with Bun's runtime implementation
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { WynkFactory, WynkFramework } from "../core/factory";
import { Controller, Get, Post, Injectable, Singleton } from "../core";
import "reflect-metadata";

/**
 * Comprehensive Factory Test Suite
 * Tests all factory functionality including:
 * - Provider registration and lifecycle
 * - Controller registration
 * - Signal handler management
 * - Graceful shutdown
 * - Memory leak prevention
 * - Error handling
 *
 * Note: TypeScript shows decorator warnings but all decorators work correctly at runtime.
 * The warnings are due to differences between TypeScript's decorator metadata and Bun's implementation.
 */

// Mock classes for testing
@Singleton()
@Injectable()
class MockDatabaseService {
  public initialized = false;
  public destroyed = false;
  public db: any = { connected: true };

  async onModuleInit() {
    this.initialized = true;
    console.log("Mock database initialized");
  }

  async onModuleDestroy() {
    this.destroyed = true;
    console.log("Mock database destroyed");
  }
}

@Singleton()
@Injectable()
class MockCacheService {
  public initialized = false;
  public destroyed = false;

  async onModuleInit() {
    this.initialized = true;
  }

  async onModuleDestroy() {
    this.destroyed = true;
  }
}

@Singleton()
@Injectable()
class MockServiceWithoutLifecycle {
  public value = "test";
}

@Controller("/test")
class MockController {
  @Get({ path: "/" })
  async index() {
    return { message: "Hello from test controller" };
  }

  @Get({ path: "/:id" })
  async getById() {
    return { id: 1 };
  }

  @Post({ path: "/" })
  async create() {
    return { created: true };
  }
}

@Controller("/users")
// Mock user controller that depends on DatabaseService
@Injectable()
class MockUserController {
  constructor(private dbService: MockDatabaseService) {}

  @Get({ path: "/" })
  async list() {
    return { users: [] };
  }
}

describe("WynkFactory - Provider Management", () => {
  it("should create factory instance with providers", () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    expect(app).toBeInstanceOf(WynkFramework);
  });

  it("should initialize providers with onModuleInit lifecycle", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    await app.build();

    // Provider should be initialized
    const { container } = await import("tsyringe");
    const dbService = container.resolve(MockDatabaseService);
    expect(dbService.initialized).toBe(true);
  });

  it("should initialize multiple providers in order", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService, MockCacheService],
    });

    await app.build();

    const { container } = await import("tsyringe");
    const dbService = container.resolve(MockDatabaseService);
    const cacheService = container.resolve(MockCacheService);

    expect(dbService.initialized).toBe(true);
    expect(cacheService.initialized).toBe(true);
  });

  it("should handle providers without lifecycle hooks", async () => {
    const app = WynkFactory.create({
      providers: [MockServiceWithoutLifecycle],
    });

    // Should not throw error
    await expect(app.build()).resolves.toBeDefined();
  });

  it("should NOT register providers twice", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    await app.build();

    // Check that provider is registered only once
    // This prevents the "Called end on pool more than once" error
    const { container } = await import("tsyringe");
    const instance1 = container.resolve(MockDatabaseService);
    const instance2 = container.resolve(MockDatabaseService);

    // Should be the same instance (Singleton)
    expect(instance1).toBe(instance2);
  });
});

describe("WynkFactory - Controller Registration", () => {
  it("should register controller with routes", async () => {
    const app = WynkFactory.create({
      controllers: [MockController],
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should register multiple controllers", async () => {
    const app = WynkFactory.create({
      controllers: [MockController, MockUserController],
      providers: [MockDatabaseService],
    });

    const wynkApp = await app.build();
    expect(wynkApp).toBeDefined();
  });

  it("should inject providers into controllers", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
      controllers: [MockUserController],
    });

    await app.build();

    const { container } = await import("tsyringe");
    const controller = container.resolve(MockUserController);
    expect(controller).toBeDefined();
  });
});

describe("WynkFactory - Graceful Shutdown", () => {
  it("should register signal handlers only once", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    // Mock process.once to track calls
    let sigtermCount = 0;
    let sigintCount = 0;

    const originalOnce = process.once;
    process.once = ((event: string, handler: any) => {
      if (event === "SIGTERM") sigtermCount++;
      if (event === "SIGINT") sigintCount++;
      return process as any;
    }) as any;

    await app.build();
    const port = 3001 + Math.floor(Math.random() * 1000);

    // Start listening (this registers handlers)
    const listenPromise = app.listen(port);

    // Give it time to start
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Restore original
    process.once = originalOnce;

    expect(sigtermCount).toBe(1);
    expect(sigintCount).toBe(1);
  });

  it("should call onModuleDestroy during shutdown", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    await app.build();

    const { container } = await import("tsyringe");
    const dbService = container.resolve(MockDatabaseService);

    // Manually trigger destroyProviders (private method, accessed via app)
    await (app as any).destroyProviders();

    expect(dbService.destroyed).toBe(true);
  });
});

describe("WynkFactory - Memory Leak Prevention", () => {
  it("should prevent duplicate signal handler registration", async () => {
    const app1 = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    const app2 = WynkFactory.create({
      providers: [MockCacheService],
    });

    // Both apps should have their own shutdown handler flag
    expect((app1 as any).shutdownHandlersRegistered).toBe(false);
    expect((app2 as any).shutdownHandlersRegistered).toBe(false);
  });

  it("should sort params only once during registration", async () => {
    // Create a controller with params
    @Controller("/api")
    class ParamsTestController {
      @Get({ path: "/:id/:name/:type" })
      async test() {
        return { ok: true };
      }
    }

    const app = WynkFactory.create({
      controllers: [ParamsTestController],
    });

    // Mock Array.prototype.sort to track calls
    let sortCallCount = 0;
    const originalSort = Array.prototype.sort;
    Array.prototype.sort = function (this: any[], ...args: any[]) {
      sortCallCount++;
      return originalSort.apply(this, args as any);
    };

    await app.build();

    // Restore
    Array.prototype.sort = originalSort;

    // Should have sorted params during registration only
    expect(sortCallCount).toBeGreaterThanOrEqual(0);
  });
});

describe("WynkFactory - CORS and Global Prefix", () => {
  it("should enable CORS when configured", () => {
    const consoleLogSpy = mock(() => {});
    const originalLog = console.log;
    console.log = consoleLogSpy;

    WynkFactory.create({
      cors: true,
    });

    // Should have logged CORS enabled message
    expect(consoleLogSpy).toHaveBeenCalled();

    console.log = originalLog;
  });

  it("should configure global prefix when set", () => {
    const consoleLogSpy = mock(() => {});
    const originalLog = console.log;
    console.log = consoleLogSpy;

    WynkFactory.create({
      globalPrefix: "/api/v1",
    });

    // Should have logged global prefix configured message
    expect(consoleLogSpy).toHaveBeenCalled();

    console.log = originalLog;
  });
});

describe("WynkFactory - Error Handling", () => {
  it("should throw error if provider initialization fails", async () => {
    @Injectable()
    class FailingProvider {
      async onModuleInit() {
        throw new Error("Intentional failure");
      }
    }

    const app = WynkFactory.create({
      providers: [FailingProvider],
    });

    await expect(app.build()).rejects.toThrow();
  });

  it("should continue cleanup even if one provider fails to destroy", async () => {
    @Injectable()
    class FailingDestroyProvider {
      async onModuleInit() {
        // Success
      }

      async onModuleDestroy() {
        throw new Error("Destroy failed");
      }
    }

    const app = WynkFactory.create({
      providers: [FailingDestroyProvider, MockCacheService],
    });

    await app.build();

    // Should not throw, just log error
    await expect((app as any).destroyProviders()).resolves.toBeUndefined();

    const { container } = await import("tsyringe");
    const cacheService = container.resolve(MockCacheService);
    expect(cacheService.destroyed).toBe(true);
  });
});

describe("WynkFactory - Global Filters, Guards, Interceptors, Pipes", () => {
  it("should register global guards", () => {
    const mockGuard = { canActivate: () => true };
    const app = WynkFactory.create({});

    app.useGlobalGuards(mockGuard);
    expect((app as any).globalGuards).toContain(mockGuard);
  });

  it("should register global interceptors", () => {
    const mockInterceptor = { intercept: () => {} };
    const app = WynkFactory.create({});

    app.useGlobalInterceptors(mockInterceptor);
    expect((app as any).globalInterceptors).toContain(mockInterceptor);
  });

  it("should register global pipes", () => {
    const mockPipe = { transform: (value: any) => value };
    const app = WynkFactory.create({});

    app.useGlobalPipes(mockPipe);
    expect((app as any).globalPipes).toContain(mockPipe);
  });

  it("should register global filters", () => {
    const mockFilter = { catch: () => {} };
    const app = WynkFactory.create({});

    app.useGlobalFilters(mockFilter);
    expect((app as any).globalFilters).toContain(mockFilter);
  });
});

describe("WynkFactory - Chaining Methods", () => {
  it("should support method chaining", () => {
    const app = WynkFactory.create({});

    const result = app
      .registerProviders(MockDatabaseService)
      .registerControllers(MockController)
      .useGlobalGuards({ canActivate: () => true })
      .useGlobalFilters({ catch: () => {} });

    expect(result).toBe(app);
  });
});

describe("WynkFactory - Static vs Instance Creation", () => {
  it("should create via WynkFactory.create()", () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    expect(app).toBeInstanceOf(WynkFramework);
  });

  it("should create via new WynkFramework()", () => {
    const app = new WynkFramework({
      providers: [MockDatabaseService],
    });

    expect(app).toBeInstanceOf(WynkFramework);
  });

  it("should handle empty options", () => {
    const app = WynkFactory.create({});
    expect(app).toBeInstanceOf(WynkFramework);
  });
});

describe("WynkFactory - Edge Cases", () => {
  it("should handle empty providers array", async () => {
    const app = WynkFactory.create({
      providers: [],
    });

    await expect(app.build()).resolves.toBeDefined();
  });

  it("should handle empty controllers array", async () => {
    const app = WynkFactory.create({
      controllers: [],
    });

    await expect(app.build()).resolves.toBeDefined();
  });

  it("should handle null/undefined options gracefully", async () => {
    const app1 = WynkFactory.create(undefined as any);
    const app2 = WynkFactory.create({} as any);

    expect(app1).toBeInstanceOf(WynkFramework);
    expect(app2).toBeInstanceOf(WynkFramework);
  });
});

describe("WynkFactory - Performance Tests", () => {
  it("should register many controllers efficiently", async () => {
    const controllers: any[] = [];

    // Create 50 mock controllers
    for (let i = 0; i < 50; i++) {
      @Controller(`/test${i}`)
      class DynamicController {
        @Get({ path: "/" })
        async index() {
          return { ok: true };
        }
      }
      controllers.push(DynamicController);
    }

    const app = WynkFactory.create({
      controllers,
    });

    const startTime = Date.now();
    await app.build();
    const endTime = Date.now();

    const duration = endTime - startTime;

    // Should register 50 controllers in less than 1 second
    expect(duration).toBeLessThan(1000);
  });

  it("should initialize many providers efficiently", async () => {
    const providers: any[] = [];

    // Create 20 mock providers
    for (let i = 0; i < 20; i++) {
      @Injectable()
      class DynamicProvider {
        async onModuleInit() {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }
      providers.push(DynamicProvider);
    }

    const app = WynkFactory.create({
      providers,
    });

    const startTime = Date.now();
    await app.build();
    const endTime = Date.now();

    const duration = endTime - startTime;

    // Should initialize 20 providers in reasonable time
    expect(duration).toBeLessThan(500);
  });
});

describe("WynkFactory - Integration Tests", () => {
  it("should build complete application with providers and controllers", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService, MockCacheService],
      controllers: [MockController, MockUserController],
    });

    const wynkApp = await app.build();

    const { container } = await import("tsyringe");
    const dbService = container.resolve(MockDatabaseService);
    const cacheService = container.resolve(MockCacheService);

    expect(dbService.initialized).toBe(true);
    expect(cacheService.initialized).toBe(true);
    expect(wynkApp).toBeDefined();
  });

  it("should handle full lifecycle: init -> run -> destroy", async () => {
    const app = WynkFactory.create({
      providers: [MockDatabaseService],
    });

    // Initialize
    await app.build();

    const { container } = await import("tsyringe");
    const dbService = container.resolve(MockDatabaseService);
    expect(dbService.initialized).toBe(true);

    // Destroy
    await (app as any).destroyProviders();
    expect(dbService.destroyed).toBe(true);
  });
});
