/**
 * ドメイン型。UI・トランスポート・永続化に依存しない、クイズの中核モデル。
 * MCP ツール経路・GraphQL 経路の双方がこの型を受け渡しする。
 */

export interface Choice {
  id: string;
  /** 選択肢の表示順 (0 始まり) */
  order: number;
  text: string;
  /** 正解フラグ。1 問に複数の正解を許す（複数選択問題） */
  isCorrect: boolean;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  explanation: string | null;
  choices: Choice[];
}

export interface Quiz {
  id: string;
  title: string;
  tags: string[];
  favorite: boolean;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

/** 検索結果などで使う、設問を含まない軽量サマリ */
export interface QuizSummary {
  id: string;
  title: string;
  tags: string[];
  favorite: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 1 設問に対する回答 (選択した選択肢 ID の集合) */
export interface AnswerInput {
  questionId: string;
  choiceIds: string[];
}

/** 採点済みの 1 設問の結果 */
export interface QuestionResult {
  questionId: string;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
  isCorrect: boolean;
}

/** 受験 1 回分の履歴 + 採点結果 */
export interface Attempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  results: QuestionResult[];
  startedAt: string;
  finishedAt: string;
}

/** 受験履歴の一覧表示用サマリ */
export interface AttemptSummary {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  finishedAt: string;
}

/** 履歴詳細の 1 設問分（出題時の設問内容 + 自分の解答 + 正誤）。 */
export interface AttemptAnswerDetail {
  /** 設問本体。編集等で削除済みの場合は null。 */
  question: Question | null;
  /** 設問 ID（question が null でも参照のため残す） */
  questionId: string;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
  isCorrect: boolean;
}

/** 受験 1 回分の採点済み詳細（履歴から内容を見るための表示用）。 */
export interface AttemptDetail {
  id: string;
  /** 表示名。複数クイズをまとめたセッションはまとめ名、単一は元クイズ名。 */
  title: string;
  score: number;
  total: number;
  startedAt: string;
  finishedAt: string;
  answers: AttemptAnswerDetail[];
}
