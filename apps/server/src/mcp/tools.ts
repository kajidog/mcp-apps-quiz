import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type { QuizService } from "@quiz/core";
import { z } from "zod";
import { QUIZ_RESOURCE_URI, loadQuizHtml } from "./resource.js";

/**
 * UI に渡すツール結果のペイロード。app 側は structuredContent.kind で描画を分岐する。
 */
type QuizPayload =
  | { kind: "quiz"; quiz: unknown }
  | { kind: "list"; quizzes: unknown }
  | { kind: "history"; attempts: unknown }
  | { kind: "attempt"; attempt: unknown }
  | { kind: "attemptDetail"; detail: unknown }
  | { kind: "deleted"; quizId: string }
  | { kind: "error"; message: string };

function ok(text: string, payload: QuizPayload): CallToolResult {
  return { content: [{ type: "text", text }], structuredContent: payload };
}

function fail(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { kind: "error", message },
    isError: true,
  };
}

// --- 入力スキーマ（zod raw shape） ---

const choiceShape = {
  text: z.string().describe("選択肢の文言"),
  isCorrect: z.boolean().describe("この選択肢が正解なら true（複数可）"),
};
const questionShape = {
  text: z.string().describe("問題文"),
  explanation: z.string().optional().describe("解説（任意）"),
  choices: z
    .array(z.object(choiceShape))
    .min(2)
    .describe("選択肢。2 つ以上、正解を 1 つ以上含める"),
};
const createShape = {
  title: z.string().describe("クイズのタイトル"),
  tags: z.array(z.string()).default([]).describe("分類タグ"),
  questions: z.array(z.object(questionShape)).min(1).describe("設問の配列"),
};

/**
 * モデル向けツールを登録する。UI を表示するため `_meta.ui.resourceUri` を付ける。
 */
export function registerModelTools(server: McpServer, service: QuizService): void {
  const ui = { resourceUri: QUIZ_RESOURCE_URI };

  registerAppTool(
    server,
    "quiz_create",
    {
      title: "クイズ作成",
      description:
        "AI が生成したクイズ（タイトル・タグ・設問・選択肢・正解フラグ・解説）を保存し、UI で出題する。",
      inputSchema: createShape,
      _meta: { ui },
    },
    async (args): Promise<CallToolResult> => {
      try {
        const quiz = service.createQuiz(args);
        return ok(
          `クイズ「${quiz.title}」を作成しました (id: ${quiz.id}, ${quiz.questions.length}問)。`,
          {
            kind: "quiz",
            quiz,
          },
        );
      } catch (e) {
        return fail(`作成に失敗しました: ${(e as Error).message}`);
      }
    },
  );

  registerAppTool(
    server,
    "quiz_present",
    {
      title: "クイズ出題",
      description: "既存のクイズを ID もしくはタグで指定して UI に出題する（再受験用）。",
      inputSchema: {
        quizId: z.string().optional().describe("出題するクイズの ID"),
        tags: z
          .array(z.string())
          .optional()
          .describe("このタグのいずれかを持つクイズから 1 件出題"),
      },
      _meta: { ui },
    },
    async (args): Promise<CallToolResult> => {
      const quiz = service.presentQuiz(args);
      if (!quiz) return fail("該当するクイズが見つかりませんでした。");
      return ok(`クイズ「${quiz.title}」を出題します (${quiz.questions.length}問)。`, {
        kind: "quiz",
        quiz,
      });
    },
  );

  registerAppTool(
    server,
    "quiz_search",
    {
      title: "クイズ検索",
      description: "タイトル・問題文・タグでクイズを検索し、一覧を UI に表示する。",
      inputSchema: {
        query: z.string().optional().describe("タイトル/問題文の部分一致キーワード"),
        tags: z.array(z.string()).optional().describe("絞り込むタグ"),
        favoriteOnly: z.boolean().optional().describe("お気に入りのみ"),
      },
      _meta: { ui },
    },
    async (args): Promise<CallToolResult> => {
      const quizzes = service.searchQuizzes(args);
      return ok(`${quizzes.length} 件のクイズが見つかりました。`, { kind: "list", quizzes });
    },
  );

  registerAppTool(
    server,
    "quiz_edit",
    {
      title: "クイズ編集",
      description: "既存クイズのタイトル・タグ・お気に入り・設問を編集する。",
      inputSchema: {
        quizId: z.string().describe("編集対象のクイズ ID"),
        patch: z
          .object({
            title: z.string().optional(),
            tags: z.array(z.string()).optional(),
            favorite: z.boolean().optional(),
            questions: z
              .array(z.object(questionShape))
              .min(1)
              .optional()
              .describe("指定時は設問を丸ごと置換"),
          })
          .describe("変更内容（指定したフィールドのみ更新）"),
      },
      _meta: { ui },
    },
    async (args): Promise<CallToolResult> => {
      const quiz = service.editQuiz(args);
      if (!quiz) return fail("編集対象のクイズが見つかりませんでした。");
      return ok(`クイズ「${quiz.title}」を更新しました。`, { kind: "quiz", quiz });
    },
  );

  registerAppTool(
    server,
    "quiz_history",
    {
      title: "受験履歴",
      description: "直近の受験履歴（スコア付き）を取得して UI に表示する。",
      inputSchema: {
        limit: z.number().int().positive().max(100).optional().describe("取得件数（既定 20）"),
      },
      _meta: { ui },
    },
    async (args): Promise<CallToolResult> => {
      const attempts = service.recentAttempts(args.limit ?? 20);
      return ok(`直近 ${attempts.length} 件の受験履歴です。`, { kind: "history", attempts });
    },
  );
}

