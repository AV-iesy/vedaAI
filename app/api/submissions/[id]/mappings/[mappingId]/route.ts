import { NextResponse } from "next/server";
import { z } from "zod";
import { submissionStore } from "@/lib/submission-store";
import type { QuestionMapping } from "@/lib/types";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({
    action: z.literal("remap"),
    sourceType: z.enum(["mapping", "unmatched", "unanswered"]),
    sourceId: z.string().min(1).optional(),
  }),
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; mappingId: string }> },
) {
  const { id, mappingId } = await context.params;
  const submission = submissionStore.get(id);
  if (!submission?.mappings) {
    return NextResponse.json({ error: "Submission or mappings not found." }, { status: 404 });
  }

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mapping action." }, { status: 400 });
  }
  const action = parsed.data;

  const activeIndex = submission.mappings.findIndex((mapping) => mapping.id === mappingId);
  if (activeIndex < 0) {
    return NextResponse.json({ error: "Mapping not found." }, { status: 404 });
  }

  if (action.action === "confirm") {
    const mappings = submission.mappings.map((mapping, index) => (
      index === activeIndex ? { ...mapping, teacherConfirmed: true } : mapping
    ));
    const updated = { ...submission, mappings };
    submissionStore.set(id, updated);
    return NextResponse.json(updated);
  }

  const current = submission.mappings[activeIndex];
  const unmatchedAnswers = [...(submission.unmatchedAnswers ?? [])];
  let candidate: Pick<QuestionMapping, "answerText" | "regions"> | null = null;
  let sourceMappingIndex = -1;
  let sourceUnmatchedIndex = -1;

  if (action.sourceType === "mapping") {
    sourceMappingIndex = submission.mappings.findIndex((mapping) => mapping.id === action.sourceId);
    const source = submission.mappings[sourceMappingIndex];
    if (!source?.answerText) {
      return NextResponse.json({ error: "Selected answer is no longer available." }, { status: 409 });
    }
    candidate = { answerText: source.answerText, regions: source.regions };
  } else if (action.sourceType === "unmatched") {
    sourceUnmatchedIndex = unmatchedAnswers.findIndex((answer) => answer.id === action.sourceId);
    const source = unmatchedAnswers[sourceUnmatchedIndex];
    if (!source) {
      return NextResponse.json({ error: "Selected answer is no longer available." }, { status: 409 });
    }
    candidate = { answerText: source.text, regions: source.regions };
  }

  if (sourceMappingIndex === activeIndex) {
    return NextResponse.json(submission);
  }

  const previousAnswer = current.answerText
    ? { id: `unmatched-${crypto.randomUUID()}`, text: current.answerText, regions: current.regions }
    : null;

  const mappings = submission.mappings.map((mapping, index): QuestionMapping => {
    if (index === activeIndex) {
      return candidate
        ? {
            ...mapping,
            answerText: candidate.answerText,
            regions: candidate.regions,
            status: "matched",
            confidence: 1,
            teacherConfirmed: false,
          }
        : {
            ...mapping,
            answerText: undefined,
            regions: [],
            status: "unanswered",
            confidence: undefined,
            teacherConfirmed: false,
          };
    }
    if (index === sourceMappingIndex) {
      return {
        ...mapping,
        answerText: undefined,
        regions: [],
        status: "unanswered",
        confidence: undefined,
        teacherConfirmed: false,
      };
    }
    return mapping;
  });

  if (sourceUnmatchedIndex >= 0) unmatchedAnswers.splice(sourceUnmatchedIndex, 1);
  if (previousAnswer) unmatchedAnswers.push(previousAnswer);

  const updated = { ...submission, mappings, unmatchedAnswers };
  submissionStore.set(id, updated);
  return NextResponse.json(updated);
}
