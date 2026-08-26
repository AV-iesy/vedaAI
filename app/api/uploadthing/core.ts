import { createUploadthing, type FileRouter } from "uploadthing/next";
import { signUploadReceipt } from "@/lib/upload-receipt";

const f = createUploadthing();

export const ourFileRouter = {
  paperUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 5 },
  }).onUploadComplete(async ({ file }) => {
    const upload = {
      key: file.key,
      name: file.name,
      mimeType: file.type as "application/pdf" | "image/jpeg" | "image/png",
      size: file.size,
      url: file.ufsUrl,
    };

    return { ...upload, receipt: signUploadReceipt(upload) };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
