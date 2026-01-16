import { api } from "../api/api";
import type { AtivarTwoFactorResponse } from "../features/login/type";

export async function twoFactorAtivado(
  payload: { email: string; password: string },
  signal?: AbortSignal
): Promise<boolean> {
  const response = await api.request<boolean>({
    method: "POST",
    url: "/usuario/two-factor-ativado",
    data: payload,  
    signal,
  });

  return response.data; // true | false
}

export async function ativarTwoFactor(
  signal?: AbortSignal
): Promise<AtivarTwoFactorResponse> {
  const response = await api.get<AtivarTwoFactorResponse>(
    "/usuario/ativar-two-factor",
    { signal }
  );

  return response.data;
}