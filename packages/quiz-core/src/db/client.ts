import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type QuizDb = ReturnType<typeof createDb>;

/**
 * better-sqlite3 を使った Drizzle インスタンスを生成する。
 * @param path SQLite ファイルパス。`:memory:` でインメモリ(テスト用)。
 */
export function createDb(path = ":memory:") {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  ensureSchema(sqlite);
  return db;
}

/**
 * スキーマ(テーブル)を冪等に作成する。drizzle-kit のマイグレーションを使わずに
 * アプリ起動・テスト時に最低限のテーブルを用意するための簡易版。
 */
function ensureSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS quiz_tags (
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (quiz_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS quiz_tags_tag_idx ON quiz_tags(tag_id);
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      "order" INTEGER NOT NULL,
      text TEXT NOT NULL,
      explanation TEXT
    );
    CREATE INDEX IF NOT EXISTS questions_quiz_idx ON questions(quiz_id);
    CREATE TABLE IF NOT EXISTS choices (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      "order" INTEGER NOT NULL,
      text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS choices_question_idx ON choices(question_id);
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      title TEXT,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_finished_idx ON attempts(finished_at);
    CREATE TABLE IF NOT EXISTS attempt_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      selected_choice_ids TEXT NOT NULL DEFAULT '',
      is_correct INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempt_answers_attempt_idx ON attempt_answers(attempt_id);
  `);
  migrateAttemptsTitle(sqlite);
}

/**
 * 既存 DB に attempts.title 列が無ければ追加する（冪等マイグレーション）。
 * CREATE TABLE IF NOT EXISTS は既存テーブルを変更しないため、別途 ALTER する。
 */
function migrateAttemptsTitle(sqlite: Database.Database): void {
  const cols = sqlite.prepare("PRAGMA table_info(attempts)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "title")) {
    sqlite.exec("ALTER TABLE attempts ADD COLUMN title TEXT");
  }
}
