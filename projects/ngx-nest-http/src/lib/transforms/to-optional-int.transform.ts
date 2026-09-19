/** Coerce unknown scalar to optional int for DTO `@Transform`. */
export function toOptionalInt(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : (value as number);
}
