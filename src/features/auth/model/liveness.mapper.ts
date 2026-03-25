import type { CriarSessaoLivenessResponse } from "../api/liveness";

export function mapCriarSessaoToSessionId(
  response: CriarSessaoLivenessResponse,
): string {
  return response.sessionId ?? response.idSessao;
}