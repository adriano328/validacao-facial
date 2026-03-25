export type ValidationResult = {
  valid: boolean;
  message?: string;
};

function isEmpty(value?: string | null) {
  return !value || value.trim().length === 0;
}

export function validarEmail(email: string): ValidationResult {
  if (isEmpty(email)) {
    return { valid: false, message: "Informe o e-mail." };
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, message: "E-mail inválido." };
  }

  return { valid: true };
}

export function validarSenha(senha: string): ValidationResult {
  if (isEmpty(senha)) {
    return { valid: false, message: "Informe a senha." };
  }

  if (senha.length < 4) {
    return { valid: false, message: "Senha muito curta." };
  }

  return { valid: true };
}

export function normalizarCodigo2FA(codigo: string): string {
  return codigo.replace(/\D/g, "").slice(0, 6);
}

export function validarCodigo2FA(codigo: string): ValidationResult {
  const codigoLimpo = normalizarCodigo2FA(codigo);

  if (codigoLimpo.length !== 6) {
    return {
      valid: false,
      message: "O código deve conter 6 dígitos.",
    };
  }

  return { valid: true };
}

export function converterCodigo2FAParaNumero(codigo: string): number {
  return Number(normalizarCodigo2FA(codigo));
}

export function validarLogin(params: {
  email: string;
  senha: string;
}): ValidationResult {
  const emailValidation = validarEmail(params.email);
  if (!emailValidation.valid) return emailValidation;

  const senhaValidation = validarSenha(params.senha);
  if (!senhaValidation.valid) return senhaValidation;

  return { valid: true };
}

export function validarTwoFactorSetup(params: {
  email: string;
  senha: string;
  secret: string;
  codigo: string;
}): ValidationResult {
  if (isEmpty(params.secret)) {
    return {
      valid: false,
      message: "Chave de autenticação inválida. Faça login novamente.",
    };
  }

  const loginValidation = validarLogin({
    email: params.email,
    senha: params.senha,
  });

  if (!loginValidation.valid) return loginValidation;

  const codigoValidation = validarCodigo2FA(params.codigo);
  if (!codigoValidation.valid) return codigoValidation;

  return { valid: true };
}