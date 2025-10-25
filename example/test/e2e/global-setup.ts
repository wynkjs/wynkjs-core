/**
 * Global E2E Test Setup
 * Shared setup for all E2E tests
 */

import { beforeAll, afterAll } from "bun:test";
import { startTestApp, stopTestApp, type TestApp } from "./setup";

export let app: TestApp;

// Start server once before all tests
beforeAll(async () => {
  app = await startTestApp(3001);
});

// Stop server after all tests complete
afterAll(async () => {
  await stopTestApp();
});
