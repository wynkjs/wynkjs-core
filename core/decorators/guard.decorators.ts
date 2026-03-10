import "reflect-metadata";

/**
 * Guard Decorators and Interfaces for WynkJS Framework
 * Guards for route protection and authorization
 */

/**
 * Execution context interface — provides typed access to the current request cycle.
 * Passed to guards, interceptors, and exception filters.
 */
export interface ExecutionContext {
  /** Returns the underlying request object (typed as `T`). */
  getRequest<T = any>(): T;
  /** Returns the underlying response/set object (typed as `T`). */
  getResponse<T = any>(): T;
  /** Returns the full Elysia context object (typed as `T`). */
  getContext<T = any>(): T;
  /** Returns the route handler function currently being invoked. */
  getHandler(): Function;
  /** Returns the controller class that owns the current route handler. */
  getClass(): any;
  /**
   * Returns the transport type of the current request.
   * WynkJS currently always returns `'http'`.
   */
  getType(): 'http' | 'ws' | 'rpc';
}

/**
 * Interface that all guards must implement.
 *
 * @example
 * @Injectable()
 * export class AuthGuard implements CanActivate {
 *   canActivate(context: ExecutionContext): boolean {
 *     const req = context.getRequest<Request>();
 *     return req.headers.get('authorization') !== null;
 *   }
 * }
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
 * Create an ExecutionContext for the current request cycle.
 *
 * Provides accessors for the underlying request, response/set, full runtime context,
 * the active route handler, the controller class, and the transport type.
 *
 * @param ctx - The runtime framework context (e.g., Koa/Express context) from which request/response are derived
 * @param handler - The route handler function being invoked
 * @param controllerClass - The controller class that owns the route handler
 * @returns An ExecutionContext exposing `getRequest`, `getResponse`, `getContext`, `getHandler`, `getClass`, and `getType` (returns `'http'`)
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
    getType: () => 'http',
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
