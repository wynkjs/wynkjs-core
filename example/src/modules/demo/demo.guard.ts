import { Injectable, Reflector } from "wynkjs";
import type { WynkGuard, ExecutionContext } from "wynkjs";

const ROLES_KEY = "demo_roles";

@Injectable()
export class DemoRolesGuard implements WynkGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!roles || roles.length === 0) return true;

    const request = context.getRequest();
    const user: { roles?: string[] } = (request as any)?.user ?? {};
    const userRoles: string[] = user.roles ?? [];

    return roles.some((r) => userRoles.includes(r));
  }
}
