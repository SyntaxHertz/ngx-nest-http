import { Injectable } from '@angular/core';
import { IsString, MinLength } from 'class-validator';
import {
  ApiController,
  Body,
  GET,
  Log,
  NestHttpClient,
  POST,
  request,
} from 'ngx-nest-http';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

export interface User {
  id: number;
  name: string;
}

@ApiController('api/users')
@Injectable({ providedIn: 'root' })
export class UsersApi extends NestHttpClient {
  @GET()
  @Log()
  list() {
    return request<User[]>();
  }

  @POST()
  @Log({
    skipGlobal: true,
    onRequest: ({ body }) => {
      console.info('[demo] creating', (body as CreateUserDto).name);
    },
  })
  create(@Body() dto: CreateUserDto) {
    return request<User>();
  }
}
