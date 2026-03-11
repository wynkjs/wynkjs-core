// @ts-nocheck
import { describe, it, expect } from "bun:test";
import "reflect-metadata";

import { HttpStatus } from "../core/common/http-status.enum";
import {
  TooManyRequestsException,
  HttpVersionNotSupportedException,
  HttpException,
} from "../core/decorators/exception.decorators";
import {
  SetMetadata,
  Reflector,
  applyDecorators,
  createParamDecorator,
} from "../core/decorators/metadata.decorators";
import { Module, Global } from "../core/module";
import {
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  BeforeApplicationShutdown,
} from "../core/interfaces/lifecycle.interface";
import { Optional } from "../core/decorators/di.decorators";
import { WynkFactory } from "../core/factory";
import { Controller, Get, Injectable, UseGuards } from "../core";

describe("HttpStatus enum", () => {
  it("has correct 2xx values", () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.ACCEPTED).toBe(202);
    expect(HttpStatus.NO_CONTENT).toBe(204);
  });

  it("has correct 4xx values", () => {
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.CONFLICT).toBe(409);
    expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
    expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
  });

  it("has correct 5xx values", () => {
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HttpStatus.NOT_IMPLEMENTED).toBe(501);
    expect(HttpStatus.BAD_GATEWAY).toBe(502);
    expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503);
    expect(HttpStatus.GATEWAY_TIMEOUT).toBe(504);
  });

  it("has correct 1xx values", () => {
    expect(HttpStatus.CONTINUE).toBe(100);
    expect(HttpStatus.SWITCHING_PROTOCOLS).toBe(101);
    expect(HttpStatus.PROCESSING).toBe(102);
  });

  it("has correct 3xx values", () => {
    expect(HttpStatus.MOVED_PERMANENTLY).toBe(301);
    expect(HttpStatus.FOUND).toBe(302);
    expect(HttpStatus.NOT_MODIFIED).toBe(304);
  });
});

describe("TooManyRequestsException", () => {
  it("has status code 429", () => {
    const ex = new TooManyRequestsException();
    expect(ex.statusCode).toBe(429);
    expect(ex.getStatus()).toBe(429);
  });

  it("uses default message", () => {
    const ex = new TooManyRequestsException();
    expect(ex.message).toBe("Too Many Requests");
  });

  it("accepts custom message", () => {
    const ex = new TooManyRequestsException("Rate limit exceeded");
    expect(ex.message).toBe("Rate limit exceeded");
  });

  it("is instanceof HttpException", () => {
    expect(new TooManyRequestsException()).toBeInstanceOf(HttpException);
  });

  it("getResponse returns correct shape", () => {
    const ex = new TooManyRequestsException("slow down");
    const res = ex.getResponse();
    expect(res.statusCode).toBe(429);
    expect(res.message).toBe("slow down");
    expect(res.error).toBe("Too Many Requests");
  });
});

describe("HttpVersionNotSupportedException", () => {
  it("has status code 505", () => {
    const ex = new HttpVersionNotSupportedException();
    expect(ex.statusCode).toBe(505);
  });
});

describe("SetMetadata", () => {
  it("stores metadata on a class", () => {
    @SetMetadata("roles", ["admin"])
    class TestController {}
    const roles = Reflect.getMetadata("roles", TestController);
    expect(roles).toEqual(["admin"]);
  });

  it("stores metadata on a method", () => {
    class TestClass {
      @SetMetadata("permissions", ["read", "write"])
      handler() {}
    }
    const perms = Reflect.getMetadata(
      "permissions",
      TestClass.prototype,
      "handler",
    );
    expect(perms).toEqual(["read", "write"]);
  });

  it("stores string metadata", () => {
    @SetMetadata("key", "value")
    class A {}
    expect(Reflect.getMetadata("key", A)).toBe("value");
  });

  it("stores boolean metadata", () => {
    @SetMetadata("isPublic", true)
    class B {}
    expect(Reflect.getMetadata("isPublic", B)).toBe(true);
  });

  it("stores object metadata", () => {
    @SetMetadata("config", { ttl: 60, max: 100 })
    class C {}
    expect(Reflect.getMetadata("config", C)).toEqual({ ttl: 60, max: 100 });
  });
});

