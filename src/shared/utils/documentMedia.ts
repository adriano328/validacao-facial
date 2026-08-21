export const PDF_CONTENT_TYPE = "application/pdf";

function getDataUriPayload(value: string) {
  const commaIndex = value.indexOf(",");
  return commaIndex >= 0 ? value.slice(commaIndex + 1).trim() : value;
}

export function isPdfDocument(value?: string | null, contentType?: string | null) {
  const normalizedContentType = (contentType ?? "").toLowerCase();
  const documentValue = (value ?? "").trim().toLowerCase();
  const documentPayload = getDataUriPayload(documentValue);

  return (
    normalizedContentType === PDF_CONTENT_TYPE ||
    documentValue.startsWith("data:application/pdf") ||
    /\.pdf(?:\?|#|$)/i.test(documentValue) ||
    documentPayload.startsWith("jvberi0")
  );
}

export function getDocumentMediaSrc(value?: string | null, contentType?: string | null) {
  const documentValue = (value ?? "").trim();
  if (!documentValue) return null;

  const normalizedContentType = (contentType ?? "").toLowerCase();

  if (isPdfDocument(documentValue, contentType)) {
    if (/^https?:\/\//i.test(documentValue) || documentValue.startsWith(`data:${PDF_CONTENT_TYPE}`)) {
      return documentValue;
    }

    return `data:${PDF_CONTENT_TYPE};base64,${getDataUriPayload(documentValue)}`;
  }

  if (/^https?:\/\//i.test(documentValue) || documentValue.startsWith("data:")) {
    return documentValue;
  }

  if (normalizedContentType.startsWith("image/")) {
    return `data:${normalizedContentType};base64,${documentValue}`;
  }

  return `data:image/jpeg;base64,${documentValue}`;
}

export function getDocumentFileLabel(value?: string | null) {
  const documentValue = (value ?? "").trim();
  if (!documentValue) return "Documento PDF";

  try {
    const url = new URL(documentValue);
    const fileName = url.pathname.split("/").filter(Boolean).pop();
    return fileName || "Documento PDF";
  } catch {
    return "Documento PDF";
  }
}
