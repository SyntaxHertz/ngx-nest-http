import 'reflect-metadata';

import { API_METADATA } from '../nest-http.metadata';

export function Header(headers: Record<string, string>): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingHeaders: Record<string, string> =
      Reflect.getOwnMetadata(API_METADATA.HEADERS, target, propertyKey) || {};
    const mergedHeaders = { ...existingHeaders, ...headers };
    Reflect.defineMetadata(API_METADATA.HEADERS, mergedHeaders, target, propertyKey);
    return descriptor;
  };
}