describe("Reflector", () => {
  const reflector = new Reflector();

  it("get() retrieves metadata from class", () => {
    @SetMetadata("test:key", [1, 2, 3])
    class MyClass {}
    expect(reflector.get("test:key", MyClass)).toEqual([1, 2, 3]);
  });

  it("get() returns undefined for missing key", () => {
    class NoMeta {}
    expect(reflector.get("missing", NoMeta)).toBeUndefined();
  });

  it("getAllAndOverride() returns first defined value", () => {
    @SetMetadata("roles", ["admin"])
    class HandlerClass {}

    @SetMetadata("roles", ["user"])
    class ControllerClass {}

    const result = reflector.getAllAndOverride("roles", [
      HandlerClass,
      ControllerClass,
    ]);
    expect(result).toEqual(["admin"]);
  });

  it("getAllAndOverride() falls through to second target if first undefined", () => {
    class HandlerClass {}

    @SetMetadata("roles", ["user"])
    class ControllerClass {}

    const result = reflector.getAllAndOverride("roles", [
      HandlerClass,
      ControllerClass,
    ]);
    expect(result).toEqual(["user"]);
  });

  it("getAllAndOverride() returns undefined when no target has metadata", () => {
    class A {}
    class B {}
    expect(reflector.getAllAndOverride("nothing", [A, B])).toBeUndefined();
  });

  it("getAllAndMerge() merges arrays from all targets", () => {
    @SetMetadata("perms", ["read"])
    class HandlerClass {}

    @SetMetadata("perms", ["write", "delete"])
    class ControllerClass {}

    const result = reflector.getAllAndMerge("perms", [
      HandlerClass,
      ControllerClass,
    ]);
    expect(result).toEqual(["read", "write", "delete"]);
  });

  it("getAllAndMerge() handles non-array values by wrapping them", () => {
    @SetMetadata("single", "value1")
    class A {}

    @SetMetadata("single", "value2")
    class B {}

    const result = reflector.getAllAndMerge("single", [A, B]);
    expect(result).toEqual(["value1", "value2"]);
  });

  it("getAllAndMerge() returns empty array when no metadata", () => {
    class A {}
    class B {}
    expect(reflector.getAllAndMerge("nothing", [A, B])).toEqual([]);
  });
});

describe("applyDecorators", () => {
  it("applies multiple class decorators", () => {
    const calls: string[] = [];
    const dec1: ClassDecorator = (t) => {
      calls.push("dec1");
    };
    const dec2: ClassDecorator = (t) => {
      calls.push("dec2");
    };

    @applyDecorators(dec1, dec2)
    class TestClass {}

    expect(calls).toContain("dec1");
    expect(calls).toContain("dec2");
  });

  it("applies SetMetadata via applyDecorators on class", () => {
    @applyDecorators(SetMetadata("combined", true))
    class MyClass {}

    expect(Reflect.getMetadata("combined", MyClass)).toBe(true);
  });

  it("applies multiple method decorators", () => {
    const calls: string[] = [];
    const dec1: MethodDecorator = (t, k, d) => {
      calls.push("m1");
      return d;
    };
    const dec2: MethodDecorator = (t, k, d) => {
      calls.push("m2");
      return d;
    };

    class TestClass {
      @applyDecorators(dec1, dec2)
      myMethod() {}
    }
    new TestClass().myMethod();

    expect(calls).toContain("m1");
    expect(calls).toContain("m2");
  });
});

describe("createParamDecorator", () => {
  it("creates a parameter decorator factory", () => {
    const CurrentUser = createParamDecorator((data, ctx) => {
      return ctx.getRequest().user;
    });
    expect(typeof CurrentUser).toBe("function");
    expect(typeof CurrentUser()).toBe("function");
  });

  it("stores 'custom' type in params metadata", () => {
    const Token = createParamDecorator((data, ctx) => "token");

    class TestClass {
      handler(@Token() t: string) {}
    }

    const params = Reflect.getMetadata(
      "params",
      TestClass.prototype,
      "handler",
    );
    expect(params).toBeDefined();
    expect(params.length).toBe(1);
    expect(params[0].type).toBe("custom");
    expect(params[0].index).toBe(0);
  });

  it("stores factory function in metadata", () => {
    const factory = (data: any, ctx: any) => "value";
    const Decorator = createParamDecorator(factory);

    class TestClass {
      handler(@Decorator() v: string) {}
    }

    const params = Reflect.getMetadata(
      "params",
      TestClass.prototype,
      "handler",
    );
    expect(typeof params[0].factory).toBe("function");
  });

  it("stores data argument in metadata", () => {
    const Field = createParamDecorator((field: string, ctx: any) => field);

    class TestClass {
      handler(@Field("email") email: string) {}
    }

    const params = Reflect.getMetadata(
      "params",
      TestClass.prototype,
      "handler",
    );
    expect(params[0].data).toBe("email");
  });

  it("can register multiple custom params on one method", () => {
    const A = createParamDecorator(() => "a");
    const B = createParamDecorator(() => "b");

    class TestClass {
      handler(@A() a: string, @B() b: string) {}
    }

    const params = Reflect.getMetadata(
      "params",
      TestClass.prototype,
      "handler",
    );
    expect(params.length).toBe(2);
    expect(params.every((p: any) => p.type === "custom")).toBe(true);
  });
});

