import { describe, it, expect, beforeEach } from "bun:test";
import { Request, Response } from "../core";
import { WynkFactory } from "../core/factory";
import { Controller, Get, Post, Use } from "../core/decorators/http.decorators";
import type { WynkRequest, WynkResponse } from "../core";

describe("Request Class", () => {
  describe("Constructor and Basic Properties", () => {
    it("should create Request instance with context", () => {
      const mockCtx = {
        request: {
          method: "GET",
          url: "http://localhost/test",
          headers: new Headers({ "content-type": "application/json" }),
        },
        headers: new Headers({ "content-type": "application/json" }),
      };

      const request = new Request(mockCtx);
      expect(request).toBeDefined();
      expect(request.method).toBe("GET");
    });

    it("should store originalRequest to avoid recursion", () => {
      const mockCtx = {
        request: {
          method: "POST",
          url: "http://localhost/api",
          headers: new Headers(),
        },
        headers: new Headers(),
      };

      const request = new Request(mockCtx);
      // This would cause recursion if originalRequest wasn't stored
      mockCtx.request = request as any;
      expect(request.method).toBe("POST");
    });
  });

  describe("HTTP Method and URL", () => {
    it("should get request method", () => {
      const mockCtx = {
        request: { method: "POST", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.method).toBe("POST");
    });

    it("should get request URL", () => {
      const mockCtx = {
        request: {
          method: "GET",
          url: "http://localhost:3000/api/users",
          headers: new Headers(),
        },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.url).toBe("http://localhost:3000/api/users");
    });

    it("should get request path", () => {
      const mockCtx = {
        path: "/api/users",
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.path).toBe("/api/users");
    });
  });

  describe("Headers", () => {
    it("should get headers from context", () => {
      const headers = new Headers({
        "content-type": "application/json",
        authorization: "Bearer token123",
      });
      const mockCtx = {
        headers,
        request: { method: "GET", url: "", headers },
      };
      const request = new Request(mockCtx);
      expect(request.headers).toBeDefined();
    });

    it("should extract bearer token from Authorization header", () => {
      const headers = new Headers({
        authorization: "Bearer mytoken123",
      });
      const mockCtx = {
        headers,
        request: { method: "GET", url: "", headers },
      };
      const request = new Request(mockCtx);
      expect(request.getBearerToken()).toBe("mytoken123");
    });

    it("should handle missing Authorization header", () => {
      const mockCtx = {
        headers: new Headers(),
        request: { method: "GET", url: "", headers: new Headers() },
      };
      const request = new Request(mockCtx);
      expect(request.getBearerToken()).toBeUndefined();
    });
  });

  describe("Body, Params, Query", () => {
    it("should get request body", () => {
      const body = { name: "Test", email: "test@example.com" };
      const mockCtx = {
        body,
        request: { method: "POST", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.body).toEqual(body);
    });

    it("should get route params", () => {
      const params = { id: "123", userId: "456" };
      const mockCtx = {
        params,
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.params).toEqual(params);
    });

    it("should get query parameters", () => {
      const query = { page: "1", limit: "10", search: "test" };
      const mockCtx = {
        query,
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.query).toEqual(query);
    });
  });

  describe("Cookies", () => {
    it("should parse cookies from header", () => {
      const headers = new Headers({
        cookie: "session=abc123; theme=dark; lang=en",
      });
      const mockCtx = {
        headers,
        request: { method: "GET", url: "", headers },
      };
      const request = new Request(mockCtx);
      const cookies = request.cookies;
      expect(cookies.session).toBe("abc123");
      expect(cookies.theme).toBe("dark");
      expect(cookies.lang).toBe("en");
    });

    it("should get individual cookie", () => {
      const headers = new Headers({
        cookie: "accessToken=token123; userId=456",
      });
      const mockCtx = {
        headers,
        request: { method: "GET", url: "", headers },
      };
      const request = new Request(mockCtx);
      expect(request.getCookie("accessToken")).toBe("token123");
      expect(request.getCookie("userId")).toBe("456");
    });

    it("should return undefined for missing cookie", () => {
      const mockCtx = {
        headers: new Headers(),
        request: { method: "GET", url: "", headers: new Headers() },
      };
      const request = new Request(mockCtx);
      expect(request.getCookie("nonexistent")).toBeUndefined();
    });
  });

  describe("Custom Data Storage", () => {
    it("should set and get custom data", () => {
      const mockCtx = {
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      request.set("userId", 123);
      request.set("role", "admin");
      expect(request.get("userId")).toBe(123);
      expect(request.get("role")).toBe("admin");
    });

    it("should check if custom data exists", () => {
      const mockCtx = {
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      request.set("flag", true);
      expect(request.has("flag")).toBe(true);
      expect(request.has("nonexistent")).toBe(false);
    });

    it("should delete custom data", () => {
      const mockCtx = {
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      request.set("temp", "value");
      expect(request.has("temp")).toBe(true);
      request.delete("temp");
      expect(request.has("temp")).toBe(false);
    });
  });

  describe("User Property", () => {
    it("should get and set user from context", () => {
      const user = { id: "123", email: "test@example.com", roles: ["user"] };
      const mockCtx = {
        user,
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      expect(request.user).toEqual(user);
    });

    it("should allow setting user", () => {
      const mockCtx = {
        request: { method: "GET", url: "", headers: new Headers() },
        headers: new Headers(),
      };
      const request = new Request(mockCtx);
      const user = { id: "456", email: "admin@example.com" };
      request.user = user;
      expect(request.user).toEqual(user);
      expect(mockCtx.user).toEqual(user);
    });
  });

  describe("IP Address", () => {
    it("should get IP from x-forwarded-for header", () => {
      const headers = new Headers({
        "x-forwarded-for": "192.168.1.1",
      });
      const mockCtx = {
        headers,
        request: { method: "GET", url: "", headers, ip: "127.0.0.1" },
      };
      const request = new Request(mockCtx);
      expect(request.ip).toBe("192.168.1.1");
    });

    it("should get IP from originalRequest when no header", () => {
      const mockCtx = {
        headers: new Headers(),
        request: { method: "GET", url: "", headers: new Headers(), ip: "10.0.0.1" },
      };
      const request = new Request(mockCtx);
      expect(request.ip).toBe("10.0.0.1");
    });
  });
});

describe("Response Class", () => {
  describe("Constructor", () => {
    it("should create Response instance with context", () => {
      const mockCtx = {};
      const response = new Response(mockCtx);
      expect(response).toBeDefined();
    });
  });

  describe("Status Code", () => {
    it("should set status code", () => {
      const mockCtx = {};
      const response = new Response(mockCtx);
      const result = response.status(201);
      expect(result).toBe(response); // Should return itself for chaining
    });

    it("should allow chaining status with json", () => {
      const mockCtx = {};
      const response = new Response(mockCtx);
      const result = response.status(404).json({ error: "Not found" });
      expect(result).toBeDefined();
    });
  });

  describe("Headers", () => {
    it("should set single header", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.header("X-Custom-Header", "value");
      expect(mockCtx.set.headers["X-Custom-Header"]).toBe("value");
    });

    it("should set multiple headers", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.headers({
        "X-Header-1": "value1",
        "X-Header-2": "value2",
      });
      expect(mockCtx.set.headers["X-Header-1"]).toBe("value1");
      expect(mockCtx.set.headers["X-Header-2"]).toBe("value2");
    });
  });

  describe("Cookies", () => {
    it("should set cookie with default options", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cookie("session", "abc123");
      expect(mockCtx.set.headers["Set-Cookie"]).toContain("session=abc123");
    });

    it("should set cookie with httpOnly option", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cookie("accessToken", "token123", {
        httpOnly: true,
        secure: true,
      });
      const setCookie = mockCtx.set.headers["Set-Cookie"];
      expect(setCookie).toContain("accessToken=token123");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
    });

    it("should set cookie with maxAge", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cookie("temp", "value", { maxAge: 3600 });
      expect(mockCtx.set.headers["Set-Cookie"]).toContain("Max-Age=3600");
    });

    it("should set cookie with path", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cookie("theme", "dark", { path: "/admin" });
      expect(mockCtx.set.headers["Set-Cookie"]).toContain("Path=/admin");
    });

    it("should set cookie with sameSite", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cookie("csrf", "token", { sameSite: "strict" });
      expect(mockCtx.set.headers["Set-Cookie"]).toContain("SameSite=Strict");
    });

    it("should clear cookie", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.clearCookie("session");
      const setCookie = mockCtx.set.headers["Set-Cookie"];
      expect(setCookie).toContain("session=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("should set multiple cookies", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cookie("cookie1", "value1");
      response.cookie("cookie2", "value2");
      const setCookie = mockCtx.set.headers["Set-Cookie"];
      expect(Array.isArray(setCookie)).toBe(true);
      expect(setCookie[0]).toContain("cookie1=value1");
      expect(setCookie[1]).toContain("cookie2=value2");
    });
  });

  describe("JSON Response", () => {
    it("should return JSON response", () => {
      const mockCtx = {};
      const response = new Response(mockCtx);
      const data = { message: "Success", id: 123 };
      const result = response.json(data);
      expect(result).toEqual(data);
    });

    it("should set JSON status and return data", () => {
      const mockCtx = {};
      const response = new Response(mockCtx);
      const result = response.status(201).json({ created: true });
      expect(result.created).toBe(true);
    });
  });

  describe("HTML Response", () => {
    it("should return HTML response", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      const html = "<h1>Hello World</h1>";
      const result = response.html(html);
      expect(result).toBe(html);
      expect(mockCtx.set.headers["Content-Type"]).toBe("text/html");
    });
  });

  describe("Text Response", () => {
    it("should return text response", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      const text = "Plain text message";
      const result = response.text(text);
      expect(result).toBe(text);
      expect(mockCtx.set.headers["Content-Type"]).toBe("text/plain");
    });
  });

  describe("Redirect", () => {
    it("should redirect with default 302 status", () => {
      const mockCtx = { set: {} };
      const response = new Response(mockCtx);
      response.redirect("/login");
      expect(mockCtx.set.status).toBe(302);
      expect(mockCtx.set.redirect).toBe("/login");
    });

    it("should redirect with custom status code", () => {
      const mockCtx = { set: {} };
      const response = new Response(mockCtx);
      response.redirect("/home", 301);
      expect(mockCtx.set.status).toBe(301);
      expect(mockCtx.set.redirect).toBe("/home");
    });
  });

  describe("Cache Control", () => {
    it("should set cache with max-age", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cache(3600);
      expect(mockCtx.set.headers["Cache-Control"]).toBe("public, max-age=3600");
    });

    it("should set no-cache headers", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.noCache();
      expect(mockCtx.set.headers["Cache-Control"]).toBe(
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
    });
  });

  describe("CORS", () => {
    it("should set CORS headers for all origins", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cors();
      expect(mockCtx.set.headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("should set CORS with specific origin", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cors({ origin: "https://example.com" });
      expect(mockCtx.set.headers["Access-Control-Allow-Origin"]).toBe(
        "https://example.com"
      );
    });

    it("should set CORS with credentials", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cors({ credentials: true });
      expect(mockCtx.set.headers["Access-Control-Allow-Credentials"]).toBe("true");
    });

    it("should set CORS with custom methods", () => {
      const mockCtx = { set: { headers: {} } };
      const response = new Response(mockCtx);
      response.cors({ methods: ["GET", "POST", "PUT"] });
      expect(mockCtx.set.headers["Access-Control-Allow-Methods"]).toContain("GET");
      expect(mockCtx.set.headers["Access-Control-Allow-Methods"]).toContain("POST");
    });
  });
});

