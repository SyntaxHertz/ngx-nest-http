# ngx-nest-http

Angular HTTP client with Nest-style controllers, DTO validation, and declarative routing.

Write API services the same way you write NestJS controllers: `@ApiController`, `@GET`, `@POST`, `@Body`, `@Params`, `@Query`. When the body is a `class-validator` DTO, it is transformed and validated **before** the request is sent.

## Install

```bash
ng add ngx-nest-http
```

Or manually:

```bash
npm install ngx-nest-http class-validator class-transformer reflect-metadata
```

## Setup

Import `reflect-metadata` once at app bootstrap:

```ts
import 'reflect-metadata';
```

Enable decorator metadata in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false
  }
}
```

Register HttpClient and the library config:

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideNestHttp } from 'ngx-nest-http';

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideNestHttp({
      baseUrl: 'https://api.example.com',
      validation: {
        logErrors: !production,
        logMismatches: !production,
      },
    }),
  ],
};
```

## Usage

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IsInt, IsString } from 'class-validator';
import {
  ApiController,
  Body,
  GET,
  NestHttpClient,
  Params,
  POST,
  Query,
  request,
} from 'ngx-nest-http';

interface User {
  id: number;
  name: string;
}

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsInt()
  age!: number;
}

@ApiController('api/users')
@Injectable({ providedIn: 'root' })
export class UsersApi extends NestHttpClient {
  @GET()
  list(@Query() query?: Record<string, unknown>): Observable<User[]> {
    return request();
  }

  @GET('/:id')
  getById(@Params('id') id: number): Observable<User> {
    return request();
  }

  @POST()
  create(@Body() dto: CreateUserDto): Observable<User> {
    return request();
  }
}
```

`request()` is only a type placeholder. `@ApiController` replaces the method at runtime.

You can also inject `ApiExecutor` and `ApiValidationService` in the constructor instead of extending `NestHttpClient`.

## Decorators

| Decorator | Role |
| --- | --- |
| `@ApiController(path, { baseUrl })` | Base path, optional host override |
| `@GET` `@POST` `@PUT` `@PATCH` `@DELETE` | HTTP method + path |
| `@Params()` / `@Param()` | Path params |
| `@Query()` | Query params |
| `@Body()` | Request body. Class DTOs are validated |
| `@Header({})` | Extra headers |
| `@ResponseType('blob' \| 'text' \| ...)` | HttpClient response type |
| `@ReportProgress()` | Upload/download progress events |
| `@Log()` | Opt this method into request logging |

## Logging

`@Log()` only opts a method in. The library emits a structured event; you decide how it looks.

`onLog` runs first, then the method hooks. Use `skipGlobal: true` when this method should not use the app-wide handler. If neither `onLog` nor method hooks are set, the event object is passed to `logger` (default `console`). Methods without `@Log()` emit nothing.

Hooks run in the API service injection context, so you can `inject()` your own Angular services. The same callbacks work with any SDK (Sentry, PostHog, Mixpanel, ...) — those stay app dependencies, not this library's.

Complete example:

```ts
import { inject, Injectable } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IsString } from 'class-validator';
import {
  ApiController,
  Body,
  GET,
  Log,
  NestHttpClient,
  POST,
  provideNestHttp,
  request,
  type NestHttpLogEvent,
} from 'ngx-nest-http';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  track(name: string, data?: unknown): void {
    // send to your backend, PostHog, Sentry, Mixpanel, ...
  }
}

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideNestHttp({
      baseUrl: 'https://api.example.com',
      onLog(event: NestHttpLogEvent) {
        inject(AnalyticsService).track(`http.${event.phase}`, {
          method: event.httpMethod,
          url: event.url,
          api: `${event.controller}.${event.methodName}`,
          error: event.error,
        });
      },
    }),
  ],
};

export class CreateUserDto {
  @IsString()
  name!: string;
}

interface User {
  id: number;
  name: string;
}

@ApiController('api/users')
@Injectable({ providedIn: 'root' })
export class UsersApi extends NestHttpClient {
  @GET()
  @Log()
  list(): Observable<User[]> {
    return request();
  }

  @POST()
  @Log({
    skipGlobal: true,
    onRequest: ({ body }) => {
      inject(AnalyticsService).track('user.create.attempt', {
        name: (body as CreateUserDto).name,
      });
    },
    onResponse: ({ response }) => {
      inject(AnalyticsService).track('user.create.ok', {
        id: (response as User).id,
      });
    },
    onError: ({ error }) => {
      inject(AnalyticsService).track('user.create.fail', error);
    },
  })
  create(@Body() dto: CreateUserDto): Observable<User> {
    return request();
  }

  @GET('/health')
  health(): Observable<{ ok: boolean }> {
    return request();
  }
}
```

`list()` uses the global `onLog`. `create()` skips it and sends its own events. `health()` has no `@Log()`, so it stays silent.

## DTO transforms

```ts
import { Transform } from 'class-transformer';
import { toOptionalInt, toNullableInt, toOptionalIntArray } from 'ngx-nest-http';

@Transform(({ value }) => toOptionalInt(value))
age?: number;
```

## Envelope types

This library does not ship a fixed API envelope. Map `ApiResponse`, pagination, and error codes in your app.

## Development

```bash
npm start          # demo app
npm test           # library unit tests
npm run build      # library + ng-add schematic
npm run build:demo
```

CI runs on pull requests. Publishing to npm happens when a GitHub Release is published (`NPM_TOKEN` secret).

## License

MIT
