import type { Attempt, AttemptDetail, AttemptSummary, Quiz, QuizSummary } from "@quiz/core";

/** 設問への解答（選択した選択肢 ID 群）。受験系の feature で共有する。 */
export interface AnswerSelection {
  questionId: string;
  choiceIds: string[];
}

/**
 * MCP ホストがツール（quiz_present 等）を呼んだ際に UI へ届く初期ペイロード。
 * サーバのツール結果 structuredContent と同じ形。
 */
export type ToolPayload =
  | { kind: "quiz"; quiz: Quiz }
  | { kind: "list"; quizzes: QuizSummary[] }
  | { kind: "history"; attempts: AttemptSummary[] }
  | { kind: "attempt"; attempt: Attempt }
  | { kind: "attemptDetail"; detail: AttemptDetail }
  | { kind: "deleted"; quizId: string }
  | { kind: "error"; message: string };
