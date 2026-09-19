import { ValidationError } from 'class-validator';

export interface FlattenedValidationError {
  path: string;
  value: unknown;
  messages: string[];
}

export function flattenValidationErrors(
  errors: ValidationError[],
  prefix = '',
): FlattenedValidationError[] {
  return errors.flatMap(error => {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    const own: FlattenedValidationError[] = error.constraints
      ? [
          {
            path,
            value: error.value,
            messages: Object.values(error.constraints),
          },
        ]
      : [];

    return [...own, ...flattenValidationErrors(error.children ?? [], path)];
  });
}

export function toValidationMessages(details: FlattenedValidationError[]): string[] {
  return details.flatMap(detail =>
    detail.messages.map(message => `${detail.path}: ${message}`),
  );
}
