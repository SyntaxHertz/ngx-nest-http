const MAX_ARRAY_ITEMS = 3;
const MAX_STRING_LENGTH = 120;

export function pickValidationDebugSnapshot(value: unknown, depth = 0): unknown {
  if (value == null || typeof value !== 'object') {
    return truncateValue(value);
  }

  if (depth > 2) {
    return '[nested]';
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map(item => pickValidationDebugSnapshot(item, depth + 1));

    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`…+${value.length - MAX_ARRAY_ITEMS} more`);
    }

    return items;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      pickValidationDebugSnapshot(entry, depth + 1),
    ]),
  );
}

export function findTransformMismatches(
  plainObject: Record<string, unknown>,
  instance: Record<string, unknown>,
): Array<{ field: string; plain: unknown; instance: unknown }> {
  const fields = new Set([...Object.keys(plainObject), ...Object.keys(instance)]);

  return [...fields].flatMap(field => {
    const plain = plainObject[field];
    const transformed = instance[field];

    if (JSON.stringify(plain) === JSON.stringify(transformed)) {
      return [];
    }

    return [{ field, plain: pickValidationDebugSnapshot(plain), instance: pickValidationDebugSnapshot(transformed) }];
  });
}

function truncateValue(value: unknown): unknown {
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    return `${value.slice(0, MAX_STRING_LENGTH)}…`;
  }

  return value;
}
