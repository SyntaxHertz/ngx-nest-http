import type { HttpMethod } from './http.enum';

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  methodName: string;
}
