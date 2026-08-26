import { z } from "zod";

export const remoteUploadSchema = z.object({
  key: z.string().min(1).max(500),
  name: z.string().min(1).max(500),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  size: z.number().int().positive().max(8 * 1024 * 1024),
  url: z.string().url(),
  receipt: z.string().regex(/^[a-f0-9]{64}$/u),
}).superRefine((upload, context) => {
  if (upload.mimeType !== "application/pdf" && upload.size > 4 * 1024 * 1024) {
    context.addIssue({ code: "custom", message: "Images cannot exceed 4 MB." });
  }
});
