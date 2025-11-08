export interface InterceptorContext {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getContext<T = any>(): T;
  getHandler(): Function;
  getClass(): any;
  // Request data
  request?: any;
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  // Route metadata
  path?: string;
  method?: string;
}
