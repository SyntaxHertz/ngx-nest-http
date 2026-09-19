import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' },
];

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/users')) {
    return next(req);
  }

  if (req.method === 'GET') {
    return of(new HttpResponse({ status: 200, body: users }));
  }

  if (req.method === 'POST') {
    const name = (req.body as { name?: string } | null)?.name ?? 'Anonymous';
    const created = { id: users.length + 1, name };
    users.push(created);
    return of(new HttpResponse({ status: 200, body: created }));
  }

  return next(req);
};