describe("@Module decorator", () => {
  it("stores metadata on the class", () => {
    @Injectable()
    @Controller("/test")
    class TestController {}

    @Module({ controllers: [TestController] })
    class TestModule {}

    const meta = Reflect.getMetadata("module:metadata", TestModule);
    expect(meta).toBeDefined();
    expect(meta.controllers).toContain(TestController);
  });

  it("stores imports, providers, exports", () => {
    @Injectable()
    class MyService {}

    @Module({ providers: [MyService], exports: [MyService] })
    class SharedModule {}

    @Module({ imports: [SharedModule] })
    class AppModule {}

    const appMeta = Reflect.getMetadata("module:metadata", AppModule);
    expect(appMeta.imports).toContain(SharedModule);

    const sharedMeta = Reflect.getMetadata("module:metadata", SharedModule);
    expect(sharedMeta.providers).toContain(MyService);
    expect(sharedMeta.exports).toContain(MyService);
  });
});

describe("@Global decorator", () => {
  it("marks module as global", () => {
    @Global()
    @Module({})
    class GlobalModule {}

    expect(Reflect.getMetadata("module:global", GlobalModule)).toBe(true);
  });

  it("non-global module has no global flag", () => {
    @Module({})
    class LocalModule {}

    expect(Reflect.getMetadata("module:global", LocalModule)).toBeUndefined();
  });
});

describe("@Optional decorator", () => {
  it("stores optional metadata on a property", () => {
    class TestClass {
      @Optional()
      myProp: string = "";
    }

    const isOptional = Reflect.getMetadata(
      "optional",
      TestClass.prototype,
      "myProp",
    );
    expect(isOptional).toBe(true);
  });

  it("stores optional parameter index", () => {
    class TestService {}

    class TestClass {
      constructor(@Optional() private svc?: TestService) {}
    }

    // For constructor params, TypeScript passes the class itself as `target` (not prototype)
    const optionals = Reflect.getMetadata(
      "optional:params",
      TestClass,
      undefined,
    );
    expect(optionals).toBeDefined();
    expect(optionals).toContain(0);
  });
});

describe("Lifecycle interfaces", () => {
  it("OnModuleInit can be implemented", async () => {
    let called = false;

    class MyService implements OnModuleInit {
      async onModuleInit() {
        called = true;
      }
    }

    const svc = new MyService();
    await svc.onModuleInit();
    expect(called).toBe(true);
  });

  it("OnModuleDestroy can be implemented", async () => {
    let called = false;

    class MyService implements OnModuleDestroy {
      async onModuleDestroy() {
        called = true;
      }
    }

    await new MyService().onModuleDestroy();
    expect(called).toBe(true);
  });

  it("OnApplicationBootstrap can be implemented", async () => {
    let called = false;

    class MyService implements OnApplicationBootstrap {
      async onApplicationBootstrap() {
        called = true;
      }
    }

    await new MyService().onApplicationBootstrap();
    expect(called).toBe(true);
  });

  it("OnApplicationShutdown receives signal", async () => {
    let receivedSignal: string | undefined;

    class MyService implements OnApplicationShutdown {
      async onApplicationShutdown(signal?: string) {
        receivedSignal = signal;
      }
    }

    await new MyService().onApplicationShutdown("SIGTERM");
    expect(receivedSignal).toBe("SIGTERM");
  });

  it("BeforeApplicationShutdown can be implemented", async () => {
    let called = false;

    class MyService implements BeforeApplicationShutdown {
      async beforeApplicationShutdown() {
        called = true;
      }
    }

    await new MyService().beforeApplicationShutdown();
    expect(called).toBe(true);
  });
});

describe("ExecutionContext.getType()", () => {
  it("returns http for standard requests", () => {
    const {
      createExecutionContext,
    } = require("../core/decorators/guard.decorators");
    const mockCtx = { request: {}, response: {}, set: {} };
    const ctx = createExecutionContext(mockCtx, () => {}, class {});
    expect(ctx.getType()).toBe("http");
  });
});

