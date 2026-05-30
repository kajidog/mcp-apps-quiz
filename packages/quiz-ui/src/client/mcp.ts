import type { App } from "@modelcontextprotocol/ext-apps";
import type {
  Attempt,
  AttemptDetail,
  AttemptSummary,
  CreateQuizInput,
  Quiz,
  QuizSummary,
} from "@quiz/core";
import type { AnswerSelection, EditPatch, QuizClient, SearchArgs } from "./types.js";

interface CallToolResult {
  structuredContent?: unknown;
  isError?: boolean;
  content?: { type: string; text?: string }[];
}

function structured<T>(result: CallToolResult): T {
  return result.structuredContent as T;
}

/**
 * MCP App 経路の QuizClient。app.callServerTool でサーバの UI 専用ツールを呼ぶ。
 */
export class McpQuizClient implements QuizClient {
  readonly transport = "mcp" as const;
  constructor(private readonly app: App) {}

  private async call(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    return (await this.app.callServerTool({ name, arguments: args })) as CallToolResult;
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    const r = await this.call("_get_quiz", { quizId: id });
    if (r.isError) return null;
    return structured<{ quiz: Quiz }>(r).quiz;
  }

  async searchQuizzes(args: SearchArgs): Promise<QuizSummary[]> {
    const r = await this.call("_search_quizzes", { ...args });
    return structured<{ quizzes: QuizSummary[] }>(r).quizzes;
  }

  async recentAttempts(limit = 20): Promise<AttemptSummary[]> {
    const r = await this.call("_recent_attempts", { limit });
    return structured<{ attempts: AttemptSummary[] }>(r).attempts;
  }

  async createQuiz(input: CreateQuizInput): Promise<Quiz> {
    const r = await this.call("quiz_create", { ...input });
    return structured<{ quiz: Quiz }>(r).quiz;
  }

  async editQuiz(quizId: string, patch: EditPatch): Promise<Quiz | null> {
    const r = await this.call("quiz_edit", { quizId, patch });
    if (r.isError) return null;
    return structured<{ quiz: Quiz }>(r).quiz;
  }

  async toggleFavorite(quizId: string): Promise<Quiz | null> {
    const r = await this.call("_toggle_favorite", { quizId });
    if (r.isError) return null;
    return structured<{ quiz: Quiz }>(r).quiz;
  }

  async submitAttempt(
    quizId: string,
    answers: AnswerSelection[],
    startedAt?: string,
  ): Promise<Attempt> {
    const r = await this.call("_submit_attempt", { quizId, answers, startedAt });
    return structured<{ attempt: Attempt }>(r).attempt;
  }

  async submitSession(
    quizIds: string[],
    answers: AnswerSelection[],
    opts?: { startedAt?: string; title?: string },
  ): Promise<Attempt> {
    const r = await this.call("_submit_session", {
      quizIds,
      answers,
      startedAt: opts?.startedAt,
      title: opts?.title,
    });
    return structured<{ attempt: Attempt }>(r).attempt;
  }

  async getAttemptDetail(attemptId: string): Promise<AttemptDetail | null> {
    const r = await this.call("_attempt_detail", { attemptId });
    if (r.isError) return null;
    return structured<{ detail: AttemptDetail }>(r).detail;
  }

  async presentQuiz(args: { quizId?: string; tags?: string[] }): Promise<Quiz | null> {
    const r = await this.call("quiz_present", { ...args });
    if (r.isError) return null;
    return structured<{ quiz: Quiz }>(r).quiz;
  }
}
