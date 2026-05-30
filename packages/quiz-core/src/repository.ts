import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import type { QuizDb } from "./db/client.js";
import * as t from "./db/schema.js";
import type { Attempt, AttemptDetail, AttemptSummary, Quiz, QuizSummary } from "./domain.js";
import type { CreateQuizInput, EditQuizInput, SearchQuizzesInput } from "./schemas.js";

/**
 * 永続化の抽象。Drizzle/SQLite 以外の実装に差し替えられるようインターフェースを切る。
 * 採点ロジックは service 層が持ち、Repository は CRUD と問い合わせに徹する。
 */
export interface QuizRepository {
  createQuiz(input: CreateQuizInput): Quiz;
  getQuiz(id: string): Quiz | null;
  editQuiz(input: EditQuizInput): Quiz | null;
  setFavorite(id: string, favorite: boolean): Quiz | null;
  searchQuizzes(input: SearchQuizzesInput): QuizSummary[];
  /** タグのいずれかにマッチするクイズの ID 一覧 */
  findQuizIdsByTags(tags: string[]): string[];
  /** sessionTitle 指定時は複数クイズをまとめたセッションとして保存する */
  saveAttempt(attempt: Attempt, sessionTitle?: string | null): void;
  recentAttempts(limit: number): AttemptSummary[];
  getAttempt(id: string): Attempt | null;
  /** 履歴詳細（出題内容 + 自分の解答 + 正誤）を取得する */
  getAttemptDetail(id: string): AttemptDetail | null;
}

const now = () => new Date().toISOString();

/** db.transaction のコールバックに渡されるトランザクションハンドル型 */
type Tx = Parameters<Parameters<QuizDb["transaction"]>[0]>[0];

export class DrizzleQuizRepository implements QuizRepository {
  constructor(private readonly db: QuizDb) {}

  createQuiz(input: CreateQuizInput): Quiz {
    const id = randomUUID();
    const ts = now();
    this.db.transaction((tx) => {
      tx.insert(t.quizzes)
        .values({ id, title: input.title, favorite: false, createdAt: ts, updatedAt: ts })
        .run();
      this.upsertTags(tx, id, input.tags);
      this.insertQuestions(tx, id, input.questions);
    });
    return this.getQuiz(id)!;
  }

  getQuiz(id: string): Quiz | null {
    const row = this.db.query.quizzes
      .findFirst({
        where: eq(t.quizzes.id, id),
        with: {
          quizTags: { with: { tag: true } },
          questions: { with: { choices: true } },
        },
      })
      .sync();
    if (!row) return null;
    return mapQuiz(row);
  }

  editQuiz(input: EditQuizInput): Quiz | null {
    const existing = this.getQuiz(input.quizId);
    if (!existing) return null;
    const { patch } = input;
    this.db.transaction((tx) => {
      const set: Record<string, unknown> = { updatedAt: now() };
      if (patch.title !== undefined) set.title = patch.title;
      if (patch.favorite !== undefined) set.favorite = patch.favorite;
      tx.update(t.quizzes).set(set).where(eq(t.quizzes.id, input.quizId)).run();

      if (patch.tags !== undefined) {
        tx.delete(t.quizTags).where(eq(t.quizTags.quizId, input.quizId)).run();
        this.upsertTags(tx, input.quizId, patch.tags);
      }
      if (patch.questions !== undefined) {
        tx.delete(t.questions).where(eq(t.questions.quizId, input.quizId)).run();
        this.insertQuestions(tx, input.quizId, patch.questions);
      }
    });
    return this.getQuiz(input.quizId);
  }

  setFavorite(id: string, favorite: boolean): Quiz | null {
    const res = this.db
      .update(t.quizzes)
      .set({ favorite, updatedAt: now() })
      .where(eq(t.quizzes.id, id))
      .run();
    if (res.changes === 0) return null;
    return this.getQuiz(id);
  }

