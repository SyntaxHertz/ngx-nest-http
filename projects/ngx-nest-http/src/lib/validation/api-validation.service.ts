import { inject, Injectable } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { NEST_HTTP_CONFIG } from '../nest-http.tokens';
import { ValidationErrorException } from './validation-error.exception';
import {
  flattenValidationErrors,
  toValidationMessages,
} from './flatten-validation-errors.util';
import {
  findTransformMismatches,
  pickValidationDebugSnapshot,
} from './validation-debug.util';

@Injectable({ providedIn: 'root' })
export class ApiValidationService {
  private readonly config = inject(NEST_HTTP_CONFIG);

  async validateAndTransform<T extends object>(
    dtoClass: new () => T,
    plainObject: unknown,
  ): Promise<T> {
    if (plainObject == null || typeof plainObject !== 'object') {
      throw this.buildException({
        dtoClass,
        errors: [],
        details: [],
        transformWarning: `Expected body object for ${dtoClass.name}, received ${String(plainObject)}`,
        plainObject,
        instance: plainObject,
      });
    }

    const instance = plainToInstance(dtoClass, plainObject, {
      enableImplicitConversion: true,
    });

    if (instance == null) {
      throw this.buildException({
        dtoClass,
        errors: [],
        details: [],
        transformWarning: `plainToInstance returned empty result for ${dtoClass.name}`,
        plainObject,
        instance,
      });
    }

    if (this.config.validation.logMismatches) {
      this.warnOnTransformMismatch(dtoClass.name, plainObject, instance);
    }

    const errors = await validate(instance);

    if (errors.length > 0) {
      throw this.buildException({
        dtoClass,
        errors,
        details: flattenValidationErrors(errors),
        plainObject,
        instance,
      });
    }

    return instance;
  }

  private buildException(params: {
    dtoClass: new () => unknown;
    errors: ValidationErrorException['errors'];
    details: ReturnType<typeof flattenValidationErrors>;
    transformWarning?: string;
    plainObject: unknown;
    instance: unknown;
  }): ValidationErrorException {
    const messages = params.transformWarning
      ? [params.transformWarning, ...toValidationMessages(params.details)]
      : toValidationMessages(params.details);

    const context = {
      dtoClass: params.dtoClass.name,
      details: params.details,
      transformWarning: params.transformWarning,
      plainSnapshot: pickValidationDebugSnapshot(params.plainObject),
      instanceSnapshot: pickValidationDebugSnapshot(params.instance),
    };

    if (this.config.validation.logErrors) {
      this.config.logger.error('[ApiValidation] failed', context);
    }

    return new ValidationErrorException(params.errors, messages, context);
  }

  private warnOnTransformMismatch(
    dtoClassName: string,
    plainObject: unknown,
    instance: unknown,
  ): void {
    const mismatches = findTransformMismatches(
      plainObject as Record<string, unknown>,
      instance as Record<string, unknown>,
    );

    if (!mismatches.length) {
      return;
    }

    this.config.logger.warn('[ApiValidation] transform mismatch', {
      dto: dtoClassName,
      mismatches,
    });
  }
}
