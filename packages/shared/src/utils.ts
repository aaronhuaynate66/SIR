export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics (á→a, é→e…)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function err<E = Error>(error: E): { ok: false; error: E } {
  return { ok: false, error };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
