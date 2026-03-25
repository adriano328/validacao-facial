export type TwoFactorCodeState = {
  email?: string;
  senha?: string;
  idSessaoLiveness?: string;
};

export type LoginWithTwoFactorCodeParams = {
  email: string;
  senha: string;
  idSessaoLiveness: string;
  twoFactorCode: number;
};