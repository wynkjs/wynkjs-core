import "reflect-metadata";
import type { ExecutionContext } from "./guard.decorators";
import { ParamMetadata } from "./param.decorators";

/**
 * Attaches custom metadata to a class or method using the reflect-metadata API.
 * Retrieve the value at runtime via the `Reflector` class.
 *
 * @param metadataKey - The key under which the value is stored
 * @param metadataValue - The value to store
 * @returns A decorator applicable to both classes and methods
 *
 * @example
 * // Define a helper decorator
 * export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
 *
 * // Use in controller
 * @Roles('admin', 'editor')
 * @Get('/secret')
 * getSecret() {}
 */
export function SetMetadata<K = string, V = any>(
  metadataKey: K,
  metadataValue: V
): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey !== undefined && descriptor !== undefined) {
      Reflect.defineMetadata(metadataKey as any, metadataValue, target, propertyKey);
      return descriptor;
    }
    Reflect.defineMetadata(metadataKey as any, metadataValue, target);
    return target;
  };
}

/**
 * Reads metadata stored by `SetMetadata` across one or multiple targets.
 *
 * @example
 * const reflector = new Reflector();
 *
 * // In a guard:
 * const roles = reflector.getAllAndOverride<string[]>('roles', [
 *   context.getHandler(),
 *   context.getClass(),
 * ]);
 */
export class Reflector {
  get<TResult = any>(metadataKey: string, target: Function | object): TResult | undefined {
    return Reflect.getMetadata(metadataKey, target);
  }

  getAllAndOverride<TResult = any>(
    metadataKey: string,
    targets: (Function | object)[]
  ): TResult | undefined {
    for (const target of targets) {
      const value = Reflect.getMetadata(metadataKey, target);
      if (value !== undefined) return value as TResult;
    }
    return undefined;
  }

  getAllAndMerge<TResult = any>(
    metadataKey: string,
    targets: (Function | object)[]
  ): TResult[] {
    const result: TResult[] = [];
    for (const target of targets) {
      const value = Reflect.getMetadata(metadataKey, target);
      if (value !== undefined) {
        if (Array.isArray(value)) result.push(...value);
        else result.push(value as TResult);
      }
    }
    return result;
  }
}

/**
 * Composes multiple decorators into one, applying them left-to-right.
 *
 * @param decorators - One or more class/method/property decorators
 * @returns A single decorator that applies all provided decorators
 *
 * @example
 * export const Auth = (...roles: string[]) => applyDecorators(
 *   SetMetadata('roles', roles),
 *   UseGuards(AuthGuard, RolesGuard),
 * );
 *
 * @Get('/admin')
 * @Auth('admin')
 * adminOnly() {}
 */
export function applyDecorators(
  ...decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[]
): (target: any, key?: any, descriptor?: any) => any {
  return (target: any, key?: any, descriptor?: any) => {
    for (const decorator of decorators) {
      if (key !== undefined && descriptor !== undefined) {
        (decorator as MethodDecorator)(target, key, descriptor);
      } else {
        (decorator as ClassDecorator)(target);
      }
    }
    return descriptor ?? target;
  };
}

/**
 * Creates a custom parameter decorator that calls `factory` to produce the
 * injected value at request time.
 *
 * @param factory - Called with `(data, ctx)` where `data` is the argument passed
 *   to the decorator and `ctx` is the current `ExecutionContext`.
 * @returns A decorator factory: `(data?) => ParameterDecorator`
 *
 * @example
 * const CurrentUser = createParamDecorator((data, ctx: ExecutionContext) => {
 *   return ctx.getRequest().user;
 * });
 *
 * @Get('/profile')
 * getProfile(@CurrentUser() user: User) {}
 */
export function createParamDecorator<TData = unknown>(
  factory: (data: TData, ctx: ExecutionContext) => any
): (data?: TData) => ParameterDecorator {
  return (data?: TData): ParameterDecorator => {
    return (
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number
    ) => {
      if (!propertyKey) return;
      const existingParams: ParamMetadata[] =
        Reflect.getMetadata("params", target, propertyKey) || [];
      existingParams.push({
        index: parameterIndex,
        type: "custom",
        data: data as any,
        factory: (d: any, ctx: any) => factory(d as TData, ctx),
      });
      Reflect.defineMetadata("params", existingParams, target, propertyKey);
    };
  };
}
