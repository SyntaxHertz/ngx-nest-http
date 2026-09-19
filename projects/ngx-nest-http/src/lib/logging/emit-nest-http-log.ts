import { Injector, runInInjectionContext } from '@angular/core';

import type { ResolvedNestHttpConfig } from '../nest-http.config';
import type { NestHttpLogEvent, NestHttpLogHooks } from './nest-http-log.types';

export function emitNestHttpLog(
  event: NestHttpLogEvent,
  config: ResolvedNestHttpConfig,
  hooks?: NestHttpLogHooks,
  injector?: Injector,
): void {
  const emit = (): void => {
    const hasGlobal = typeof config.onLog === 'function';
    const hasHooks = !!(hooks?.onRequest || hooks?.onResponse || hooks?.onError);

    if (hasGlobal && !hooks?.skipGlobal) {
      config.onLog!(event);
    }

    if (event.phase === 'request') {
      hooks?.onRequest?.(event);
    } else if (event.phase === 'response') {
      hooks?.onResponse?.(event);
    } else {
      hooks?.onError?.(event);
    }

    if (!hasGlobal && !hasHooks) {
      if (event.phase === 'error') {
        config.logger.error(event);
      } else {
        config.logger.log(event);
      }
    }
  };

  if (injector) {
    try {
      runInInjectionContext(injector, emit);
      return;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('destroyed')) {
        throw error;
      }
    }
  }

  emit();
}
