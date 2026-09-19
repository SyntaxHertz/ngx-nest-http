import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideNestHttp } from 'ngx-nest-http';

import { mockApiInterceptor } from './mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    provideNestHttp({
      baseUrl: 'https://api.example.com',
      onLog: event => {
        console.debug('[http]', event.phase, event.httpMethod, event.url);
      },
    }),
  ],
};
