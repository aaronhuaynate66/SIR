export type Lang = 'es' | 'en';

const T = {
  es: {
    appName: 'SIR',
    appSubtitle: 'Sistema de Inteligencia Relacional',
    language: {
      title: 'Elige tu idioma',
      subtitle: 'Puedes cambiarlo más adelante en ajustes',
      spanish: 'Español',
      english: 'English',
      continue: 'Continuar',
    },
    login: {
      title: 'Iniciar sesión',
      email: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      password: 'Contraseña',
      passwordPlaceholder: '••••••••',
      submit: 'Entrar',
      loading: 'Entrando…',
      noAccount: '¿No tienes cuenta?',
      signupLink: 'Regístrate',
    },
    signup: {
      title: 'Crear cuenta',
      name: 'Nombre',
      namePlaceholder: 'Tu nombre',
      email: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      password: 'Contraseña',
      passwordPlaceholder: 'Mínimo 8 caracteres',
      submit: 'Crear cuenta',
      loading: 'Creando cuenta…',
      hasAccount: '¿Ya tienes cuenta?',
      loginLink: 'Inicia sesión',
    },
  },
  en: {
    appName: 'SIR',
    appSubtitle: 'Relational Intelligence System',
    language: {
      title: 'Choose your language',
      subtitle: 'You can change this later in settings',
      spanish: 'Español',
      english: 'English',
      continue: 'Continue',
    },
    login: {
      title: 'Sign in',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      submit: 'Sign in',
      loading: 'Signing in…',
      noAccount: "Don't have an account?",
      signupLink: 'Sign up',
    },
    signup: {
      title: 'Create account',
      name: 'Name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      submit: 'Create account',
      loading: 'Creating account…',
      hasAccount: 'Already have an account?',
      loginLink: 'Sign in',
    },
  },
} as const;

export type Translations = typeof T['es'];

export function t(lang: Lang): Translations {
  return (T[lang] as unknown as Translations) ?? T['es'];
}
