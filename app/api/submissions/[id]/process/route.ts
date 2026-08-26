import { NextResponse } from "next/server";
import {
  extractAnswers,
  extractQuestions,
  GeminiConfigurationError,
} from "@/lib/gemini";
import { buildMappings } from "@/lib/mapping";
import { downloadUpload } from "@/lib/remote-upload";
import {
  pipelineArtifactStore,
  submissionStore,
  submissionUploadStore,
} from "@/lib/submission-store";
import type { SubmissionResult } from "@/lib/types";

export const runtime = "nodejs";

function saveStage(id: string, current: SubmissionResult, next: Partial<SubmissionResult>) {
  const result: SubmissionResult = { ...current, ...next };
  submissionStore.set(id, result);
  return result;
}

function processingError(error: unknown) {
  if (error instanceof GeminiConfigurationError) {
    return { message: error.message, status: 503 };
  }

  const detail = error instanceof Error ? error.message : "";
  if (/429|resource_exhausted|quota/iu.test(detail)) {
    return {
      message: "The Gemini free-tier limit is busy or exhausted. Wait a moment, then try again.",
      status: 429,
    };
  }
  if (/api.?key|401|403|permission_denied|unauthenticated/iu.test(detail)) {
    return {
      message: "Gemini rejected the API key. Check GEMINI_API_KEY in .env.local and restart the server.",
      status: 503,
    };
  }

  return {
    message: "Gemini could not process these documents. Try clearer scans or smaller files.",
    status: 502,
  };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const current = submissionStore.get(id);

  if (!current) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  if (current.stage === "done") return NextResponse.json(current);

  const uploads = submissionUploadStore.get(id);
  const artifacts = pipelineArtifactStore.get(id);
  if (!uploads || !artifacts) {
    return NextResponse.json(
      { error: "The temporary upload expired. Please upload the documents again." },
      { status: 410 },
    );
  }

  try {
    switch (current.stage) {
      case "uploading":
        return NextResponse.json(saveStage(id, current, {
          stage: "parsing_pages",
          progress: 24,
          stageLabel: "Documents prepared for Gemini",
        }));

      case "parsing_pages": {
        const questionPaper = await downloadUpload(uploads.questionPaper);
        artifacts.questions = await extractQuestions(questionPaper);
        pipelineArtifactStore.set(id, artifacts);
        return NextResponse.json(saveStage(id, current, {
          stage: "extracting_questions",
          progress: 45,
          stageLabel: `${artifacts.questions.length} questions extracted`,
        }));
      }

      case "extracting_questions": {
        const answerSheet = await downloadUpload(uploads.answerSheet);
        artifacts.answers = await extractAnswers(answerSheet);
        pipelineArtifactStore.set(id, artifacts);
        return NextResponse.json(saveStage(id, current, {
          stage: "extracting_answers",
          progress: 67,
          stageLabel: `${artifacts.answers.length} answer blocks extracted`,
        }));
      }

      case "extracting_answers": {
        if (!artifacts.questions || !artifacts.answers) {
          throw new Error("Pipeline artifacts are incomplete.");
        }
        const mapped = await buildMappings(artifacts.questions, artifacts.answers);
        artifacts.mappings = mapped.mappings;
        artifacts.unmatchedAnswers = mapped.unmatchedAnswers;
        pipelineArtifactStore.set(id, artifacts);
        return NextResponse.json(saveStage(id, current, {
          stage: "mapping",
          progress: 86,
          stageLabel: `${mapped.mappings?.length ?? 0} questions mapped and checked`,
        }));
      }

      case "mapping": {
        if (!artifacts.mappings || !artifacts.unmatchedAnswers) {
          throw new Error("Mapping artifacts are incomplete.");
        }
        const result = saveStage(id, current, {
          stage: "done",
          progress: 100,
          stageLabel: "Assessment ready to review",
          mappings: artifacts.mappings,
          unmatchedAnswers: artifacts.unmatchedAnswers,
        });
        submissionUploadStore.delete(id);
        pipelineArtifactStore.delete(id);
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    const response = processingError(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
