import { InjectionToken } from '@angular/core';

import { resolveNestHttpConfig, type ResolvedNestHttpConfig } from './nest-http.config';

export const NEST_HTTP_CONFIG = new InjectionToken<ResolvedNestHttpConfig>('NEST_HTTP_CONFIG', {
  providedIn: 'root',
  factory: () => resolveNestHttpConfig(),
});
