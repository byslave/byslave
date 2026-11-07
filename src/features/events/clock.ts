let override: Date | null = null;

export function setServerNow(value: Date | null): void {
  override = value;
}

export function serverNow(): Date {
  return override ? new Date(override.getTime()) : new Date();
}

/** Prefer the machine that served the page. Fall back only if that header is missing. */
export async function readServerNow(): Promise<Date> {
  if (override) return serverNow();
  if (typeof fetch !== 'function') return serverNow();
  try {
    const response = await fetch('/', { method: 'HEAD', cache: 'no-store' });
    const header = response.headers.get('date');
    if (header) {
      const parsed = new Date(header);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  } catch {
    return serverNow();
  }
  return serverNow();
}
