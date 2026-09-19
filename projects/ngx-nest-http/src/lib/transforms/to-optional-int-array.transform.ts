/** Coerce unknown array to optional int[] for DTO `@Transform`. */
export function toOptionalIntArray(value: unknown): number[] | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    return value as number[];
  }
  if (value.length === 0) {
    return undefined;
  }
  return value.map(item => Number(item));
}
