import 'reflect-metadata';
import { Injector } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { ApiExecutor } from '../executor/api-executor.service';
import { emitNestHttpLog } from '../logging/emit-nest-http-log';
import type { NestHttpLogEvent, NestHttpLogHooks, NestHttpLogOptions } from '../logging/nest-http-log.types';
import { API_METADATA } from '../nest-http.metadata';
import type { ApiControllerOptions, ApiRequestConfig, ParamMetadata, ResponseType, RouteMetadata } from '../types';
import { ValidationErrorException } from '../validation/validation-error.exception';
import { ApiValidationService } from '../validation/api-validation.service';

interface NestHttpHost {
  apiExecutor?: ApiExecutor;
  apiValidationService?: ApiValidationService;
  injector?: Injector;
}

export function ApiController(basePath = '', options?: ApiControllerOptions): ClassDecorator {
  return <TFunction extends Function>(target: TFunction): TFunction => {
    Reflect.defineMetadata(API_METADATA.BASE_PATH, basePath, target);
    if (options?.baseUrl) {
      Reflect.defineMetadata(API_METADATA.BASE_URL, options.baseUrl, target);
    }

    const controllerBaseUrl = options?.baseUrl;
    const routes: RouteMetadata[] = Reflect.getOwnMetadata(API_METADATA.ROUTES, target) || [];

    routes.forEach(route => {
      target.prototype[route.methodName] = function (this: NestHttpHost, ...args: unknown[]): Observable<unknown> {
        const apiExecutor = this.apiExecutor;
        const validationService = this.apiValidationService;

        if (!apiExecutor) {
          throw new Error(
            `ApiExecutor not found in ${target.name}.${route.methodName}. ` +
              `Extend NestHttpClient or inject ApiExecutor: constructor(public apiExecutor: ApiExecutor) {}`,
          );
        }

        const paramsMetadata: ParamMetadata[] =
          Reflect.getOwnMetadata(API_METADATA.PARAMS, target.prototype, route.methodName) || [];
        const bodyMetadata: ParamMetadata[] =
          Reflect.getOwnMetadata(API_METADATA.BODY, target.prototype, route.methodName) || [];
        const queryMetadata: ParamMetadata[] =
          Reflect.getOwnMetadata(API_METADATA.QUERY, target.prototype, route.methodName) || [];

        const headersMetadata: Record<string, string> =
          Reflect.getOwnMetadata(API_METADATA.HEADERS, target.prototype, route.methodName) || {};
        const responseTypeMetadata: ResponseType | undefined = Reflect.getOwnMetadata(
          API_METADATA.RESPONSE_TYPE,
          target.prototype,
          route.methodName,
        );
        const logMetadata: NestHttpLogOptions | undefined = Reflect.getOwnMetadata(
          API_METADATA.LOG,
          target.prototype,
          route.methodName,
        );
        const loggingEnabled = logMetadata !== undefined && logMetadata !== false;
        const logHooks: NestHttpLogHooks | undefined =
          typeof logMetadata === 'object' ? logMetadata : undefined;
        const reportProgressMetadata: boolean =
          Reflect.getOwnMetadata(API_METADATA.REPORT_PROGRESS, target.prototype, route.methodName) || false;

        let url = `${basePath}${route.path}`;
        const queryParams: Record<string, unknown> = {};
        let body: unknown;
        let bodyDtoClass: (new () => object) | undefined;

        paramsMetadata.forEach(param => {
          const value = args[param.index];
          if (param.key) {
            if (value === undefined || value === null) {
              throw new Error(
                `Path parameter '${param.key}' is undefined or null in ${target.name}.${route.methodName}. ` +
                  `All path parameters must have a value.`,
              );
            }
            url = url.replaceAll(`:${param.key}`, String(value));
            return;
          }

          if (value && typeof value === 'object') {
            Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
              if (entry !== undefined && entry !== null) {
                url = url.replaceAll(`:${key}`, String(entry));
              }
            });
          }
        });

        bodyMetadata.forEach(param => {
          body = args[param.index];
          bodyDtoClass = param.dtoClass;
        });

        queryMetadata.forEach(param => {
          const value = args[param.index];
          if (param.key) {
            queryParams[param.key] = value;
            return;
          }
          if (value && typeof value === 'object') {
            Object.assign(queryParams, value);
          }
        });

        const executeRequest = (requestBody: unknown): Observable<unknown> => {
          const requestConfig: ApiRequestConfig = {
            method: route.method,
            url,
            body: requestBody,
            params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
            baseUrl: controllerBaseUrl,
          };

          if (Object.keys(headersMetadata).length > 0) {
            requestConfig.headers = headersMetadata;
          }

          if (responseTypeMetadata) {
            requestConfig.responseType = responseTypeMetadata;
          }

          if (reportProgressMetadata) {
            requestConfig.reportProgress = true;
            requestConfig.observe = 'events';
          }

          const emitLog = (phase: NestHttpLogEvent['phase'], extra?: Partial<NestHttpLogEvent>): void => {
            if (!loggingEnabled) {
              return;
            }

            emitNestHttpLog(
              {
                phase,
                controller: target.name,
                methodName: route.methodName,
                httpMethod: route.method,
                url,
                body: requestBody,
                params: queryParams,
                headers: headersMetadata,
                responseType: responseTypeMetadata,
                bodyType: bodyDtoClass ? `DTO Class: ${bodyDtoClass.name}` : 'Primitive/Interface (no validation)',
                ...extra,
              },
              apiExecutor.config,
              logHooks,
              this.injector,
            );
          };

          emitLog('request');

          const request$ = apiExecutor.execute(requestConfig);

          if (loggingEnabled) {
            return request$.pipe(
              tap({
                next: response => {
                  emitLog('response', { response });
                },
                error: error => {
                  emitLog('error', { error });
                },
              }),
            );
          }

          return request$;
        };

        const shouldValidate =
          !!bodyDtoClass &&
          body !== undefined &&
          apiExecutor.config.validation.enabled;

        if (shouldValidate && bodyDtoClass) {
          if (!validationService) {
            throw new Error(
              `ApiValidationService not found in ${target.name}.${route.methodName}. ` +
                `Extend NestHttpClient or inject ApiValidationService: constructor(public apiValidationService: ApiValidationService) {}`,
            );
          }

          return from(validationService.validateAndTransform(bodyDtoClass, body)).pipe(
            switchMap(validatedBody => executeRequest(validatedBody)),
            catchError(error => {
              if (error instanceof ValidationErrorException && apiExecutor.config.validation.logErrors) {
                apiExecutor.logger.error(`[Validation Error] ${route.method} ${url}`, {
                  dto: error.context?.dtoClass,
                  messages: error.messages,
                  details: error.context?.details,
                  transformWarning: error.context?.transformWarning,
                });
              }
              return throwError(() => error);
            }),
          );
        }

        return executeRequest(body);
      };
    });

    return target;
  };
}
