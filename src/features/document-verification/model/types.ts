export type DocumentType = "CNH" | "RG";
export type DocumentSide = "front" | "back";

export type PresignRequest = {
  documentType: DocumentType;
  side: DocumentSide;
  mimeType: string;
};

export type PresignResponse = {
  uploadUrl: string;
  s3Key: string;
};

export type VerifyRequest = {
  documentType: DocumentType;
  s3Keys: Partial<Record<DocumentSide, string>>;
};

export type VerifyStatus = "APPROVED" | "REVIEW" | "REJECTED";

export type VerifyResponse = {
  status: VerifyStatus;
  reasons: string[];
  extractedFields?: Record<string, string>;
  similarity?: number;
};
