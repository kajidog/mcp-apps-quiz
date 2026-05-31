import { graphql } from "@/gql";
import type { GraphqlExecutor, McpCaller } from "@/shared/api";
import type { AttemptDetail, AttemptSummary } from "@quiz/core";

/** 受験履歴の取得に関するデータアクセス。 */
export interface HistoryApi {
  recentAttempts(limit?: number): Promise<AttemptSummary[]>;
  getAttemptDetail(attemptId: string): Promise<AttemptDetail | null>;
}

const RecentAttemptsDoc = graphql(`
  query RecentAttempts($limit: Int) {
    recentAttempts(limit: $limit) { id quizId quizTitle score total finishedAt }
  }
`);
const GetAttemptDoc = graphql(`
  query GetAttempt($id: ID!) {
    attempt(id: $id) {
      id title score total startedAt finishedAt
      answers {
        questionId selectedChoiceIds correctChoiceIds isCorrect
        question { id order text explanation choices { id order text isCorrect } }
      }
    }
  }
`);

export function createMcpHistoryApi(caller: McpCaller): HistoryApi {
  return {
    async recentAttempts(limit = 20) {
      const r = await caller.structured<{ attempts: AttemptSummary[] }>("_recent_attempts", {
        limit,
      });
      return r.attempts;
    },
    getAttemptDetail: (attemptId) =>
      caller.field<AttemptDetail>("_attempt_detail", { attemptId }, "detail"),
  };
}

export function createGraphqlHistoryApi(execute: GraphqlExecutor): HistoryApi {
  return {
    async recentAttempts(limit = 20) {
      const d = await execute(RecentAttemptsDoc, { limit });
      return d.recentAttempts as AttemptSummary[];
    },
    async getAttemptDetail(attemptId) {
      const d = await execute(GetAttemptDoc, { id: attemptId });
      return (d.attempt ?? null) as AttemptDetail | null;
    },
  };
}
