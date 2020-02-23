export function coerceBoolean(value: any): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false';
  } else {
    return !!value;
  }
}
