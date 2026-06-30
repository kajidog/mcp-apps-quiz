import type { CreateQuizInput, Quiz } from "@quiz/core";

export interface ChoiceDraft {
  /** 並び替え時の安定 key 用クライアント ID（保存ペイロードには含めない）。 */
  id?: string;
  text: string;
  isCorrect: boolean;
}
export interface QuestionDraft {
  /** 並び替え時の安定 key 用クライアント ID（保存ペイロードには含めない）。 */
  id?: string;
  text: string;
  explanation: string;
  choices: ChoiceDraft[];
}

/** クライアント側の一時 ID を生成（並び替えの React key に使う）。 */
function draftId(): string {
  return crypto.randomUUID();
}

export function emptyChoice(): ChoiceDraft {
  return { id: draftId(), text: "", isCorrect: false };
}
export function emptyQuestion(): QuestionDraft {
  return { id: draftId(), text: "", explanation: "", choices: [emptyChoice(), emptyChoice()] };
}

/** 既存クイズを編集用ドラフトに変換 */
export function toDraft(quiz: Quiz): QuestionDraft[] {
  return quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    explanation: q.explanation ?? "",
    choices: q.choices.map((c) => ({ id: c.id, text: c.text, isCorrect: c.isCorrect })),
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

export interface ValidationMessages {
  titleRequired: () => string;
  questionsRequired: () => string;
  questionTextRequired: (number: number) => string;
  choicesRequired: (number: number) => string;
  correctChoiceRequired: (number: number) => string;
}

const jaValidationMessages: ValidationMessages = {
  titleRequired: () => "タイトルを入力してください。",
  questionsRequired: () => "設問は 1 つ以上必要です。",
  questionTextRequired: (number) => `Q${number}: 問題文を入力してください。`,
  choicesRequired: (number) => `Q${number}: 選択肢は 2 つ以上必要です。`,
  correctChoiceRequired: (number) => `Q${number}: 正解の選択肢を 1 つ以上選んでください。`,
};

/**
 * 整形済みの内容を事前検証する（サーバ側 zod でも検証されるが、分かりやすいメッセージのため）。
 * 問題なければ null、あれば UI 表示用のエラーメッセージを返す。
 */
export function validateBuiltQuiz(
  title: string,
  questions: CreateQuizInput["questions"],
  messages: ValidationMessages = jaValidationMessages,
): string | null {
  if (!title.trim()) return messages.titleRequired();
  if (questions.length === 0) return messages.questionsRequired();
  for (const [i, q] of questions.entries()) {
    const number = i + 1;
    if (!q.text) return messages.questionTextRequired(number);
    if (q.choices.length < 2) return messages.choicesRequired(number);
    if (!q.choices.some((c) => c.isCorrect)) {
      return messages.correctChoiceRequired(number);
    }
  }
  return null;
}
