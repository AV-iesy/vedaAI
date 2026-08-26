import { NextResponse } from "next/server";
import { submissionStore } from "@/lib/submission-store";
import type { FileKind, SubmissionResult } from "@/lib/types";

const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function validateUpload(value: FormDataEntryValue | null, kind: FileKind) {
  if (!(value instanceof File)) {
    return `${kind === "question_paper" ? "Question paper" : "Answer sheet"} is required.`;
  }

  if (!ACCEPTED_TYPES.has(value.type)) {
    return `${value.name} must be a PDF, JPG, or PNG.`;
  }

  if (value.size > MAX_FILE_SIZE) {
    return `${value.name} exceeds the 20 MB upload limit.`;
  }

  return null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const questionPaper = formData.get("question_paper");
  const answerSheet = formData.get("answer_sheet");
  const errors = [
    validateUpload(questionPaper, "question_paper"),
    validateUpload(answerSheet, "answer_sheet"),
  ].filter(Boolean);

  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const submission: SubmissionResult = {
    id,
    stage: "uploading",
    progress: 8,
    stageLabel: "Files securely received",
  };
  submissionStore.set(id, submission);

  return NextResponse.json(submission, { status: 201 });
}