/**
 * UI 専用ツール（visibility: ["app"]）。ブラウザ経路の GraphQL 操作と 1:1 対応する。
 * モデルからは隠し、UI が app.callServerTool で呼ぶ。
 */
export function registerAppOnlyTools(server: McpServer, service: QuizService): void {
  const appOnly = { ui: { visibility: ["app"] as ("model" | "app")[] } };

  registerAppTool(
    server,
    "_get_quiz",
    { description: "ID でクイズ 1 件を取得", inputSchema: { quizId: z.string() }, _meta: appOnly },
    async ({ quizId }): Promise<CallToolResult> => {
      const quiz = service.getQuiz(quizId);
      return quiz ? ok("ok", { kind: "quiz", quiz }) : fail("not found");
    },
  );

  registerAppTool(
    server,
    "_submit_attempt",
    {
      description: "回答を採点し履歴に保存",
      inputSchema: {
        quizId: z.string(),
        answers: z.array(z.object({ questionId: z.string(), choiceIds: z.array(z.string()) })),
        startedAt: z.string().optional(),
      },
      _meta: appOnly,
    },
    async (args): Promise<CallToolResult> => {
      try {
        const attempt = service.recordAttempt(args);
        return ok(`${attempt.score}/${attempt.total} 正解`, { kind: "attempt", attempt });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  );

  registerAppTool(
    server,
    "_submit_session",
    {
      description: "複数クイズをまとめて採点し履歴に保存（UI 用）",
      inputSchema: {
        quizIds: z.array(z.string()),
        answers: z.array(z.object({ questionId: z.string(), choiceIds: z.array(z.string()) })),
        startedAt: z.string().optional(),
        title: z.string().optional(),
      },
      _meta: appOnly,
    },
    async (args): Promise<CallToolResult> => {
      try {
        const attempt = service.recordSession(args);
        return ok(`${attempt.score}/${attempt.total} 正解`, { kind: "attempt", attempt });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  );

  registerAppTool(
    server,
    "_attempt_detail",
    {
      description: "履歴1件の採点済み詳細（UI 用）",
      inputSchema: { attemptId: z.string() },
      _meta: appOnly,
    },
    async ({ attemptId }): Promise<CallToolResult> => {
      const detail = service.getAttemptDetail(attemptId);
      return detail ? ok("ok", { kind: "attemptDetail", detail }) : fail("not found");
    },
  );

  registerAppTool(
    server,
    "_toggle_favorite",
    { description: "お気に入りを切替", inputSchema: { quizId: z.string() }, _meta: appOnly },
    async ({ quizId }): Promise<CallToolResult> => {
      const quiz = service.toggleFavorite(quizId);
      return quiz ? ok("ok", { kind: "quiz", quiz }) : fail("not found");
    },
  );

  registerAppTool(
    server,
    "_delete_quiz",
    { description: "クイズを削除", inputSchema: { quizId: z.string() }, _meta: appOnly },
    async ({ quizId }): Promise<CallToolResult> => {
      const deleted = service.deleteQuiz(quizId);
      return deleted ? ok("ok", { kind: "deleted", quizId }) : fail("not found");
    },
  );

  registerAppTool(
    server,
    "_search_quizzes",
    {
      description: "クイズ検索（UI 用）",
      inputSchema: {
        query: z.string().optional(),
        tags: z.array(z.string()).optional(),
        favoriteOnly: z.boolean().optional(),
      },
      _meta: appOnly,
    },
    async (args): Promise<CallToolResult> =>
      ok("ok", { kind: "list", quizzes: service.searchQuizzes(args) }),
  );

  registerAppTool(
    server,
    "_recent_attempts",
    {
      description: "受験履歴（UI 用）",
      inputSchema: { limit: z.number().int().positive().optional() },
      _meta: appOnly,
    },
    async ({ limit }): Promise<CallToolResult> =>
      ok("ok", { kind: "history", attempts: service.recentAttempts(limit ?? 20) }),
  );
}

/**
 * UI リソース（単一 HTML バンドル）を登録する。全ツールがこの 1 リソースを共有する。
 */
export function registerQuizResource(server: McpServer): void {
  const html = loadQuizHtml();
  registerAppResource(
    server,
    "Quiz UI",
    QUIZ_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => ({
      contents: [
        {
          uri: QUIZ_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          _meta: {
            // 単一オリジンを持たない MCP App から同オリジン外への接続は CSP 明示が必要。
            // ここでは外部接続を使わない（callServerTool 経由）ため最小限。
            ui: { csp: { connectDomains: [], resourceDomains: [] } },
          },
        },
      ],
    }),
  );
}
