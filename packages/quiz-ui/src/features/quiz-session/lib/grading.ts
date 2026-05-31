import type { AnswerSelection } from "@/shared/api";
import type { Attempt, Question, QuestionResult } from "@quiz/core";

/** 設問 ID → 選択中の選択肢 ID 集合 */
export type Selections = Record<string, Set<string>>;

/** 選択肢の選択状態をトグルした新しい selections を返す（純粋）。 */
export function toggleChoice(
  selections: Selections,
  questionId: string,
  choiceId: string,
): Selections {
  const next = new Set(selections[questionId] ?? []);
  if (next.has(choiceId)) next.delete(choiceId);
  else next.add(choiceId);
  return { ...selections, [questionId]: next };
}

/** 設問配列と選択状態から、サーバへ送る解答配列を組み立てる。 */
export function toAnswers(questions: Question[], selections: Selections): AnswerSelection[] {
  return questions.map((q) => ({
    questionId: q.id,
    choiceIds: [...(selections[q.id] ?? [])],
  }));
}

/** 採点結果を設問 ID で引ける Map に変換する。 */
export function buildResultMap(attempt: Attempt): Map<string, QuestionResult> {
  return new Map(attempt.results.map((r) => [r.questionId, r]));
}

/** 1問でも選択がある設問の数（回答済み数）。 */
export function countAnswered(questions: Question[], selections: Selections): number {
  return questions.filter((q) => (selections[q.id]?.size ?? 0) > 0).length;
}
