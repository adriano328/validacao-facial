import { api } from "../api/api";
import type { AtivarTwoFactorResponse, ValidarTwoFactorPayload } from "../features/login/type";

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
  payload: ValidarTwoFactorPayload,
  signal?: AbortSignal
): Promise<boolean> {
  const res = await api.post("/usuario/confirmar-two-factor", payload, { signal });

  // Caso o backend retorne boolean no body
  if (typeof res.data === "boolean") return res.data;

  // Caso retorne { ok: true } ou { success: true } (se um dia mudarem)
  if (res.data && typeof res.data === "object") {
    const anyData = res.data as Record<string, unknown>;
    if (typeof anyData.ok === "boolean") return anyData.ok;
    if (typeof anyData.success === "boolean") return anyData.success;
  }

  // Seu caso atual: 201 com body vazio -> sucesso se status 2xx
  return res.status >= 200 && res.status < 300;
}