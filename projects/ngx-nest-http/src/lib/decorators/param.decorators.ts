import 'reflect-metadata';

import { API_METADATA } from '../nest-http.metadata';
import type { ParamMetadata } from '../types';

export function Params(key?: string): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) {
      return;
    }

    const existingParams: ParamMetadata[] =
      Reflect.getOwnMetadata(API_METADATA.PARAMS, target, propertyKey) || [];

    if (key) {
      const duplicate = existingParams.find(param => param.key === key);
      if (duplicate) {
        throw new Error(
          `@Params('${key}') decorator: Duplicate parameter key '${key}' found on ${String(propertyKey)}. ` +
            `Each path parameter key must be unique.`,
        );
      }
    }

    existingParams.push({
      index: parameterIndex,
      type: 'params',
      key,
    });

    Reflect.defineMetadata(API_METADATA.PARAMS, existingParams, target, propertyKey);
  };
}

/** Nest-style alias of `@Params()`. */
export const Param = Params;

export function Body(): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) {
      return;
    }

    const paramTypes: unknown[] | undefined = Reflect.getMetadata('design:paramtypes', target, propertyKey);

    let resolvedDtoClass: (new () => object) | undefined;

    if (paramTypes && paramTypes[parameterIndex]) {
      const paramType = paramTypes[parameterIndex] as Function;
      const isNativeOrBuiltIn = [String, Number, Boolean, Date, Array, Object, FormData].includes(
        paramType as never,
      );
      const isClass =
        typeof paramType === 'function' &&
        paramType.prototype &&
        !isNativeOrBuiltIn &&
        paramType !== Object;

      if (isClass) {
        resolvedDtoClass = paramType as new () => object;
      }
    } else {
      throw new Error(
        `@Body() decorator: Could not determine parameter type at index ${parameterIndex}. ` +
          `Make sure 'emitDecoratorMetadata' is enabled in tsconfig.json and the parameter has a type annotation. ` +
          `Usage: @Body() userData: CreateUserDto | @Body() data: string | @Body() data: UpdateUserDto`,
      );
    }

    const existingParams: ParamMetadata[] =
      Reflect.getOwnMetadata(API_METADATA.BODY, target, propertyKey) || [];

    if (existingParams.length > 0) {
      throw new Error(
        `@Body() decorator: Multiple @Body() decorators found on ${String(propertyKey)}. ` +
          `Only one @Body() parameter is allowed per method.`,
      );
    }

    existingParams.push({
      index: parameterIndex,
      type: 'body',
      dtoClass: resolvedDtoClass,
    });

    Reflect.defineMetadata(API_METADATA.BODY, existingParams, target, propertyKey);
  };
}

export function Query(key?: string): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) {
      return;
    }

    const existingParams: ParamMetadata[] =
      Reflect.getOwnMetadata(API_METADATA.QUERY, target, propertyKey) || [];

    if (key) {
      const duplicate = existingParams.find(param => param.key === key);
      if (duplicate) {
        throw new Error(
          `@Query('${key}') decorator: Duplicate query parameter key '${key}' found on ${String(propertyKey)}. ` +
            `Each query parameter key must be unique.`,
        );
      }
    }

    existingParams.push({
      index: parameterIndex,
      type: 'query',
      key,
    });

    Reflect.defineMetadata(API_METADATA.QUERY, existingParams, target, propertyKey);
  };
}
