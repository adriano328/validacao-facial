import { api } from "../../../api/api";
import type { ValidarTwoFactorRequest, ValidarTwoFactorResponse } from "../model/two-factor.types";


export async function validarTwoFactor(
  payload: ValidarTwoFactorRequest,
  signal?: AbortSignal
): Promise<ValidarTwoFactorResponse> {
  const { data } = await api.post<ValidarTwoFactorResponse>(
    "/usuario/confirmar-two-factor",
    payload,
    { signal }
  );

  return data;
}