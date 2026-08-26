import type { QuestionMapping, SubmissionResult } from "./types";

export const demoMappings: QuestionMapping[] = [
  {
    id: "q1",
    displayNumber: "1",
    questionText: "Define photosynthesis and write its chemical equation.",
    maxMarks: 3,
    status: "matched",
    confidence: 0.98,
    answerText:
      "Photosynthesis is the process by which green plants use sunlight to prepare food from carbon dioxide and water. 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.",
    regions: [{ page: 1, bbox: { x: 0.09, y: 0.13, width: 0.82, height: 0.2 } }],
  },
  {
    id: "q2a",
    displayNumber: "2(a)",
    parentNumber: "2",
    questionText: "Explain the role of chlorophyll.",
    maxMarks: 2,
    status: "low_confidence",
    confidence: 0.64,
    answerText: "Chlorophyll absorbs light energy from the sun for the plant.",
    regions: [{ page: 1, bbox: { x: 0.09, y: 0.39, width: 0.82, height: 0.13 } }],
  },
  {
    id: "q2b",
    displayNumber: "2(b)",
    parentNumber: "2",
    questionText: "Name two products of photosynthesis.",
    maxMarks: 2,
    status: "matched",
    confidence: 0.93,
    answerText: "Glucose and oxygen.",
    regions: [{ page: 2, bbox: { x: 0.09, y: 0.15, width: 0.82, height: 0.11 } }],
  },
  {
    id: "q3",
    displayNumber: "3",
    questionText: "Describe one experiment that demonstrates phototropism.",
    maxMarks: 5,
    status: "unanswered",
    regions: [],
  },
  {
    id: "q4",
    displayNumber: "4",
    questionText: "Compare aerobic and anaerobic respiration.",
    maxMarks: 4,
    status: "matched",
    confidence: 0.89,
    answerText:
      "Aerobic respiration uses oxygen and releases more energy. Anaerobic respiration happens without oxygen and releases less energy. Continued on the next page.",
    regions: [
      { page: 1, bbox: { x: 0.09, y: 0.61, width: 0.82, height: 0.22 } },
      { page: 2, bbox: { x: 0.09, y: 0.34, width: 0.82, height: 0.18 } },
    ],
  },
];

export function completeDemoSubmission(id: string): SubmissionResult {
  return {
    id,
    stage: "done",
    progress: 100,
    stageLabel: "Ready for review",
    mappings: demoMappings,
    unmatchedAnswers: [
      {
        id: "unmatched-1",
        text: "Rough calculation: 6 × 12 = 72",
        regions: [{ page: 2, bbox: { x: 0.53, y: 0.72, width: 0.35, height: 0.09 } }],
      },
    ],
  };
}
