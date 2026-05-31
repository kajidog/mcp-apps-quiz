import { graphql } from "@/gql";
import type { AnswerSelection, GraphqlExecutor, McpCaller } from "@/shared/api";
import type { Attempt, Quiz } from "@quiz/core";
import "@/shared/api/graphql/fragments.js";

/** 受験（単一・まとめ）に関するデータアクセス。 */
export interface SessionApi {
  getQuiz(id: string): Promise<Quiz | null>;
  submitAttempt(quizId: string, answers: AnswerSelection[], startedAt?: string): Promise<Attempt>;
  /** 複数クイズをまとめて 1 セッションとして採点・履歴保存する */
  submitSession(
    quizIds: string[],
    answers: AnswerSelection[],
    opts?: { startedAt?: string; title?: string },
  ): Promise<Attempt>;
  /** quizId か tags から1件出題する（MCP の quiz_present に対応。UI からは通常未使用）。 */
  presentQuiz(args: { quizId?: string; tags?: string[] }): Promise<Quiz | null>;
}

const GetQuizDoc = graphql(`
  query GetSessionQuiz($id: ID!) { quiz(id: $id) { ...QuizFields } }
`);
const SubmitAttemptDoc = graphql(`
  mutation SubmitAttempt($quizId: ID!, $answers: [AnswerInput!]!, $startedAt: String) {
    submitAttempt(quizId: $quizId, answers: $answers, startedAt: $startedAt) {
      id quizId quizTitle score total startedAt finishedAt
      results { questionId selectedChoiceIds correctChoiceIds isCorrect }
    }
  }
`);
const SubmitSessionDoc = graphql(`
  mutation SubmitSession($quizIds: [ID!]!, $answers: [AnswerInput!]!, $startedAt: String, $title: String) {
    submitSession(quizIds: $quizIds, answers: $answers, startedAt: $startedAt, title: $title) {
      id quizId quizTitle score total startedAt finishedAt
      results { questionId selectedChoiceIds correctChoiceIds isCorrect }
    }
  }
`);
const PresentQuizDoc = graphql(`
  mutation PresentQuiz($quizId: ID, $tags: [String!]) {
    presentQuiz(quizId: $quizId, tags: $tags) { ...QuizFields }
  }
`);

export function createMcpSessionApi(caller: McpCaller): SessionApi {
  return {
    getQuiz: (id) => caller.field<Quiz>("_get_quiz", { quizId: id }, "quiz"),
    async submitAttempt(quizId, answers, startedAt) {
      const r = await caller.structured<{ attempt: Attempt }>("_submit_attempt", {
        quizId,
        answers,
        startedAt,
      });
      return r.attempt;
    },
    async submitSession(quizIds, answers, opts) {
      const r = await caller.structured<{ attempt: Attempt }>("_submit_session", {
        quizIds,
        answers,
        startedAt: opts?.startedAt,
        title: opts?.title,
      });
      return r.attempt;
    },
    presentQuiz: (args) => caller.field<Quiz>("quiz_present", { ...args }, "quiz"),
  };
}

export function createGraphqlSessionApi(execute: GraphqlExecutor): SessionApi {
  return {
    async getQuiz(id) {
      const d = await execute(GetQuizDoc, { id });
      return (d.quiz ?? null) as Quiz | null;
    },
    async submitAttempt(quizId, answers, startedAt) {
      const d = await execute(SubmitAttemptDoc, { quizId, answers, startedAt });
      return d.submitAttempt as Attempt;
    },
    async submitSession(quizIds, answers, opts) {
      const d = await execute(SubmitSessionDoc, {
        quizIds,
        answers,
        startedAt: opts?.startedAt,
        title: opts?.title,
      });
      return d.submitSession as Attempt;
    },
    async presentQuiz(args) {
      const d = await execute(PresentQuizDoc, { quizId: args.quizId, tags: args.tags });
      return (d.presentQuiz ?? null) as Quiz | null;
    },
  };
}
