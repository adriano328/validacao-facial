export type LoginForm = {
  email: string;
  password: string;
};

export const initialLoginForm: LoginForm = {
  email: "alefepdias@gmail.com",
  password: "alefek159",
};

export type AtivarTwoFactorResponse = {
  secret: string;
  qrCodeUrl: string;
};