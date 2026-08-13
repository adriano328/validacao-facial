import { api } from "@shared/api/client";
import type {
  AtivarTwoFactorResponse,
  TwoFactorPayload,
  VerificarTwoFactorResult,
} from "@features/two-factor/model/types";

function getBooleanResult(data: unknown): boolean | undefined {
  if (typeof data === "boolean") return data;

  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;

  if (typeof record.ok === "boolean") return record.ok;
  if (typeof record.success === "boolean") return record.success;
  if (typeof record.valido === "boolean") return record.valido;

  return undefined;
}

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

  return response.data;
}

export async function ativarTwoFactor(
  email?: string,
  signal?: AbortSignal
): Promise<AtivarTwoFactorResponse> {
  const response = await api.get<AtivarTwoFactorResponse>(
    "/usuario/ativar-two-factor",
    {
      params: email ? { email } : undefined,
      signal,
    }
  );

  return response.data;
}

export async function validarTwoFactor(
  payload: TwoFactorPayload,
  signal?: AbortSignal
): Promise<boolean> {
  const res = await api.post("/usuario/confirmar-two-factor", payload, {
    signal,
  });

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
): Promise<VerificarTwoFactorResult> {
  const res = await api.post("/usuario/verificar-two-factor", payload, {
    signal,
  });

  return {
    ok: getBooleanResult(res.data) ?? (res.status >= 200 && res.status < 300),
  };
}
