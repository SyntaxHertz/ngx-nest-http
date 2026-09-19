import { inject, Injector } from '@angular/core';

import { ApiExecutor } from './executor/api-executor.service';
import { ApiValidationService } from './validation/api-validation.service';

/**
 * Optional base class so API services do not need to inject
 * `ApiExecutor` and `ApiValidationService` in every constructor.
 */
export abstract class NestHttpClient {
  readonly apiExecutor = inject(ApiExecutor);
  readonly apiValidationService = inject(ApiValidationService);
  readonly injector = inject(Injector);
}
