import type { NestHttpLogHandler } from './logging/nest-http-log.types';

export interface NestHttpValidationConfig {
  enabled: boolean;
  logErrors: boolean;
  logMismatches: boolean;
}

export interface NestHttpLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface NestHttpConfig {
  baseUrl?: string;
  validation?: Partial<NestHttpValidationConfig>;
  logger?: NestHttpLogger;
  /** Called for methods decorated with `@Log()`. Shape is yours to format. */
  onLog?: NestHttpLogHandler;
}

export interface ResolvedNestHttpConfig {
  baseUrl: string;
  validation: NestHttpValidationConfig;
  logger: NestHttpLogger;
  onLog?: NestHttpLogHandler;
}

export function resolveNestHttpConfig(config: NestHttpConfig = {}): ResolvedNestHttpConfig {
  return {
    baseUrl: config.baseUrl ?? '',
    validation: {
      enabled: config.validation?.enabled ?? true,
      logErrors: config.validation?.logErrors ?? true,
      logMismatches: config.validation?.logMismatches ?? true,
    },
    logger: config.logger ?? console,
    onLog: config.onLog,
  };
}

