import "reflect-metadata";

/**
 * Metadata describing the contents of a `@Module()`.
 *
 * @example
 * @Module({
 *   controllers: [UserController],
 *   providers: [UserService],
 *   exports: [UserService],
 * })
 * export class UserModule {}
 */
export interface ModuleMetadata {
  /** Other `@Module()` classes whose exported providers become available here. */
  imports?: any[];
  /** Controllers to register with this module. */
  controllers?: any[];
  /** Injectable services/providers belonging to this module. */
  providers?: any[];
  /** Providers to re-export to importing modules. */
  exports?: any[];
}

/**
 * Returned by `forRoot()` / `forFeature()` factory methods on dynamic modules.
 */
export interface DynamicModule extends ModuleMetadata {
  /** The host module class. */
  module: any;
}

/**
 * Declares a class as a WynkJS module, grouping controllers and providers.
 * Pass the module to `WynkFactory.create({ modules: [AppModule] })`.
 *
 * @param metadata - The module metadata
 *
 * @example
 * @Module({
 *   controllers: [UserController],
 *   providers: [UserService],
 * })
 * export class AppModule {}
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata("module:metadata", metadata, target);
    return target;
  };
}

/**
 * Marks a module as global so its exports are available everywhere without
 * explicitly importing the module.
 *
 * @example
 * @Global()
 * @Module({ providers: [ConfigService], exports: [ConfigService] })
 * export class ConfigModule {}
 */
export function Global(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata("module:global", true, target);
    return target;
  };
}