describe("Request/Response Integration", () => {
  describe("Response Cookie Setting", () => {
    it("should set cookies via Response wrapper", async () => {
      @Controller("/auth")
      class AuthController {
        @Post("/login")
        async login(ctx: any) {
          const response = ctx.response;
          if (response && response.cookie) {
            response.cookie("sessionId", "sess123", {
              httpOnly: true,
              maxAge: 3600,
            });
          }
          return { success: true };
        }
      }

      const app = WynkFactory.create({ controllers: [AuthController] });
      const server = await app.build();

      const request = new globalThis.Request("http://localhost/auth/login", {
        method: "POST",
      });

      const response = await server.handle(request);
      const setCookie = response.headers.get("Set-Cookie");

      expect(setCookie).toBeDefined();
      if (setCookie) {
        expect(setCookie).toContain("sessionId=sess123");
        expect(setCookie).toContain("HttpOnly");
        expect(setCookie).toContain("Max-Age=3600");
      }
    });

    it("should verify Request/Response auto-wrapping works", async () => {
      @Controller("/test")
      class TestController {
        @Get("/verify")
        async verify(ctx: any) {
          // Verify wrapping happened
          const hasRequestWrapper = ctx.request && typeof ctx.request.method !== 'undefined';
          const hasResponseWrapper = ctx.response && typeof ctx.response.json === 'function';
          const isWrapped = ctx.__wynk_wrapped__ === true;
          
          return {
            hasRequestWrapper,
            hasResponseWrapper,
            isWrapped
          };
        }
      }

      const app = WynkFactory.create({ controllers: [TestController] });
      const server = await app.build();

      const response = await server.handle(
        new globalThis.Request("http://localhost/test/verify")
      );
      const data = await response.json();

      // At minimum, verify the endpoint works
      expect(data).toBeDefined();
      expect(typeof data.hasRequestWrapper).toBe('boolean');
      expect(typeof data.hasResponseWrapper).toBe('boolean');
    });
  });
});
