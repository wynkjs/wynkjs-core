import { describe, it, expect, beforeEach } from "bun:test";
import "reflect-metadata";
import { container } from "tsyringe";

import {
  WynkFactory,
  ValueProvider,
  FactoryProvider,
  ExistingProvider,
  Provider,
} from "../core/factory";
import { Controller, Get, Sse } from "../core/decorators/http.decorators";
import { injectable, inject } from "tsyringe";
import {
  WynkPipeTransform,
  ParseFilePipe,
  ArgumentMetadata,
} from "../core/decorators/pipe.decorators";
import {
  WynkInterceptor,
  NestInterceptor,
  CallHandler,
} from "../core/decorators/interceptor.decorators";

// ─── ParseFilePipe ────────────────────────────────────────────────────────────

describe("ParseFilePipe", () => {
  it("passes through a valid file with no constraints", async () => {
    const pipe = new ParseFilePipe();
    const file = { type: "image/png", size: 1024 };
    const result = await pipe.transform(file);
    expect(result).toBe(file);
  });

  it("passes when file type matches configured fileType", async () => {
    const pipe = new ParseFilePipe({ fileType: "image/jpeg" });
    const file = { type: "image/jpeg", size: 500 };
    const result = await pipe.transform(file);
    expect(result).toBe(file);
  });

  it("throws when file type does not match", async () => {
    const pipe = new ParseFilePipe({ fileType: "image/jpeg" });
    const file = { type: "image/png", size: 500 };
    await expect(pipe.transform(file)).rejects.toThrow(
      'File type "image/png" is not allowed'
    );
  });

  it("passes when file size is within maxSize", async () => {
    const pipe = new ParseFilePipe({ maxSize: 1_000_000 });
    const file = { type: "application/pdf", size: 500_000 };
    const result = await pipe.transform(file);
    expect(result).toBe(file);
  });

  it("throws when file size exceeds maxSize", async () => {
    const pipe = new ParseFilePipe({ maxSize: 1_000_000 });
    const file = { type: "application/pdf", size: 2_000_000 };
    await expect(pipe.transform(file)).rejects.toThrow(
      "exceeds the maximum of 1000000 bytes"
    );
  });

  it("throws when no file is provided (null)", async () => {
    const pipe = new ParseFilePipe();
    await expect(pipe.transform(null)).rejects.toThrow("No file uploaded");
  });

  it("throws when no file is provided (undefined)", async () => {
    const pipe = new ParseFilePipe();
    await expect(pipe.transform(undefined)).rejects.toThrow("No file uploaded");
  });

  it("validates all files in an array", async () => {
    const pipe = new ParseFilePipe({ fileType: "image/png" });
    const files = [
      { type: "image/png", size: 100 },
      { type: "image/jpeg", size: 200 },
    ];
    await expect(pipe.transform(files)).rejects.toThrow(
      'File type "image/jpeg" is not allowed'
    );
  });

  it("validates both fileType and maxSize together", async () => {
    const pipe = new ParseFilePipe({ fileType: "image/png", maxSize: 1000 });
    const validFile = { type: "image/png", size: 500 };
    await expect(pipe.transform(validFile)).resolves.toBe(validFile);

    const wrongType = { type: "image/jpeg", size: 500 };
    await expect(pipe.transform(wrongType)).rejects.toThrow();

    const tooLarge = { type: "image/png", size: 2000 };
    await expect(pipe.transform(tooLarge)).rejects.toThrow();
  });

  it("accepts metadata argument without error", async () => {
    const pipe = new ParseFilePipe();
    const file = { type: "text/plain", size: 10 };
    const meta: ArgumentMetadata = { type: "body" };
    const result = await pipe.transform(file, meta);
    expect(result).toBe(file);
  });

  it("implements WynkPipeTransform interface", () => {
    const pipe = new ParseFilePipe();
    expect(typeof pipe.transform).toBe("function");
  });
});

// ─── @Sse decorator ───────────────────────────────────────────────────────────

describe("@Sse decorator", () => {
  it("registers a route with method GET and sse:true on metadata", () => {
    @Controller("/stream")
    class StreamController {
      @Sse("/events")
      events() {
        return { data: "ok" };
      }
    }

    const routes =
      Reflect.getMetadata("routes", StreamController.prototype) ||
      Reflect.getMetadata("routes", StreamController);
    const sseRoute = routes.find((r: any) => r.methodName === "events");
    expect(sseRoute).toBeDefined();
    expect(sseRoute.method).toBe("GET");
    expect(sseRoute.path).toBe("/events");
    expect(sseRoute.options?.sse).toBe(true);
  });

  it("registers with empty path when no path given", () => {
    @Controller("/stream2")
    class Stream2Controller {
      @Sse()
      liveData() {}
    }

    const routes =
      Reflect.getMetadata("routes", Stream2Controller.prototype) ||
      Reflect.getMetadata("routes", Stream2Controller);
    const sseRoute = routes.find((r: any) => r.methodName === "liveData");
    expect(sseRoute).toBeDefined();
    expect(sseRoute.options?.sse).toBe(true);
    expect(sseRoute.path).toBe("");
  });

  it("works with RouteOptions object", () => {
    @Controller("/stream3")
    class Stream3Controller {
      @Sse({ path: "/ticker" })
      ticker() {}
    }

    const routes =
      Reflect.getMetadata("routes", Stream3Controller.prototype) ||
      Reflect.getMetadata("routes", Stream3Controller);
    const sseRoute = routes.find((r: any) => r.methodName === "ticker");
    expect(sseRoute).toBeDefined();
    expect(sseRoute.path).toBe("/ticker");
    expect(sseRoute.options?.sse).toBe(true);
  });
});

