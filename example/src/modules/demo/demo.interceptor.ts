import type { WynkInterceptor, InterceptorContext } from "wynkjs";
import { Injectable } from "wynkjs";

@Injectable()
export class DemoLoggingInterceptor implements WynkInterceptor {
  intercept(context: InterceptorContext, next: () => Promise<any>): Promise<any> {
    const start = Date.now();
    const req = context.getRequest();
    return next().then((result) => {
      const elapsed = Date.now() - start;
      console.log(`[DemoInterceptor] ${req?.method ?? "?"} ${req?.path ?? "?"} — ${elapsed}ms`);
      return result;
    });
  }
}
