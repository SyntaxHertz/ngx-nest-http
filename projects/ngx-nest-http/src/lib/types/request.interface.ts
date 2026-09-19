import { HttpHeaders } from '@angular/common/http';

import type { ResponseType } from './response.type';

export type ApiObserve = 'body' | 'events' | 'response';

export interface ApiRequestConfig {
  method: string;
  url: string;
  /** Overrides the default base URL from `provideNestHttp` for this request only. */
  baseUrl?: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: HttpHeaders | Record<string, string | string[]>;
  responseType?: ResponseType;
  reportProgress?: boolean;
  observe?: ApiObserve;
}
