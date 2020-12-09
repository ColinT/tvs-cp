export function coerceBoolean(value: number | string | boolean | Record<string, unknown> | undefined | null): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() !== 'false';
  } else {
    return !!value;
  }
}

export function isProcessAlive(processId: number): boolean {
  try {
    process.kill(processId, 0);
    return true;
  } catch (error) {
    return false;
  }
}
