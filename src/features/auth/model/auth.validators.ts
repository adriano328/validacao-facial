import type { LoginErrors, LoginFormValues } from './auth.types';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function validateLoginField(
  form: LoginFormValues,
  field: keyof LoginFormValues
): string | undefined {
  const value = form[field]?.toString().trim();

  if (field === 'email') {
    if (!value) return 'E-mail é obrigatório.';
    if (!isEmail(value)) return 'E-mail inválido.';
  }

  if (field === 'password') {
    if (!value) return 'Senha é obrigatória.';
    if (value.length < 6) return 'Senha muito curta.';
  }

  return undefined;
}

export function validateLoginForm(form: LoginFormValues): LoginErrors {
  const errors: LoginErrors = {};

  (Object.keys(form) as (keyof LoginFormValues)[]).forEach((field) => {
    const error = validateLoginField(form, field);
    if (error) errors[field] = error;
  });

  return errors;
}

export function hasLoginErrors(errors: LoginErrors): boolean {
  return Object.keys(errors).length > 0;
}