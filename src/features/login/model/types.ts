export type LoginForm = {
  email: string;
  password: string;
};

export const initialLoginForm: LoginForm = {
  email: "",
  password: "",
};

export type AtivarTwoFactorResponse = {
  secret: string;
  qrCodeUrl: string;
};

export type TwoFactorPayload = {
  email: string;
  secret?: string;
  code: string; // 6 dígitos
};