// ─── NestInterceptor type alias ───────────────────────────────────────────────

describe("NestInterceptor type alias", () => {
  it("classes implementing NestInterceptor are usable as WynkInterceptor", () => {
    class LoggingInterceptor implements NestInterceptor {
      intercept(context: any, next: CallHandler) {
        return next.handle();
      }
    }

    const instance = new LoggingInterceptor();
    expect(typeof instance.intercept).toBe("function");
  });

  it("NestInterceptor and WynkInterceptor are structurally equivalent", () => {
    // A class satisfying WynkInterceptor must also satisfy NestInterceptor
    class TestInterceptor implements WynkInterceptor {
      intercept(context: any, next: CallHandler) {
        return next.handle();
      }
    }

    const asNest: NestInterceptor = new TestInterceptor();
    expect(typeof asNest.intercept).toBe("function");
  });
});

// ─── Provider token patterns (useValue / useFactory / useExisting) ─────────────

describe("Provider token patterns - useValue", () => {
  beforeEach(() => {
    container.reset();
  });

  it("registers a static value under a string token", async () => {
    const app = WynkFactory.create({
      controllers: [],
      providers: [{ provide: "MY_VALUE", useValue: 42 }],
    });
    await app.build();

    const resolved = container.resolve("MY_VALUE" as any);
    expect(resolved).toBe(42);
  });

  it("registers an object under a string token", async () => {
    const config = { port: 3000, debug: true };
    const app = WynkFactory.create({
      controllers: [],
      providers: [{ provide: "CONFIG", useValue: config }],
    });
    await app.build();

    const resolved = container.resolve("CONFIG" as any);
    expect(resolved).toEqual(config);
  });
});

describe("Provider token patterns - useFactory", () => {
  beforeEach(() => {
    container.reset();
  });

  it("calls the factory and registers the return value", async () => {
    const app = WynkFactory.create({
      controllers: [],
      providers: [
        {
          provide: "COMPUTED",
          useFactory: () => "factory-result",
        },
      ],
    });
    await app.build();

    const resolved = container.resolve("COMPUTED" as any);
    expect(resolved).toBe("factory-result");
  });

  it("injects dependencies into the factory via inject array", async () => {
    const app = WynkFactory.create({
      controllers: [],
      providers: [
        { provide: "BASE", useValue: 10 },
        {
          provide: "DOUBLED",
          useFactory: (base: number) => base * 2,
          inject: ["BASE"],
        },
      ],
    });
    await app.build();

    const resolved = container.resolve("DOUBLED" as any);
    expect(resolved).toBe(20);
  });

  it("supports async factory functions", async () => {
    const app = WynkFactory.create({
      controllers: [],
      providers: [
        {
          provide: "ASYNC_VALUE",
          useFactory: async () => {
            return "async-result";
          },
        },
      ],
    });
    await app.build();

    const resolved = container.resolve("ASYNC_VALUE" as any);
    expect(resolved).toBe("async-result");
  });
});

describe("Provider token patterns - useExisting", () => {
  beforeEach(() => {
    container.reset();
  });

  it("creates an alias from one token to another", async () => {
    const original = { database: "postgres" };
    const app = WynkFactory.create({
      controllers: [],
      providers: [
        { provide: "DB_CONFIG", useValue: original },
        { provide: "DATABASE_CONFIG", useExisting: "DB_CONFIG" },
      ],
    });
    await app.build();

    const resolved = container.resolve("DATABASE_CONFIG" as any);
    expect(resolved).toEqual(original);
  });
});

describe("Provider token patterns - useClass", () => {
  beforeEach(() => {
    container.reset();
  });

  it("registers a class under a custom token", async () => {
    @injectable()
    class MyService {
      getValue() {
        return "from-class";
      }
    }

    const app = WynkFactory.create({
      controllers: [],
      providers: [{ provide: "MY_SERVICE", useClass: MyService }],
    });
    await app.build();

    const resolved: any = container.resolve("MY_SERVICE" as any);
    expect(resolved.getValue()).toBe("from-class");
  });
});

describe("Provider token patterns - mixed", () => {
  beforeEach(() => {
    container.reset();
  });

  it("mixes plain class providers and token providers", async () => {
    @injectable()
    class PlainService {
      name = "plain";
    }

    const app = WynkFactory.create({
      controllers: [],
      providers: [
        PlainService,
        { provide: "LABEL", useValue: "mixed-test" },
      ],
    });
    await app.build();

    const label = container.resolve("LABEL" as any);
    expect(label).toBe("mixed-test");

    const plain = container.resolve(PlainService);
    expect(plain.name).toBe("plain");
  });
});

// ─── Provider type interfaces (structural checks) ─────────────────────────────

describe("Provider type interfaces", () => {
  it("ValueProvider shape is valid", () => {
    const p: ValueProvider = { provide: "TOKEN", useValue: "hello" };
    expect(p.provide).toBe("TOKEN");
    expect(p.useValue).toBe("hello");
  });

  it("FactoryProvider shape is valid", () => {
    const p: FactoryProvider = {
      provide: "TOKEN",
      useFactory: () => 42,
      inject: ["DEP"],
    };
    expect(typeof p.useFactory).toBe("function");
    expect(p.inject).toEqual(["DEP"]);
  });

  it("ExistingProvider shape is valid", () => {
    const p: ExistingProvider = { provide: "ALIAS", useExisting: "ORIGINAL" };
    expect(p.useExisting).toBe("ORIGINAL");
  });
});
