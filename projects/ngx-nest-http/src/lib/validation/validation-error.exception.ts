import { ValidationError } from 'class-validator';

import type { FlattenedValidationError } from './flatten-validation-errors.util';

export interface ValidationErrorContext {
  dtoClass: string;
  details: FlattenedValidationError[];
  transformWarning?: string;
  plainSnapshot?: unknown;
  instanceSnapshot?: unknown;
}

export class ValidationErrorException extends Error {
  constructor(
    public readonly errors: ValidationError[],
    public readonly messages: string[],
    public readonly context?: ValidationErrorContext,
  ) {
    super('Validation failed');
    this.name = 'ValidationErrorException';
  }
}
