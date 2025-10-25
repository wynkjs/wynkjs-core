/**
 * WynkJS Testing Module
 * Provides utilities for testing WynkJS applications
 * Similar to @nestjs/testing
 */

import { container } from "tsyringe";
import type { DependencyContainer } from "tsyringe";

/**
 * Test class for creating isolated testing modules
 */
export class Test {
  /**
   * Create a testing module with providers
   * @param options Testing module options
   * @returns TestingModule instance
   */
  static createTestingModule(options: TestingModuleOptions): TestingModule {
    return new TestingModule(options);
  }
}

/**
 * Options for creating a testing module
 */
export interface TestingModuleOptions {
  /**
   * Array of providers (services, classes) to register in the testing container
   */
  providers?: any[];

  /**
   * Array of controllers to register in the testing container
   */
  controllers?: any[];
}

/**
 * Testing module that provides isolated dependency injection container
 */
export class TestingModule {
  private testContainer: DependencyContainer;
  private providers: any[];
  private controllers: any[];

  constructor(options: TestingModuleOptions) {
    // Create a child container for isolation
    this.testContainer = container.createChildContainer();
    this.providers = options.providers || [];
    this.controllers = options.controllers || [];
  }

  /**
   * Compile the testing module (register all providers and controllers)
   */
  async compile(): Promise<TestingModule> {
    // Register all providers
    for (const provider of this.providers) {
      this.testContainer.register(provider, { useClass: provider });
    }

    // Register all controllers
    for (const controller of this.controllers) {
      this.testContainer.register(controller, { useClass: controller });
    }

    return this;
  }

  /**
   * Get an instance of a provider from the testing container
   * @param type The class/token to resolve
   * @returns Instance of the requested type
   */
  get<T>(type: any): T {
    return this.testContainer.resolve<T>(type);
  }

  /**
   * Close the testing module and clean up
   */
  async close(): Promise<void> {
    // Reset the test container
    this.testContainer.reset();
  }
}

/**
 * Mock factory for creating mock instances
 */
export class MockFactory {
  /**
   * Create a mock object with methods
   * @param methods Object with method names and return values
   * @returns Mock object
   */
  static createMock<T = any>(methods: Record<string, any> = {}): T {
    const mock: any = {};

    for (const [key, value] of Object.entries(methods)) {
      if (typeof value === "function") {
        mock[key] = value;
      } else {
        mock[key] = () => value;
      }
    }

    return mock as T;
  }

  /**
   * Create a spy function that tracks calls
   * @param implementation Optional implementation
   * @returns Spy function
   */
  static createSpy(implementation?: (...args: any[]) => any): any {
    const calls: any[][] = [];
    const spy: any = (...args: any[]) => {
      calls.push(args);
      return implementation ? implementation(...args) : undefined;
    };

    spy.calls = calls;
    spy.mock = {
      calls,
      results: calls.map((args) =>
        implementation ? implementation(...args) : undefined
      ),
    };

    return spy;
  }
}

/**
 * Export everything for convenient imports
 */
export * from "./test-utils";
