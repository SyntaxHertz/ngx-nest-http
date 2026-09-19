import 'reflect-metadata';

import { API_METADATA } from '../nest-http.metadata';
import type { NestHttpLogOptions } from '../logging/nest-http-log.types';

export function Log(options: NestHttpLogOptions = true): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(API_METADATA.LOG, options, target, propertyKey);
    return descriptor;
  };
}
