import { createHmac, timingSafeEqual } from "node:crypto";
import type { RemoteUpload } from "./extraction-types";

export type ReceiptUpload = Omit<RemoteUpload, "receipt">;

function receiptPayload(upload: ReceiptUpload) {
  return [upload.key, upload.name, upload.mimeType, upload.size, upload.url].join("\n");
}

function signingSecret() {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) throw new Error("UPLOADTHING_TOKEN is not configured.");
  return token;
}

export function signUploadReceipt(upload: ReceiptUpload) {
  return createHmac("sha256", signingSecret()).update(receiptPayload(upload)).digest("hex");
}

export function verifyUploadReceipt(upload: RemoteUpload) {
  const expected = Buffer.from(signUploadReceipt(upload), "hex");
  const actual = Buffer.from(upload.receipt, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
