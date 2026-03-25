export type ValidarTwoFactorRequest = {
  secret: string;
  code: number;
  email: string;
  senha: string;
};

export type ValidarTwoFactorResponse = boolean;