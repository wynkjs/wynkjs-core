/**
 * E2E Test Setup Utilities
 * Provides utilities for starting/stopping the WynkJS app for E2E testing
 */

import { WynkFactory, DetailedErrorFormatter } from "wynkjs";
import { UserController } from "../../src/modules/user/user.controller";
import { EmailService } from "../../src/modules/email/email.service";
import { CustomExceptionFilter } from "../../src/filter/custom.filter";

export interface TestApp {
  baseUrl: string;
  app: any;
  stop: () => Promise<void>;
}

let currentApp: any = null;
let currentServer: any = null;

/**
 * Start the WynkJS application on a specific port for E2E testing
 * @param controllersOrPort - Either an array of controllers or a port number
 * @param portParam - Port number (only used if first param is controllers array)
 */
export async function startTestApp(
  controllersOrPort: any[] | number = 3001,
  portParam?: number
): Promise<TestApp> {
  // Stop existing app if running
  if (currentServer) {
    await stopTestApp();
  }

  // Parse parameters
  let controllers: any[];
  let port: number;

  if (Array.isArray(controllersOrPort)) {
    controllers = controllersOrPort;
    port = portParam || 3001;
  } else {
    // Backward compatibility: if number passed, use default controllers
    controllers = [UserController];
    port = controllersOrPort;
  }

  // Create app instance
  const app = WynkFactory.create({
    controllers,
    cors: true,
    logger: false, // Disable logging during tests
    validationErrorFormatter: new DetailedErrorFormatter(),
  });

  // Register filters
  app.useGlobalFilters(new CustomExceptionFilter());

  // Build and get the Elysia instance
  await (app as any).build();
  const elysiaApp = (app as any).getApp();

  // Start server and store the server instance
  currentServer = elysiaApp.listen(port);
  currentApp = app;

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    baseUrl: `http://localhost:${port}`,
    app: elysiaApp,
    stop: async () => {
      if (currentServer) {
        currentServer.stop();
        currentServer = null;
        currentApp = null;
      }
    },
  };
}

/**
 * Stop the currently running test app
 */
export async function stopTestApp(): Promise<void> {
  if (currentServer) {
    currentServer.stop();
    currentServer = null;
    currentApp = null;
  }
}

/**
 * Make HTTP request helper
 */
export async function request(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, options);
}

/**
 * Parse JSON response
 */
export async function parseJson<T = any>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert response status
 */
export function expectStatus(response: Response, status: number): void {
  if (response.status !== status) {
    throw new Error(
      `Expected status ${status} but got ${response.status}: ${response.statusText}`
    );
  }
}

/**
 * Create a test user object
 */
export function createTestUser(overrides: Partial<any> = {}) {
  return {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    age: 25,
    ...overrides,
  };
}
