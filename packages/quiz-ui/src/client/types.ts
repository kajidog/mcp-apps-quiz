import type {
  Attempt,
  AttemptDetail,
  AttemptSummary,
  CreateQuizInput,
  Quiz,
  QuizSummary,
} from "@quiz/core";

export interface SearchArgs {
  query?: string;
  tags?: string[];
  favoriteOnly?: boolean;
}

export interface EditPatch {
  title?: string;
  tags?: string[];
  favorite?: boolean;
  questions?: CreateQuizInput["questions"];
}

export interface AnswerSelection {
  questionId: string;
  choiceIds: string[];
}

/**
 * UI のデータアクセス抽象。MCP App 経路(callServerTool)と
 * ブラウザ経路(GraphQL)の 2 実装が同じインターフェースを満たす。
 */
export interface QuizClient {
  /** この実装の種別（デバッグ表示用） */
  readonly transport: "mcp" | "graphql";
  getQuiz(id: string): Promise<Quiz | null>;
  searchQuizzes(args: SearchArgs): Promise<QuizSummary[]>;
  recentAttempts(limit?: number): Promise<AttemptSummary[]>;
  createQuiz(input: CreateQuizInput): Promise<Quiz>;
  editQuiz(quizId: string, patch: EditPatch): Promise<Quiz | null>;
  toggleFavorite(quizId: string): Promise<Quiz | null>;
  submitAttempt(quizId: string, answers: AnswerSelection[], startedAt?: string): Promise<Attempt>;
  /** 複数クイズをまとめて 1 セッションとして採点・履歴保存する */
  submitSession(
    quizIds: string[],
    answers: AnswerSelection[],
    opts?: { startedAt?: string; title?: string },
  ): Promise<Attempt>;
  /** 履歴 1 件の採点済み詳細を取得する */
  getAttemptDetail(attemptId: string): Promise<AttemptDetail | null>;
  presentQuiz(args: { quizId?: string; tags?: string[] }): Promise<Quiz | null>;
}
