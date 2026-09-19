import 'reflect-metadata';

import { API_METADATA } from '../nest-http.metadata';
import { HttpMethod, type RouteMetadata } from '../types';

function createHttpMethodDecorator(method: HttpMethod) {
  return (path: string = ''): MethodDecorator => {
    return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      const existingRoutes: RouteMetadata[] =
        Reflect.getOwnMetadata(API_METADATA.ROUTES, (target as { constructor: Function }).constructor) || [];

      existingRoutes.push({
        method,
        path,
        methodName: propertyKey as string,
      });

      Reflect.defineMetadata(
        API_METADATA.ROUTES,
        existingRoutes,
        (target as { constructor: Function }).constructor,
      );

      return descriptor;
    };
  };
}

export const GET = createHttpMethodDecorator(HttpMethod.GET);
export const POST = createHttpMethodDecorator(HttpMethod.POST);
export const PUT = createHttpMethodDecorator(HttpMethod.PUT);
export const DELETE = createHttpMethodDecorator(HttpMethod.DELETE);
export const PATCH = createHttpMethodDecorator(HttpMethod.PATCH);
