import type { QuizSummary } from "@quiz/core";

export interface QuizFilter {
  favoriteOnly: boolean;
  minQuestions: number;
  activeTags: Set<string>;
}

/** 全クイズに出現するタグをソートして返す（絞り込みチップ用）。 */
export function collectTags(quizzes: QuizSummary[]): string[] {
  return [...new Set(quizzes.flatMap((q) => q.tags))].sort();
}

/** 絞り込み条件に一致するクイズを返す（純粋）。 */
export function filterQuizzes(quizzes: QuizSummary[], filter: QuizFilter): QuizSummary[] {
  return quizzes.filter((q) => {
    if (filter.favoriteOnly && !q.favorite) return false;
    if (q.questionCount < filter.minQuestions) return false;
    if (filter.activeTags.size > 0 && !q.tags.some((t) => filter.activeTags.has(t))) return false;
    return true;
  });
}

/** クイズ群の合計問題数。 */
export function totalQuestions(quizzes: QuizSummary[]): number {
  return quizzes.reduce((sum, q) => sum + q.questionCount, 0);
}
