import { api } from "../api/api";
import type { AtivarTwoFactorResponse, TwoFactorPayload } from "../features/login/type";

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

export async function validarTwoFactor(
  payload: TwoFactorPayload,
  signal?: AbortSignal
): Promise<boolean> {
  const res = await api.post("/usuario/confirmar-two-factor", payload, { signal });
  if (typeof res.data === "boolean") return res.data;
  if (res.data && typeof res.data === "object") {
    const anyData = res.data as Record<string, unknown>;
    if (typeof anyData.ok === "boolean") return anyData.ok;
    if (typeof anyData.success === "boolean") return anyData.success;
  }

  return res.status >= 200 && res.status < 300;
}

export async function verificarTwoFactor(
  payload: TwoFactorPayload,
  signal?: AbortSignal
): Promise<boolean> {
  const res = await api.post("/usuario/verificar-two-factor", payload, {
    signal,
  });

  return res.status >= 200 && res.status < 300;
}