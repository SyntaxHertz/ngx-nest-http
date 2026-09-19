import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { IsString, MinLength } from 'class-validator';

import {
  ApiController,
  Body,
  GET,
  Log,
  NestHttpClient,
  Params,
  POST,
  provideNestHttp,
  Query,
  request,
  ValidationErrorException,
  type NestHttpLogEvent,
} from '../public-api';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

interface User {
  id: number;
  name: string;
}

@ApiController('api/users')
@Injectable()
class UsersApi extends NestHttpClient {
  @GET()
  list(@Query() query?: Record<string, unknown>) {
    return request<User[]>();
  }

  @GET('/:id')
  getById(@Params('id') id: number) {
    return request<User>();
  }

  @POST()
  create(@Body() dto: CreateUserDto) {
    return request<User>();
  }

  @GET()
  @Log()
  loggedList() {
    return request<User[]>();
  }

  @POST()
  @Log({
    skipGlobal: true,
    onRequest: () => {
      methodLogCalls.push('request');
    },
    onResponse: () => {
      methodLogCalls.push('response');
    },
  })
  loggedCreate(@Body() dto: CreateUserDto) {
    return request<User>();
  }
}

@ApiController('api', { baseUrl: 'https://maps.example.com' })
@Injectable()
class MapApi extends NestHttpClient {
  @GET('/search')
  search(@Query('q') q: string) {
    return request<string>();
  }
}

const globalLogCalls: NestHttpLogEvent[] = [];
const methodLogCalls: string[] = [];

describe('ngx-nest-http', () => {
  let http: HttpTestingController;
  let usersApi: UsersApi;
  let mapApi: MapApi;

  beforeEach(() => {
    globalLogCalls.length = 0;
    methodLogCalls.length = 0;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNestHttp({
          baseUrl: 'https://api.example.com',
          onLog: event => globalLogCalls.push(event),
          validation: { logErrors: false, logMismatches: false },
        }),
        UsersApi,
        MapApi,
      ],
    });

    http = TestBed.inject(HttpTestingController);
    usersApi = TestBed.inject(UsersApi);
    mapApi = TestBed.inject(MapApi);
  });

  afterEach(() => {
    http.verify();
  });

  it('builds the path from the controller prefix', () => {
    usersApi.list().subscribe();

    const req = http.expectOne('https://api.example.com/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('replaces path params', () => {
    usersApi.getById(7).subscribe();

    const req = http.expectOne('https://api.example.com/api/users/7');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7, name: 'Ada' });
  });

  it('appends query params', () => {
    usersApi.list({ page: 2, q: 'ada' }).subscribe();

    const req = http.expectOne(
      r => r.url === 'https://api.example.com/api/users' && r.params.get('page') === '2' && r.params.get('q') === 'ada',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('posts a validated body', fakeAsync(() => {
    let result: User | undefined;
    usersApi.create({ name: 'Ada' }).subscribe(value => {
      result = value;
    });
    tick();

    const req = http.expectOne('https://api.example.com/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(jasmine.objectContaining({ name: 'Ada' }));
    req.flush({ id: 1, name: 'Ada' });
    tick();

    expect(result).toEqual({ id: 1, name: 'Ada' });
  }));

  it('rejects an invalid DTO before sending the request', fakeAsync(() => {
    let error: unknown;
    usersApi.create({ name: '' }).subscribe({
      next: () => fail('should not succeed'),
      error: err => {
        error = err;
      },
    });
    tick();

    expect(error).toBeInstanceOf(ValidationErrorException);
  }));

  it('uses the controller baseUrl override', () => {
    mapApi.search('berlin').subscribe();

    const req = http.expectOne(
      r => r.url === 'https://maps.example.com/api/search' && r.params.get('q') === 'berlin',
    );
    expect(req.request.method).toBe('GET');
    req.flush('ok');
  });

  it('sends opted-in methods to the global onLog handler', () => {
    usersApi.loggedList().subscribe();

    expect(globalLogCalls.map(event => event.phase)).toEqual(['request']);

    http.expectOne('https://api.example.com/api/users').flush([]);

    expect(globalLogCalls.map(event => event.phase)).toEqual(['request', 'response']);
    expect(globalLogCalls[0].methodName).toBe('loggedList');
  });

  it('lets a method skip the global logger', fakeAsync(() => {
    usersApi.loggedCreate({ name: 'Ada' }).subscribe();
    tick();

    expect(globalLogCalls.length).toBe(0);
    expect(methodLogCalls).toEqual(['request']);

    http.expectOne('https://api.example.com/api/users').flush({ id: 1, name: 'Ada' });
    tick();

    expect(globalLogCalls.length).toBe(0);
    expect(methodLogCalls).toEqual(['request', 'response']);
  }));
});
