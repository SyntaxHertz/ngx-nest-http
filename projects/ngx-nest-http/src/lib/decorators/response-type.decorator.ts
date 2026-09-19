import 'reflect-metadata';

import { API_METADATA } from '../nest-http.metadata';
import type { ResponseType as ResponseTypeValue } from '../types';

export function ResponseType(type: ResponseTypeValue): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(API_METADATA.RESPONSE_TYPE, type, target, propertyKey);
    return descriptor;
  };
}
