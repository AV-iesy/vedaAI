import type { AnswerRegion, QuestionMapping } from "./types";

export interface StoredUpload {
  name: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  data: Buffer;
}

export interface RemoteUpload {
  key: string;
  name: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  size: number;
  url: string;
  receipt: string;
}

export interface SubmissionUploads {
  questionPaper: RemoteUpload;
  answerSheet: RemoteUpload;
}

export interface ExtractedQuestion {
  displayNumber: string;
  parentNumber?: string;
  questionText: string;
  maxMarks?: number;
}

export interface ExtractedAnswer {
  writtenLabel?: string;
  answerText: string;
  regions: AnswerRegion[];
}

export interface GradingEvaluation {
  question_number: string;
  question_text: string;
  student_answer_text: string;
  page_number: number;
  bounding_box_2d: [number, number, number, number];
  marks_awarded: number;
  max_marks: number;
  feedback: string;
}

export interface GradingResult {
  evaluations: GradingEvaluation[];
  overall_score: number;
  total_marks: number;
}

export interface PipelineArtifacts {
  questions?: ExtractedQuestion[];
  answers?: ExtractedAnswer[];
  mappings?: QuestionMapping[];
  unmatchedAnswers?: Array<{
    id: string;
    text: string;
    regions: AnswerRegion[];
  }>;
}
