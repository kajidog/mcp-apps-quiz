import { relations } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Drizzle (better-sqlite3) スキーマ。
 * クイズ本体・タグ(多対多)・設問・選択肢・受験履歴を正規化して保持する。
 */

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const quizTags = sqliteTable(
  "quiz_tags",
  {
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.quizId, t.tagId] }),
    tagIdx: index("quiz_tags_tag_idx").on(t.tagId),
  }),
);

export const questions = sqliteTable(
  "questions",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    text: text("text").notNull(),
    explanation: text("explanation"),
  },
  (t) => ({ quizIdx: index("questions_quiz_idx").on(t.quizId) }),
);

export const choices = sqliteTable(
  "choices",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    text: text("text").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  },
  (t) => ({ questionIdx: index("choices_question_idx").on(t.questionId) }),
);

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    /** 複数クイズをまとめたセッションの表示名。単一クイズ受験では null。 */
    title: text("title"),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    startedAt: text("started_at").notNull(),
    finishedAt: text("finished_at").notNull(),
  },
  (t) => ({ finishedIdx: index("attempts_finished_idx").on(t.finishedAt) }),
);

export const attemptAnswers = sqliteTable(
  "attempt_answers",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    /** 選択した選択肢 ID をカンマ区切りで保持 */
    selectedChoiceIds: text("selected_choice_ids").notNull().default(""),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  },
  (t) => ({ attemptIdx: index("attempt_answers_attempt_idx").on(t.attemptId) }),
);

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  questions: many(questions),
  quizTags: many(quizTags),
  attempts: many(attempts),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  quizTags: many(quizTags),
}));

export const quizTagsRelations = relations(quizTags, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizTags.quizId], references: [quizzes.id] }),
  tag: one(tags, { fields: [quizTags.tagId], references: [tags.id] }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
  choices: many(choices),
}));

export const choicesRelations = relations(choices, ({ one }) => ({
  question: one(questions, { fields: [choices.questionId], references: [questions.id] }),
}));

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [attempts.quizId], references: [quizzes.id] }),
  answers: many(attemptAnswers),
}));

export const attemptAnswersRelations = relations(attemptAnswers, ({ one }) => ({
  attempt: one(attempts, { fields: [attemptAnswers.attemptId], references: [attempts.id] }),
}));

export type DbSchema = {
  quizzes: typeof quizzes;
  tags: typeof tags;
  quizTags: typeof quizTags;
  questions: typeof questions;
  choices: typeof choices;
  attempts: typeof attempts;
  attemptAnswers: typeof attemptAnswers;
};
