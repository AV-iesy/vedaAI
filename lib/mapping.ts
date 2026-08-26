import type { ExtractedAnswer, ExtractedQuestion } from "./extraction-types";
import { mapSemantically } from "./gemini";
import type { QuestionMapping, SubmissionResult } from "./types";

const REVIEW_THRESHOLD = 0.72;

function normalizeLabel(label?: string) {
  return (label ?? "")
    .trim()
    .toLowerCase()
    .replace(/^question\s*/u, "")
    .replace(/^q(?:uestion)?[.:\s-]*/u, "")
    .replace(/[^a-z0-9]/gu, "");
}

function safeConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}

export async function buildMappings(
  questions: ExtractedQuestion[],
  answers: ExtractedAnswer[],
): Promise<Pick<SubmissionResult, "mappings" | "unmatchedAnswers">> {
  const pairByQuestion = new Map<number, { answerIndex: number; confidence: number }>();
  const usedAnswers = new Set<number>();

  for (const [questionIndex, question] of questions.entries()) {
    const questionLabel = normalizeLabel(question.displayNumber);
    if (!questionLabel) continue;

    const candidates = answers
      .map((answer, answerIndex) => ({ answer, answerIndex }))
      .filter(({ answer, answerIndex }) => (
        !usedAnswers.has(answerIndex)
        && normalizeLabel(answer.writtenLabel) === questionLabel
      ));

    if (candidates.length === 1) {
      const answerIndex = candidates[0].answerIndex;
      pairByQuestion.set(questionIndex, { answerIndex, confidence: 0.99 });
      usedAnswers.add(answerIndex);
    }
  }

  const remainingQuestionIndexes = questions
    .map((_, index) => index)
    .filter((index) => !pairByQuestion.has(index));
  const remainingAnswerIndexes = answers
    .map((_, index) => index)
    .filter((index) => !usedAnswers.has(index));

  const semanticMatches = await mapSemantically(
    remainingQuestionIndexes.map((index) => questions[index]),
    remainingAnswerIndexes.map((index) => answers[index]),
  );

  const usedSemanticQuestions = new Set<number>();
  const usedSemanticAnswers = new Set<number>();

  for (const match of semanticMatches.sort((a, b) => b.confidence - a.confidence)) {
    const questionIndex = remainingQuestionIndexes[match.questionIndex];
    const answerIndex = remainingAnswerIndexes[match.answerIndex];
    if (
      questionIndex == null
      || answerIndex == null
      || usedSemanticQuestions.has(questionIndex)
      || usedSemanticAnswers.has(answerIndex)
      || pairByQuestion.has(questionIndex)
      || usedAnswers.has(answerIndex)
    ) {
      continue;
    }

    const confidence = safeConfidence(match.confidence);
    if (confidence < 0.45) continue;

    pairByQuestion.set(questionIndex, { answerIndex, confidence });
    usedAnswers.add(answerIndex);
    usedSemanticQuestions.add(questionIndex);
    usedSemanticAnswers.add(answerIndex);
  }

  const mappings: QuestionMapping[] = questions.map((question, questionIndex) => {
    const pair = pairByQuestion.get(questionIndex);
    if (!pair) {
      return {
        id: `question-${questionIndex + 1}`,
        ...question,
        status: "unanswered",
        regions: [],
      };
    }

    const answer = answers[pair.answerIndex];
    return {
      id: `question-${questionIndex + 1}`,
      ...question,
      status: pair.confidence >= REVIEW_THRESHOLD ? "matched" : "low_confidence",
      confidence: pair.confidence,
      answerText: answer.answerText,
      regions: answer.regions,
    };
  });

  const unmatchedAnswers = answers
    .map((answer, index) => ({ answer, index }))
    .filter(({ index }) => !usedAnswers.has(index))
    .map(({ answer, index }) => ({
      id: `unmatched-${index + 1}`,
      text: answer.answerText,
      regions: answer.regions,
    }));

  return { mappings, unmatchedAnswers };
}
