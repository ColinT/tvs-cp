export function coerceBoolean(value: number | string | boolean | object | undefined | null | Function): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false';
  } else {
    return !!value;
  }
}
