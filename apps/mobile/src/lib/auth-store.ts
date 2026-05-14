// Token store en memoria — reemplazar con SecureStore en producción
let _token: string | null = null;
let _userId: string | null = null;

export function setSession(token: string, userId: string): void {
  _token = token;
  _userId = userId;
}

export function getToken(): string | null {
  return _token;
}

export function getUserId(): string | null {
  return _userId;
}

export function clearSession(): void {
  _token = null;
  _userId = null;
}
