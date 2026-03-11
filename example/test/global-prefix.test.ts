import { describe, test, expect, beforeAll } from "bun:test";
import { WynkFactory } from "wynkjs";
import { swagger } from "@elysiajs/swagger";
import { UserModule } from "../src/modules/user/user.module";

describe("Global Prefix", () => {
  let server: any;

  beforeAll(async () => {
    const app = WynkFactory.create({
      modules: [UserModule],
      globalPrefix: "/api",
      cors: true,
    });
    server = await app.build();
  });

  test("prefixed routes respond 200", async () => {
    const res = await server.handle(new Request("http://localhost/api/users/"));
    expect(res.status).toBe(200);
  });

  test("unprefixed routes respond 404", async () => {
    const res = await server.handle(new Request("http://localhost/users/"));
    expect(res.status).toBe(404);
  });

  test("prefixed GET /:id route responds 200 for existing user", async () => {
    const res = await server.handle(
      new Request("http://localhost/api/users/user-1"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe("user-1");
  });

  test("prefixed GET /:id route responds 404 for missing user", async () => {
    const res = await server.handle(
      new Request("http://localhost/api/users/no-such-id"),
    );
    expect(res.status).toBe(404);
  });

  test("prefixed POST route creates user and responds 201", async () => {
    const res = await server.handle(
      new Request("http://localhost/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Prefix Tester",
          email: `prefix-test-${Date.now()}@example.com`,
          age: 22,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message).toBe("User created");
  });
});

describe("Global Prefix — no prefix app", () => {
  let server: any;

  beforeAll(async () => {
    const app = WynkFactory.create({
      modules: [UserModule],
    });
    server = await app.build();
  });

  test("routes work without prefix", async () => {
    const res = await server.handle(new Request("http://localhost/users/"));
    expect(res.status).toBe(200);
  });

  test("/api/users/ returns 404 when no prefix configured", async () => {
    const res = await server.handle(new Request("http://localhost/api/users/"));
    expect(res.status).toBe(404);
  });
});

describe("Swagger Integration", () => {
  let server: any;

  beforeAll(async () => {
    const app = WynkFactory.create({
      modules: [UserModule],
      globalPrefix: "/api",
    });
    const built = await app.build();
    built.use(
      swagger({
        documentation: {
          info: { title: "WynkJS Test API", version: "1.0.0" },
        },
        path: "/docs",
      }),
    );
    server = built;
  });

  test("GET /docs returns 200 (Swagger UI)", async () => {
    const res = await server.handle(new Request("http://localhost/docs"));
    expect(res.status).toBe(200);
    const ct = res.headers.get("content-type") ?? "";
    expect(ct).toContain("text/html");
  });

  test("GET /docs/json returns 200 (OpenAPI JSON)", async () => {
    const res = await server.handle(new Request("http://localhost/docs/json"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.openapi).toBeDefined();
    expect(data.info.title).toBe("WynkJS Test API");
  });

  test("Swagger JSON lists prefixed paths", async () => {
    const res = await server.handle(new Request("http://localhost/docs/json"));
    const data = await res.json();
    const paths: string[] = Object.keys(data.paths ?? {});
    const prefixedPaths = paths.filter((p) => p.startsWith("/api/"));
    expect(prefixedPaths.length).toBeGreaterThan(0);
  });

  test("API routes still work alongside swagger", async () => {
    const res = await server.handle(new Request("http://localhost/api/users/"));
    expect(res.status).toBe(200);
  });
});
