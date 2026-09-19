import { toOptionalInt } from './to-optional-int.transform';

/** Like `toOptionalInt`, but keeps explicit `null` for nullable API fields. */
export function toNullableInt(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  return toOptionalInt(value);
}
