import "reflect-metadata";

/**
 * Guard Decorators and Interfaces for WynkJS Framework
 * Guards for route protection and authorization
 */

/**
 * Execution context interface - provides access to request details
 */
export interface ExecutionContext {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getContext<T = any>(): T;
  getHandler(): Function;
  getClass(): any;
}

/**
 * CanActivate interface - All guards must implement this
 */
export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

/**
 * @UseGuards decorator - Apply guards to routes or controllers
 * @param guards Guard classes to apply
 * @example
 * @Controller('/admin')
 * @UseGuards(AuthGuard, RolesGuard)
 * export class AdminController {}
 *
 * @Get('/profile')
 * @UseGuards(AuthGuard)
 * getProfile() {}
 */
export function UseGuards(
  ...guards: (Function | CanActivate)[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey && descriptor) {
      // Method decorator
      const existingGuards =
        Reflect.getMetadata("guards", target, propertyKey) || [];
      Reflect.defineMetadata(
        "guards",
        [...existingGuards, ...guards],
        target,
        propertyKey
      );
      return descriptor;
    } else {
      // Class decorator
      const existingGuards = Reflect.getMetadata("guards", target) || [];
      Reflect.defineMetadata("guards", [...existingGuards, ...guards], target);
      return target;
    }
  };
}

/**
 * Helper function to create execution context
 */
export function createExecutionContext(
  ctx: any,
  handler: Function,
  controllerClass: any
): ExecutionContext {
  return {
    getRequest: () => ctx.request || ctx,
    getResponse: () => ctx.response || ctx.set,
    getContext: () => ctx,
    getHandler: () => handler,
    getClass: () => controllerClass,
  };
}

/**
 * Guard instance cache for singleton pattern
 */
const guardInstanceCache = new Map<Function, CanActivate>();

/**
 * Helper function to execute guards
 */
export async function executeGuards(
  guards: (Function | CanActivate)[],
  context: ExecutionContext
): Promise<boolean> {
  for (const guard of guards) {
    let result: boolean;

    if (typeof guard === "function") {
      // Guard is a class, get or create singleton instance
      let guardInstance = guardInstanceCache.get(guard);
      if (!guardInstance) {
        guardInstance = new (guard as any)() as CanActivate;
        guardInstanceCache.set(guard, guardInstance);
      }

      if (!guardInstance.canActivate) {
        throw new Error(
          `Guard ${guard.name} must implement CanActivate interface`
        );
      }

      result = await guardInstance.canActivate(context);
    } else {
      // Guard is already an instance
      result = await guard.canActivate(context);
    }

    if (!result) {
      return false;
    }
  }

  return true;
}
