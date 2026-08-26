export type FileKind = "question_paper" | "answer_sheet";

export type ProcessingStage =
  | "uploading"
  | "parsing_pages"
  | "extracting_questions"
  | "extracting_answers"
  | "mapping"
  | "done";

export type MappingStatus = "matched" | "low_confidence" | "unanswered";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnswerRegion {
  page: number;
  bbox: BoundingBox;
}

export interface QuestionMapping {
  id: string;
  displayNumber: string;
  parentNumber?: string;
  questionText: string;
  maxMarks?: number;
  status: MappingStatus;
  confidence?: number;
  answerText?: string;
  regions: AnswerRegion[];
  teacherConfirmed?: boolean;
}

export interface SubmissionResult {
  id: string;
  stage: ProcessingStage;
  progress: number;
  stageLabel: string;
  mappings?: QuestionMapping[];
  unmatchedAnswers?: Array<{
    id: string;
    text: string;
    regions: AnswerRegion[];
  }>;
}
