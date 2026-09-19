export { provideNestHttp } from './lib/provide-nest-http';
export { NEST_HTTP_CONFIG } from './lib/nest-http.tokens';
export { NestHttpClient } from './lib/nest-http-client';
export { request } from './lib/request';
export { API_METADATA } from './lib/nest-http.metadata';

export type {
  NestHttpConfig,
  NestHttpLogger,
  NestHttpValidationConfig,
  ResolvedNestHttpConfig,
} from './lib/nest-http.config';
export type {
  NestHttpLogEvent,
  NestHttpLogHandler,
  NestHttpLogHooks,
  NestHttpLogOptions,
  NestHttpLogPhase,
} from './lib/logging/nest-http-log.types';

export { ApiExecutor } from './lib/executor/api-executor.service';
export { ApiValidationService } from './lib/validation/api-validation.service';
export { ValidationErrorException } from './lib/validation/validation-error.exception';
export type { ValidationErrorContext } from './lib/validation/validation-error.exception';
export type { FlattenedValidationError } from './lib/validation/flatten-validation-errors.util';

export { ApiController } from './lib/decorators/controller.decorator';
export { GET, POST, PUT, DELETE, PATCH } from './lib/decorators/http-method.decorators';
export { Params, Param, Body, Query } from './lib/decorators/param.decorators';
export { ResponseType } from './lib/decorators/response-type.decorator';
export { Log } from './lib/decorators/log.decorator';
export { Header } from './lib/decorators/header.decorator';
export { ReportProgress } from './lib/decorators/report-progress.decorator';
export { toNullableInt, toOptionalInt, toOptionalIntArray } from './lib/transforms';

export * from './lib/types';
