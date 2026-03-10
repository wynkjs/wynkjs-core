import "reflect-metadata";

/**
 * Marks a constructor parameter or class property as optional.
 * When the dependency cannot be resolved, `undefined` is injected instead of
 * throwing an error.
 *
 * @example
 * @Injectable()
 * class MyService {
 *   constructor(@Optional() private logger?: LoggerService) {}
 * }
 */
export function Optional(): PropertyDecorator & ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ) => {
    if (typeof parameterIndex === "number") {
      const existingOptionals: number[] =
        Reflect.getMetadata("optional:params", target, propertyKey as any) || [];
      existingOptionals.push(parameterIndex);
      Reflect.defineMetadata("optional:params", existingOptionals, target, propertyKey as any);
    } else if (propertyKey !== undefined) {
      Reflect.defineMetadata("optional", true, target, propertyKey);
    }
  };
}