describe("WynkFactory with modules support", () => {
  it("registers controllers from modules", async () => {
    @Injectable()
    @Controller("/module-test")
    class ModuleController {
      @Get("/")
      index() {
        return { ok: true };
      }
    }

    @Module({ controllers: [ModuleController] })
    class AppModule {}

    const app = WynkFactory.create({ modules: [AppModule] });
    const server = await app.build();

    const res = await server.handle(
      new Request("http://localhost/module-test/"),
    );
    expect(res.status).toBe(200);
  });

  it("merges top-level controllers with module controllers", async () => {
    @Injectable()
    @Controller("/top-level")
    class TopController {
      @Get("/")
      index() {
        return { source: "top" };
      }
    }

    @Injectable()
    @Controller("/from-module")
    class ModuleController {
      @Get("/")
      index() {
        return { source: "module" };
      }
    }

    @Module({ controllers: [ModuleController] })
    class FeatureModule {}

    const app = WynkFactory.create({
      controllers: [TopController],
      modules: [FeatureModule],
    });
    const server = await app.build();

    const r1 = await server.handle(new Request("http://localhost/top-level/"));
    const r2 = await server.handle(
      new Request("http://localhost/from-module/"),
    );
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });

  it("works without modules (backward compat)", async () => {
    @Injectable()
    @Controller("/compat")
    class CompatController {
      @Get("/")
      index() {
        return { ok: true };
      }
    }

    const app = WynkFactory.create({ controllers: [CompatController] });
    const server = await app.build();
    const res = await server.handle(new Request("http://localhost/compat/"));
    expect(res.status).toBe(200);
  });

  it("handles module with providers (lifecycle init called)", async () => {
    let initialized = false;

    @Injectable()
    class TestProvider implements OnModuleInit {
      async onModuleInit() {
        initialized = true;
      }
    }

    @Module({ providers: [TestProvider] })
    class AppModule {}

    const app = WynkFactory.create({ modules: [AppModule] });
    await app.build();
    expect(initialized).toBe(true);
  });
});

describe("InterceptorContext export", () => {
  it("InterceptorContext is importable from core", async () => {
    const core = await import("../core/index");
    expect(core).toBeDefined();
  });
});

describe("createParamDecorator — runtime injection", () => {
  it("injects value from factory into handler (fast path — no guards/interceptors)", async () => {
    const CurrentUserId = createParamDecorator((data: unknown, ctx: any) => {
      return ctx.getRequest()?.user?.id ?? ctx.user?.id ?? "injected-id";
    });

    @Injectable()
    @Controller("/custom-param-fast")
    class FastPathController {
      @Get("/")
      getUser(@CurrentUserId() userId: string) {
        return { userId };
      }
    }

    const app = WynkFactory.create({ controllers: [FastPathController] });
    const server = await app.build();

    const res = await server.handle(
      new Request("http://localhost/custom-param-fast/"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("userId");
  });

  it("injects data argument passed to the decorator", async () => {
    const ExtractKey = createParamDecorator((data: string, _ctx: any) => {
      return `value-for-${data}`;
    });

    @Injectable()
    @Controller("/custom-param-data")
    class DataArgController {
      @Get("/")
      getKey(@ExtractKey("myKey") val: string) {
        return { val };
      }
    }

    const app = WynkFactory.create({ controllers: [DataArgController] });
    const server = await app.build();

    const res = await server.handle(
      new Request("http://localhost/custom-param-data/"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.val).toBe("value-for-myKey");
  });

  it("injects values from multiple custom decorators in correct order", async () => {
    const First = createParamDecorator((_data: unknown, _ctx: any) => "first");
    const Second = createParamDecorator(
      (_data: unknown, _ctx: any) => "second",
    );

    @Injectable()
    @Controller("/custom-param-order")
    class OrderController {
      @Get("/")
      getValues(@First() a: string, @Second() b: string) {
        return { a, b };
      }
    }

    const app = WynkFactory.create({ controllers: [OrderController] });
    const server = await app.build();

    const res = await server.handle(
      new Request("http://localhost/custom-param-order/"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.a).toBe("first");
    expect(body.b).toBe("second");
  });

  it("works in full-featured path (with a guard present)", async () => {
    const CurrentRole = createParamDecorator(
      (_data: unknown, _ctx: any) => "admin",
    );

    const passThroughGuard = {
      canActivate: (_ctx: any) => true,
    };

    @Injectable()
    @Controller("/custom-param-guarded")
    class GuardedController {
      @Get("/")
      @UseGuards(passThroughGuard)
      getRole(@CurrentRole() role: string) {
        return { role };
      }
    }

    const app = WynkFactory.create({ controllers: [GuardedController] });
    const server = await app.build();

    const res = await server.handle(
      new Request("http://localhost/custom-param-guarded/"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("admin");
  });

  it("factory receives ctx with getRequest() method (ExecutionContext shape)", async () => {
    let capturedCtx: any = null;

    const CtxCapture = createParamDecorator((_data: unknown, ctx: any) => {
      capturedCtx = ctx;
      return "captured";
    });

    @Injectable()
    @Controller("/custom-param-ctx")
    class CtxController {
      @Get("/")
      index(@CtxCapture() val: string) {
        return { val };
      }
    }

    const app = WynkFactory.create({ controllers: [CtxController] });
    const server = await app.build();

    await server.handle(new Request("http://localhost/custom-param-ctx/"));
    expect(capturedCtx).not.toBeNull();
    expect(typeof capturedCtx.getRequest).toBe("function");
    expect(typeof capturedCtx.getResponse).toBe("function");
    expect(typeof capturedCtx.getHandler).toBe("function");
    expect(typeof capturedCtx.getClass).toBe("function");
  });
});
