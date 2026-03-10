/**
 * Implement to run logic after the host module has been fully initialized.
 * Called once on startup, before any requests are handled.
 *
 * @example
 * @Injectable()
 * export class DatabaseService implements OnModuleInit {
 *   async onModuleInit() {
 *     await this.connect();
 *   }
 * }
 */
export interface OnModuleInit {
  onModuleInit(): any | Promise<any>;
}

/**
 * Implement to run cleanup logic when the host module is being destroyed
 * (e.g. on graceful shutdown).
 *
 * @example
 * @Injectable()
 * export class DatabaseService implements OnModuleDestroy {
 *   async onModuleDestroy() {
 *     await this.disconnect();
 *   }
 * }
 */
export interface OnModuleDestroy {
  onModuleDestroy(): any | Promise<any>;
}

/**
 * Implement to run logic after all modules are initialized but before the
 * application starts accepting connections.
 */
export interface OnApplicationBootstrap {
  onApplicationBootstrap(): any | Promise<any>;
}

/**
 * Implement to run async cleanup when the application receives a shutdown signal.
 *
 * @param signal - The OS signal that triggered shutdown (e.g. `'SIGTERM'`).
 */
export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): any | Promise<any>;
}

/**
 * Implement to run synchronous cleanup before `onApplicationShutdown` hooks fire.
 *
 * @param signal - The OS signal that triggered shutdown (e.g. `'SIGTERM'`).
 */
export interface BeforeApplicationShutdown {
  beforeApplicationShutdown(signal?: string): any | Promise<any>;
}
