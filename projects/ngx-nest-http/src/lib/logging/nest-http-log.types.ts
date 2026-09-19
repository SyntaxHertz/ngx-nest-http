export type NestHttpLogPhase = 'request' | 'response' | 'error';

export interface NestHttpLogEvent {
  phase: NestHttpLogPhase;
  controller: string;
  methodName: string;
  httpMethod: string;
  url: string;
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  responseType?: string;
  bodyType?: string;
  response?: unknown;
  error?: unknown;
}

export type NestHttpLogHandler = (event: NestHttpLogEvent) => void;

export interface NestHttpLogHooks {
  /** Skip `provideNestHttp({ onLog })` for this method. */
  skipGlobal?: boolean;
  onRequest?: NestHttpLogHandler;
  onResponse?: NestHttpLogHandler;
  onError?: NestHttpLogHandler;
}

export type NestHttpLogOptions = boolean | NestHttpLogHooks;
