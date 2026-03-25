export type LoginRequest = {
  email: string;
  senha: string;
  idSessaoLiveness?: string;
  twoFactorCode?: number;
};

export type LoginResponse = {
  token?: string;
  qrCode?: string;
  secret?: string;
  twoFactorEnabled?: boolean;
  nomeCompleto?: string;
  funcao?: string;
  locaisSetores?: string[];
  raw?: unknown;
};