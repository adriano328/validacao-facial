export function isRequestCanceled(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  const requestError = error as { code?: unknown; name?: unknown };

  return (
    requestError?.code === "ERR_CANCELED" ||
    requestError?.name === "CanceledError"
  );
}
