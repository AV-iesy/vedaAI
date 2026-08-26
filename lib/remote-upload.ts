import type { RemoteUpload, StoredUpload } from "./extraction-types";

const MAX_BYTES: Record<RemoteUpload["mimeType"], number> = {
  "application/pdf": 8 * 1024 * 1024,
  "image/jpeg": 4 * 1024 * 1024,
  "image/png": 4 * 1024 * 1024,
};

export async function downloadUpload(upload: RemoteUpload): Promise<StoredUpload> {
  const url = new URL(upload.url);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".ufs.sh")) {
    throw new Error("The uploaded file URL is not trusted.");
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`UploadThing download failed with status ${response.status}.`);

  const advertisedSize = Number(response.headers.get("content-length") ?? 0);
  const limit = MAX_BYTES[upload.mimeType];
  if (advertisedSize > limit) throw new Error("The uploaded file exceeds its configured limit.");

  const data = Buffer.from(await response.arrayBuffer());
  if (data.byteLength > limit) throw new Error("The uploaded file exceeds its configured limit.");

  return { name: upload.name, mimeType: upload.mimeType, data };
}
