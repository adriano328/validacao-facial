import type { LoginForm } from "./type";

export type LoginErrors = Partial<Record<keyof LoginForm, string>>;

const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function validateField(form: LoginForm, key: keyof LoginForm): string | undefined {
  const v = form[key]?.toString().trim();

  if (key === "email") {
    if (!v) return "E-mail é obrigatório.";
    if (!isEmail(v)) return "E-mail inválido.";
  }

  if (key === "password") {
    if (!v) return "Senha é obrigatória.";
    if (v.length < 6) return "Senha muito curta.";
  }

  return undefined;
}

export function validateLogin(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {};
  (Object.keys(form) as (keyof LoginForm)[]).forEach((k) => {
    const msg = validateField(form, k);
    if (msg) errors[k] = msg;
  });
  return errors;
}

export function hasErrors(err: LoginErrors): boolean {
  return Object.keys(err).length > 0;
}
