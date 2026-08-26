import { NextResponse } from "next/server";
import { z } from "zod";
import type { RemoteUpload } from "@/lib/extraction-types";
import {
  pipelineArtifactStore,
  submissionStore,
  submissionUploadStore,
} from "@/lib/submission-store";
import { verifyUploadReceipt } from "@/lib/upload-receipt";
import { remoteUploadSchema } from "@/lib/upload-validation";
import type { SubmissionResult } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  questionPaper: remoteUploadSchema,
  answerSheet: remoteUploadSchema,
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: ["Both valid UploadThing files are required."] }, { status: 400 });
  }

  const uploads = parsed.data as { questionPaper: RemoteUpload; answerSheet: RemoteUpload };
  try {
    if (!verifyUploadReceipt(uploads.questionPaper) || !verifyUploadReceipt(uploads.answerSheet)) {
      return NextResponse.json({ errors: ["One or more upload receipts are invalid."] }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ errors: ["UploadThing is not configured on the server."] }, { status: 503 });
  }

  const id = crypto.randomUUID();
  const submission: SubmissionResult = {
    id,
    stage: "uploading",
    progress: 8,
    stageLabel: "UploadThing files securely received",
  };
  submissionStore.set(id, submission);
  submissionUploadStore.set(id, uploads);
  pipelineArtifactStore.set(id, {});

  return NextResponse.json(submission, { status: 201 });
}
