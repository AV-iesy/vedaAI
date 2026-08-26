import { NextResponse } from "next/server";
import { completeDemoSubmission } from "@/lib/demo-data";
import { submissionStore } from "@/lib/submission-store";
import type { ProcessingStage, SubmissionResult } from "@/lib/types";

const PIPELINE: Array<Pick<SubmissionResult, "stage" | "progress" | "stageLabel">> = [
  { stage: "parsing_pages", progress: 24, stageLabel: "Pages parsed and normalized" },
  { stage: "extracting_questions", progress: 45, stageLabel: "Questions extracted" },
  { stage: "extracting_answers", progress: 67, stageLabel: "Answer blocks extracted" },
  { stage: "mapping", progress: 86, stageLabel: "Answers mapped by label and meaning" },
];

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const current = submissionStore.get(id);

  if (!current) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  if (current.stage === "done") {
    return NextResponse.json(current);
  }

  const currentIndex = PIPELINE.findIndex((item) => item.stage === current.stage);
  const next = PIPELINE[currentIndex + 1] ?? PIPELINE[0];
  const result: SubmissionResult =
    next.stage === "mapping"
      ? completeDemoSubmission(id)
      : { ...current, ...next, stage: next.stage as ProcessingStage };

  submissionStore.set(id, result);
  return NextResponse.json(result);
}
