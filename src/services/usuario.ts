import { api } from "../api/api";

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