  searchQuizzes(input: SearchQuizzesInput): QuizSummary[] {
    const conditions = [];
    if (input.favoriteOnly) conditions.push(eq(t.quizzes.favorite, true));
    if (input.query) {
      const q = `%${input.query}%`;
      // タイトル or 問題文にマッチするクイズ
      const matchedByQuestion = this.db
        .select({ id: t.questions.quizId })
        .from(t.questions)
        .where(like(t.questions.text, q));
      conditions.push(
        sql`(${t.quizzes.title} LIKE ${q} OR ${t.quizzes.id} IN ${matchedByQuestion})`,
      );
    }
    if (input.tags && input.tags.length > 0) {
      const ids = this.findQuizIdsByTags(input.tags);
      if (ids.length === 0) return [];
      conditions.push(inArray(t.quizzes.id, ids));
    }

    const rows = this.db.query.quizzes
      .findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(t.quizzes.updatedAt),
        limit: input.limit,
        with: { quizTags: { with: { tag: true } }, questions: { columns: { id: true } } },
      })
      .sync();
    return rows.map(
      (r): QuizSummary => ({
        id: r.id,
        title: r.title,
        tags: r.quizTags.map((qt) => qt.tag.name),
        favorite: r.favorite,
        questionCount: r.questions.length,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }),
    );
  }

  findQuizIdsByTags(tags: string[]): string[] {
    if (tags.length === 0) return [];
    const rows = this.db
      .select({ quizId: t.quizTags.quizId })
      .from(t.quizTags)
      .innerJoin(t.tags, eq(t.quizTags.tagId, t.tags.id))
      .where(inArray(t.tags.name, tags))
      .all();
    return [...new Set(rows.map((r) => r.quizId))];
  }

  saveAttempt(attempt: Attempt, sessionTitle?: string | null): void {
    this.db.transaction((tx) => {
      tx.insert(t.attempts)
        .values({
          id: attempt.id,
          quizId: attempt.quizId,
          title: sessionTitle ?? null,
          score: attempt.score,
          total: attempt.total,
          startedAt: attempt.startedAt,
          finishedAt: attempt.finishedAt,
        })
        .run();
      for (const r of attempt.results) {
        tx.insert(t.attemptAnswers)
          .values({
            id: randomUUID(),
            attemptId: attempt.id,
            questionId: r.questionId,
            selectedChoiceIds: r.selectedChoiceIds.join(","),
            isCorrect: r.isCorrect,
          })
          .run();
      }
    });
  }

  recentAttempts(limit: number): AttemptSummary[] {
    const rows = this.db
      .select({
        id: t.attempts.id,
        quizId: t.attempts.quizId,
        // セッションは title、単一クイズは元クイズ名を表示名に使う
        quizTitle: sql<string>`coalesce(${t.attempts.title}, ${t.quizzes.title})`,
        score: t.attempts.score,
        total: t.attempts.total,
        finishedAt: t.attempts.finishedAt,
      })
      .from(t.attempts)
      .innerJoin(t.quizzes, eq(t.attempts.quizId, t.quizzes.id))
      .orderBy(desc(t.attempts.finishedAt))
      .limit(limit)
      .all();
    return rows;
  }

  getAttempt(id: string): Attempt | null {
    const row = this.db.query.attempts
      .findFirst({
        where: eq(t.attempts.id, id),
        with: { answers: true, quiz: { columns: { title: true } } },
      })
      .sync();
    if (!row) return null;
    return {
      id: row.id,
      quizId: row.quizId,
      quizTitle: row.quiz.title,
      score: row.score,
      total: row.total,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      results: row.answers.map((a) => ({
        questionId: a.questionId,
        selectedChoiceIds: a.selectedChoiceIds ? a.selectedChoiceIds.split(",") : [],
        correctChoiceIds: [],
        isCorrect: a.isCorrect,
      })),
    };
  }

  getAttemptDetail(id: string): AttemptDetail | null {
    const row = this.db.query.attempts
      .findFirst({
        where: eq(t.attempts.id, id),
        with: { answers: true, quiz: { columns: { title: true } } },
      })
      .sync();
    if (!row) return null;

    // 解答に紐づく設問を一括取得（編集で削除済みのものは欠落しうる）
    const questionIds = row.answers.map((a) => a.questionId);
    const questionRows =
      questionIds.length > 0
        ? this.db.query.questions
            .findMany({ where: inArray(t.questions.id, questionIds), with: { choices: true } })
            .sync()
        : [];
    const byId = new Map(questionRows.map((q) => [q.id, q]));

    return {
      id: row.id,
      title: row.title ?? row.quiz.title,
      score: row.score,
      total: row.total,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      answers: row.answers.map((a) => {
        const q = byId.get(a.questionId);
        const question: Quiz["questions"][number] | null = q
          ? {
              id: q.id,
              order: q.order,
              text: q.text,
              explanation: q.explanation,
              choices: [...q.choices]
                .sort((x, y) => x.order - y.order)
                .map((c) => ({ id: c.id, order: c.order, text: c.text, isCorrect: c.isCorrect })),
            }
          : null;
        return {
          question,
          questionId: a.questionId,
          selectedChoiceIds: a.selectedChoiceIds ? a.selectedChoiceIds.split(",") : [],
          correctChoiceIds: question
            ? question.choices.filter((c) => c.isCorrect).map((c) => c.id)
            : [],
          isCorrect: a.isCorrect,
        };
      }),
    };
  }

  // --- internal helpers ---

  private upsertTags(tx: Tx, quizId: string, tagNames: string[]): void {
    for (const name of [...new Set(tagNames)]) {
      const found = tx.select({ id: t.tags.id }).from(t.tags).where(eq(t.tags.name, name)).get();
      const tagId = found?.id ?? randomUUID();
      if (!found) tx.insert(t.tags).values({ id: tagId, name }).run();
      tx.insert(t.quizTags).values({ quizId, tagId }).onConflictDoNothing().run();
    }
  }

  private insertQuestions(tx: Tx, quizId: string, questions: CreateQuizInput["questions"]): void {
    questions.forEach((q, qi) => {
      const questionId = randomUUID();
      tx.insert(t.questions)
        .values({
          id: questionId,
          quizId,
          order: qi,
          text: q.text,
          explanation: q.explanation ?? null,
        })
        .run();
      q.choices.forEach((c, ci) => {
        tx.insert(t.choices)
          .values({ id: randomUUID(), questionId, order: ci, text: c.text, isCorrect: c.isCorrect })
          .run();
      });
    });
  }
}

type QuizRow = {
  id: string;
  title: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  quizTags: { tag: { name: string } }[];
  questions: {
    id: string;
    order: number;
    text: string;
    explanation: string | null;
    choices: { id: string; order: number; text: string; isCorrect: boolean }[];
  }[];
};

function mapQuiz(row: QuizRow): Quiz {
  return {
    id: row.id,
    title: row.title,
    favorite: row.favorite,
    tags: row.quizTags.map((qt) => qt.tag.name),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    questions: [...row.questions]
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        order: q.order,
        text: q.text,
        explanation: q.explanation,
        choices: [...q.choices]
          .sort((a, b) => a.order - b.order)
          .map((c) => ({ id: c.id, order: c.order, text: c.text, isCorrect: c.isCorrect })),
      })),
  };
}
