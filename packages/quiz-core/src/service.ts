import { randomUUID } from "node:crypto";
import type {
  Attempt,
  AttemptDetail,
  AttemptSummary,
  Question,
  QuestionResult,
  Quiz,
  QuizSummary,
} from "./domain.js";
import type { QuizRepository } from "./repository.js";
import {
  createQuizInputSchema,
  editQuizInputSchema,
  presentQuizInputSchema,
  searchQuizzesInputSchema,
  submitAttemptInputSchema,
  submitSessionInputSchema,
} from "./schemas.js";

/** 設問群を採点する。部分点なし: 正解集合と選択集合が完全一致したときのみ正答。 */
function scoreQuestions(questions: Question[], answerMap: Map<string, string[]>): QuestionResult[] {
  return questions.map((q) => {
    const selected = new Set(answerMap.get(q.id) ?? []);
    const correctChoiceIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id);
    const correct = new Set(correctChoiceIds);
    const isCorrect =
      selected.size === correct.size && [...selected].every((id) => correct.has(id));
    return { questionId: q.id, selectedChoiceIds: [...selected], correctChoiceIds, isCorrect };
  });
}

/**
 * クイズ操作のユースケースを束ねるサービス層。
 * 採点ロジックを担い、入力は zod で検証する。
 * MCP ツール・GraphQL リゾルバの双方がこの層だけを呼ぶ（唯一の真実）。
 */
export class QuizService {
  constructor(private readonly repo: QuizRepository) {}

  createQuiz(input: unknown): Quiz {
    const parsed = createQuizInputSchema.parse(input);
    return this.repo.createQuiz(parsed);
  }

  getQuiz(id: string): Quiz | null {
    return this.repo.getQuiz(id);
  }

  /** ID もしくはタグからクイズを 1 件解決して出題する */
  presentQuiz(input: unknown): Quiz | null {
    const parsed = presentQuizInputSchema.parse(input);
    if (parsed.quizId) return this.repo.getQuiz(parsed.quizId);
    const ids = this.repo.findQuizIdsByTags(parsed.tags ?? []);
    if (ids.length === 0) return null;
    const pick = ids[Math.floor(Math.random() * ids.length)]!;
    return this.repo.getQuiz(pick);
  }

  searchQuizzes(input: unknown): QuizSummary[] {
    const parsed = searchQuizzesInputSchema.parse(input);
    return this.repo.searchQuizzes(parsed);
  }

  editQuiz(input: unknown): Quiz | null {
    const parsed = editQuizInputSchema.parse(input);
    return this.repo.editQuiz(parsed);
  }

  toggleFavorite(id: string): Quiz | null {
    const quiz = this.repo.getQuiz(id);
    if (!quiz) return null;
    return this.repo.setFavorite(id, !quiz.favorite);
  }

  /** 回答を採点し、履歴として保存して結果を返す */
  recordAttempt(input: unknown): Attempt {
    const parsed = submitAttemptInputSchema.parse(input);
    const quiz = this.repo.getQuiz(parsed.quizId);
    if (!quiz) throw new Error(`クイズが見つかりません: ${parsed.quizId}`);

    const answerMap = new Map(parsed.answers.map((a) => [a.questionId, a.choiceIds]));
    const results = scoreQuestions(quiz.questions, answerMap);

    const score = results.filter((r) => r.isCorrect).length;
    const finishedAt = new Date().toISOString();
    const attempt: Attempt = {
      id: randomUUID(),
      quizId: quiz.id,
      quizTitle: quiz.title,
      score,
      total: quiz.questions.length,
      results,
      startedAt: parsed.startedAt ?? finishedAt,
      finishedAt,
    };
    this.repo.saveAttempt(attempt);
    return attempt;
  }

  /**
   * 複数クイズの設問をまとめて 1 セッションとして採点・保存する。
   * 未回答の設問はスキップ扱い（選択なし=不正解）として total に含める。
   */
  recordSession(input: unknown): Attempt {
    const parsed = submitSessionInputSchema.parse(input);

    // 選択順を保ったまま重複排除し、各クイズの設問を連結する
    const uniqueIds = [...new Set(parsed.quizIds)];
    const quizzes = uniqueIds.map((id) => this.repo.getQuiz(id)).filter((q): q is Quiz => !!q);
    if (quizzes.length === 0) throw new Error("有効なクイズが 1 つもありません");
    const questions = quizzes.flatMap((q) => q.questions);
    if (questions.length === 0) throw new Error("設問が 1 つもありません");

    const answerMap = new Map(parsed.answers.map((a) => [a.questionId, a.choiceIds]));
    const results = scoreQuestions(questions, answerMap);

    const score = results.filter((r) => r.isCorrect).length;
    const finishedAt = new Date().toISOString();
    const title =
      parsed.title ??
      (quizzes.length === 1
        ? quizzes[0]!.title
        : `まとめ受験（${quizzes.length}クイズ・${questions.length}問）`);
    const attempt: Attempt = {
      id: randomUUID(),
      // 代表として先頭クイズの ID を保持（FK 用）。表示名は title 側を使う。
      quizId: quizzes[0]!.id,
      quizTitle: title,
      score,
      total: questions.length,
      results,
      startedAt: parsed.startedAt ?? finishedAt,
      finishedAt,
    };
    // 単一クイズのときは従来どおり sessionTitle=null（元クイズ名で表示）
    this.repo.saveAttempt(attempt, quizzes.length === 1 ? null : title);
    return attempt;
  }

  recentAttempts(limit = 20): AttemptSummary[] {
    return this.repo.recentAttempts(limit);
  }

  /** 履歴 1 件の採点済み詳細（出題内容 + 自分の解答 + 正誤）を取得する */
  getAttemptDetail(id: string): AttemptDetail | null {
    return this.repo.getAttemptDetail(id);
  }
}
