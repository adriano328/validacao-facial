export type LoginFormValues = {
  email: string;
  password: string;
};

export const initialLoginFormValues: LoginFormValues = {
  email: '',
  password: '',
};

export type LoginPayload = {
  email: string;
  senha: string;
  idSessaoLiveness: string;
  twoFactorCode?: number | null;
};

export type ActivateTwoFactorResponse = {
  secret: string;
  qrCodeUrl: string;
};

export type TwoFactorPayload = {
  email: string;
  secret?: string;
  code: string;
  senha: string;
};

export type LoginErrors = Partial<Record<keyof LoginFormValues, string>>;