import { NextResponse } from "next/server";
import { z } from "zod";
import type { RemoteUpload } from "@/lib/extraction-types";
import {
  GeminiConfigurationError,
  geminiModel,
  gradeAssessment,
} from "@/lib/gemini";
import { downloadUpload } from "@/lib/remote-upload";
import { verifyUploadReceipt } from "@/lib/upload-receipt";
import { remoteUploadSchema } from "@/lib/upload-validation";

export const runtime = "nodejs";

const requestSchema = z.object({
  questionPaper: remoteUploadSchema,
  answerSheet: remoteUploadSchema,
});

function safeError(error: unknown) {
  if (error instanceof GeminiConfigurationError) {
    return { status: 503, message: error.message };
  }

  const detail = error instanceof Error ? error.message : "";
  if (/429|resource_exhausted|quota/iu.test(detail)) {
    return { status: 429, message: "The Gemini free-tier limit is busy or exhausted. Try again shortly." };
  }
  if (/api.?key|401|403|permission_denied|unauthenticated/iu.test(detail)) {
    return { status: 503, message: "Gemini rejected the configured API key." };
  }

  return { status: 502, message: "The documents could not be graded. Try clearer scans." };
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid question paper and answer sheet are required." },
      { status: 400 },
    );
  }

  const uploads = parsed.data as { questionPaper: RemoteUpload; answerSheet: RemoteUpload };

  try {
    if (!verifyUploadReceipt(uploads.questionPaper) || !verifyUploadReceipt(uploads.answerSheet)) {
      return NextResponse.json({ error: "One or more upload receipts are invalid." }, { status: 400 });
    }

    const [questionPaper, answerSheet] = await Promise.all([
      downloadUpload(uploads.questionPaper),
      downloadUpload(uploads.answerSheet),
    ]);
    const data = await gradeAssessment(questionPaper, answerSheet);

    return NextResponse.json({ success: true, model: geminiModel, data });
  } catch (error) {
    const response = safeError(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
