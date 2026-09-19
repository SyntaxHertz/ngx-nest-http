import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { resolveNestHttpConfig, type NestHttpConfig } from './nest-http.config';
import { NEST_HTTP_CONFIG } from './nest-http.tokens';

export function provideNestHttp(config: NestHttpConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NEST_HTTP_CONFIG, useValue: resolveNestHttpConfig(config) },
  ]);
}
