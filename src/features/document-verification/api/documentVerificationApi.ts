import { api } from "@shared/api/client";
import type {
  PresignRequest,
  PresignResponse,
  VerifyRequest,
  VerifyResponse,
} from "@features/document-verification/model/types";

export async function criarPresignedUpload(
  payload: PresignRequest,
  signal?: AbortSignal
): Promise<PresignResponse> {
  const { data } = await api.post<PresignResponse>(
    "/documents/presign",
    payload,
    { signal }
  );

  return data;
}

export async function uploadDocumentoS3(
  uploadUrl: string,
  file: File,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Erro no upload S3 (${res.status})`);
  }
}

export async function verificarDocumento(
  payload: VerifyRequest,
  signal?: AbortSignal
): Promise<VerifyResponse> {
  const { data } = await api.post<VerifyResponse>(
    "/documents/verify",
    payload,
    { signal }
  );

  return data;
}
