export function getLivenessErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "state" in error
  ) {
    const err = error as { state?: string };

    if (err.state === "MOBILE_LANDSCAPE_ERROR") {
      return "Use o celular na vertical.";
    }

    if (err.state === "CAMERA_ACCESS_ERROR") {
      return "Não foi possível acessar a câmera.";
    }
  }

  return "Erro na validação facial. Tente novamente.";
}