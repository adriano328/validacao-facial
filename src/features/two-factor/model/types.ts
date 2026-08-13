export type AtivarTwoFactorResponse = {
  secret: string;
  qrCodeUrl: string;
};

export type TwoFactorPayload = {
  email: string;
  secret?: string;
  code: string;
};

export type VerificarTwoFactorResult = {
  ok: boolean;
};
