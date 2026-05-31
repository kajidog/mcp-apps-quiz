import type { CreateQuizInput, Quiz } from "@quiz/core";

export interface ChoiceDraft {
  text: string;
  isCorrect: boolean;
}
export interface QuestionDraft {
  text: string;
  explanation: string;
  choices: ChoiceDraft[];
}

export function emptyChoice(): ChoiceDraft {
  return { text: "", isCorrect: false };
}
export function emptyQuestion(): QuestionDraft {
  return { text: "", explanation: "", choices: [emptyChoice(), emptyChoice()] };
}

/** 既存クイズを編集用ドラフトに変換 */
export function toDraft(quiz: Quiz): QuestionDraft[] {
  return quiz.questions.map((q) => ({
    text: q.text,
    explanation: q.explanation ?? "",
    choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
  }));
}

/** カンマ区切りのタグ文字列を正規化（空要素除去・トリム）。 */
export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** ドラフトを CreateQuizInput["questions"] に整形（空欄除去・解説の任意化）。 */
export function buildQuestions(drafts: QuestionDraft[]): CreateQuizInput["questions"] {
  return drafts.map((q) => ({
    text: q.text.trim(),
    explanation: q.explanation.trim() || undefined,
    choices: q.choices
      .filter((c) => c.text.trim())
      .map((c) => ({ text: c.text.trim(), isCorrect: c.isCorrect })),
  }));
}

/**
 * 整形済みの内容を事前検証する（サーバ側 zod でも検証されるが、分かりやすいメッセージのため）。
 * 問題なければ null、あれば日本語のエラーメッセージを返す。
 */
export function validateBuiltQuiz(
  title: string,
  questions: CreateQuizInput["questions"],
): string | null {
  if (!title.trim()) return "タイトルを入力してください。";
  if (questions.length === 0) return "設問は 1 つ以上必要です。";
  for (const [i, q] of questions.entries()) {
    if (!q.text) return `Q${i + 1}: 問題文を入力してください。`;
    if (q.choices.length < 2) return `Q${i + 1}: 選択肢は 2 つ以上必要です。`;
    if (!q.choices.some((c) => c.isCorrect)) {
      return `Q${i + 1}: 正解の選択肢を 1 つ以上選んでください。`;
    }
  }
  return null;
}
