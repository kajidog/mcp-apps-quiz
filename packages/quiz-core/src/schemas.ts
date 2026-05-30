import { z } from "zod";

/**
 * 入力バリデーション用の zod スキーマ。
 * MCP ツールの inputSchema と GraphQL リゾルバの双方で共用する。
 */

export const choiceInputSchema = z.object({
  text: z.string().min(1, "選択肢のテキストは必須です"),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z.object({
  text: z.string().min(1, "問題文は必須です"),
  explanation: z.string().nullish(),
  choices: z
    .array(choiceInputSchema)
    .min(2, "選択肢は 2 つ以上必要です")
    .refine((cs) => cs.some((c) => c.isCorrect), "正解の選択肢が 1 つ以上必要です"),
});

export const createQuizInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  tags: z.array(z.string().min(1)).default([]),
  questions: z.array(questionInputSchema).min(1, "設問は 1 つ以上必要です"),
});

export const editQuizInputSchema = z.object({
  quizId: z.string().min(1),
  patch: z.object({
    title: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    favorite: z.boolean().optional(),
    /** 指定された場合、設問群を丸ごと置き換える */
    questions: z.array(questionInputSchema).min(1).optional(),
  }),
});

export const searchQuizzesInputSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favoriteOnly: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(20),
});

export const answerInputSchema = z.object({
  questionId: z.string().min(1),
  choiceIds: z.array(z.string()),
});

export const submitAttemptInputSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(answerInputSchema),
  startedAt: z.string().optional(),
});

export const submitSessionInputSchema = z.object({
  /** まとめて受験するクイズ ID の集合（1 件以上） */
  quizIds: z.array(z.string().min(1)).min(1, "クイズを 1 つ以上選択してください"),
  answers: z.array(answerInputSchema),
  startedAt: z.string().optional(),
  /** セッションの表示名（未指定なら自動生成） */
  title: z.string().optional(),
});

export const presentQuizInputSchema = z
  .object({
    quizId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((v) => v.quizId || (v.tags && v.tags.length > 0), {
    message: "quizId かタグのどちらかを指定してください",
  });

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;
export type EditQuizInput = z.infer<typeof editQuizInputSchema>;
export type SearchQuizzesInput = z.infer<typeof searchQuizzesInputSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptInputSchema>;
export type SubmitSessionInput = z.infer<typeof submitSessionInputSchema>;
export type PresentQuizInput = z.infer<typeof presentQuizInputSchema>;
