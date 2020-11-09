export function coerceBoolean(value: number | string | boolean | Record<string, unknown> | undefined | null): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false';
  } else {
    return !!value;
  }
}
