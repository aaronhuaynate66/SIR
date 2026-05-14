import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_KEY = '@sir/language';

// Token store — sincronizado por useAuth cuando cambia la sesión de Supabase
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

export async function getLanguage(): Promise<string | null> {
  return AsyncStorage.getItem(LANG_KEY);
}

export async function setLanguage(lang: string): Promise<void> {
  return AsyncStorage.setItem(LANG_KEY, lang);
}
