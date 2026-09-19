import 'reflect-metadata';

import { API_METADATA } from '../nest-http.metadata';

export function ReportProgress(): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(API_METADATA.REPORT_PROGRESS, true, target, propertyKey);
    return descriptor;
  };
}
