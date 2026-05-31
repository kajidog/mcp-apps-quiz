import type { AttemptDetail, Question, QuestionResult } from "@quiz/core";

export interface AttemptPlayModel {
  questions: Question[];
  selections: Record<string, Set<string>>;
  resultByQuestion: Map<string, QuestionResult>;
  /** 編集・削除により設問を復元できなかった解答の数 */
  missingCount: number;
}

/**
 * AttemptDetail を QuizPlay が扱える形（設問配列 + 選択状態 + 採点結果）へ変換する（純粋）。
 * 設問が復元できない解答は missingCount に数え、表示からは除外する。
 */
export function toAttemptPlayModel(detail: AttemptDetail | null | undefined): AttemptPlayModel {
  const questions: Question[] = [];
  const selections: Record<string, Set<string>> = {};
  const resultByQuestion = new Map<string, QuestionResult>();
  let missingCount = 0;

  for (const a of detail?.answers ?? []) {
    if (!a.question) {
      missingCount++;
      continue;
    }
    questions.push(a.question);
    selections[a.question.id] = new Set(a.selectedChoiceIds);
    resultByQuestion.set(a.question.id, {
      questionId: a.question.id,
      selectedChoiceIds: a.selectedChoiceIds,
      correctChoiceIds: a.correctChoiceIds,
      isCorrect: a.isCorrect,
    });
  }

  return { questions, selections, resultByQuestion, missingCount };
}
