import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { NEST_HTTP_CONFIG } from '../nest-http.tokens';
import type { NestHttpLogger, ResolvedNestHttpConfig } from '../nest-http.config';
import type { ApiObserve, ApiRequestConfig, ResponseType } from '../types';

interface HttpCallOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams;
  responseType?: ResponseType;
  reportProgress?: boolean;
  observe?: ApiObserve;
  body?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ApiExecutor {
  private readonly http = inject(HttpClient);
  private readonly nestHttpConfig = inject(NEST_HTTP_CONFIG);
  private baseUrl = this.nestHttpConfig.baseUrl;

  get config(): ResolvedNestHttpConfig {
    return this.nestHttpConfig;
  }

  get logger(): NestHttpLogger {
    return this.nestHttpConfig.logger;
  }

  /** @deprecated Prefer `@ApiController(path, { baseUrl })` so each service keeps its own host. */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  execute<T = unknown>(config: ApiRequestConfig): Observable<T> {
    const url = this.buildUrl(config.url, config.baseUrl);
    const options = this.buildOptions(config);

    switch (config.method.toUpperCase()) {
      case 'GET':
        return this.http.get<T>(url, options as never) as Observable<T>;
      case 'POST':
        return this.http.post<T>(url, config.body, options as never) as Observable<T>;
      case 'PUT':
        return this.http.put<T>(url, config.body, options as never) as Observable<T>;
      case 'DELETE':
        return this.http.delete<T>(url, { ...options, body: config.body } as never) as Observable<T>;
      case 'PATCH':
        return this.http.patch<T>(url, config.body, options as never) as Observable<T>;
      default:
        throw new Error(`Unsupported HTTP method: ${config.method}`);
    }
  }

  private buildUrl(path: string, baseUrl?: string): string {
    const cleanBaseUrl = (baseUrl ?? this.baseUrl).replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
  }

  private buildOptions(config: ApiRequestConfig): HttpCallOptions {
    const options: HttpCallOptions = {};

    if (config.headers) {
      options.headers = config.headers;
    }

    if (config.responseType) {
      options.responseType = config.responseType;
    }

    if (config.reportProgress) {
      options.reportProgress = true;
    }

    if (config.observe) {
      options.observe = config.observe;
    }

    if (config.params) {
      let httpParams = new HttpParams();
      Object.keys(config.params).forEach(key => {
        httpParams = this.appendQueryParam(httpParams, key, config.params![key]);
      });
      options.params = httpParams;
    }

    return options;
  }

  private appendQueryParam(httpParams: HttpParams, key: string, value: unknown): HttpParams {
    if (value === null || value === undefined) {
      return httpParams;
    }
    if (Array.isArray(value)) {
      return value.reduce(
        (params, item) => this.appendQueryParam(params, key, item),
        httpParams,
      );
    }
    return httpParams.append(key, String(value));
  }
}
