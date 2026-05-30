import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { Attempt, AttemptDetail, AttemptSummary, Quiz, QuizSummary } from "@quiz/core";
import { print } from "graphql";
import { graphql } from "../gql/index.js";
import type { AnswerSelection, EditPatch, QuizClient, SearchArgs } from "./types.js";

// --- 共有 SDL から codegen される型付き operation 群（graphql() は src/gql に生成済み） ---

const QuizFields = graphql(`
  fragment QuizFields on Quiz {
    id title tags favorite createdAt updatedAt
    questions { id order text explanation choices { id order text isCorrect } }
  }
`);

const GetQuizDoc = graphql(`
  query GetQuiz($id: ID!) { quiz(id: $id) { ...QuizFields } }
`);
const SearchQuizzesDoc = graphql(`
  query SearchQuizzes($query: String, $tags: [String!], $favoriteOnly: Boolean) {
    searchQuizzes(query: $query, tags: $tags, favoriteOnly: $favoriteOnly) {
      id title tags favorite questionCount createdAt updatedAt
    }
  }
`);
const RecentAttemptsDoc = graphql(`
  query RecentAttempts($limit: Int) {
    recentAttempts(limit: $limit) { id quizId quizTitle score total finishedAt }
  }
`);
const CreateQuizDoc = graphql(`
  mutation CreateQuiz($input: CreateQuizInput!) { createQuiz(input: $input) { ...QuizFields } }
`);
const EditQuizDoc = graphql(`
  mutation EditQuiz($quizId: ID!, $patch: EditQuizPatch!) {
    editQuiz(quizId: $quizId, patch: $patch) { ...QuizFields }
  }
`);
const ToggleFavoriteDoc = graphql(`
  mutation ToggleFavorite($quizId: ID!) { toggleFavorite(quizId: $quizId) { ...QuizFields } }
`);
const SubmitAttemptDoc = graphql(`
  mutation SubmitAttempt($quizId: ID!, $answers: [AnswerInput!]!, $startedAt: String) {
    submitAttempt(quizId: $quizId, answers: $answers, startedAt: $startedAt) {
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
const SubmitSessionDoc = graphql(`
  mutation SubmitSession($quizIds: [ID!]!, $answers: [AnswerInput!]!, $startedAt: String, $title: String) {
    submitSession(quizIds: $quizIds, answers: $answers, startedAt: $startedAt, title: $title) {
      id quizId quizTitle score total startedAt finishedAt
      results { questionId selectedChoiceIds correctChoiceIds isCorrect }
    }
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

// QuizFields はフラグメント定義として codegen に拾わせるためだけに参照する。
void QuizFields;

/**
 * ブラウザ経路の QuizClient。共有 SDL から生成した型付きドキュメントを
 * 同一オリジンの /graphql に対して実行する（variables は完全に型検査される）。
 */
export class GraphQLQuizClient implements QuizClient {
  readonly transport = "graphql" as const;
  constructor(
    private readonly endpoint = "/graphql",
    private readonly apiKey?: string,
  ) {}

  private async execute<R, V>(doc: TypedDocumentNode<R, V>, variables: V): Promise<R> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
      },
      body: JSON.stringify({ query: print(doc), variables }),
    });
    const json = (await res.json()) as { data?: R; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data as R;
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    const d = await this.execute(GetQuizDoc, { id });
    return (d.quiz ?? null) as Quiz | null;
  }

  async searchQuizzes(args: SearchArgs): Promise<QuizSummary[]> {
    const d = await this.execute(SearchQuizzesDoc, {
      query: args.query,
      tags: args.tags,
      favoriteOnly: args.favoriteOnly,
    });
    return d.searchQuizzes as QuizSummary[];
  }

  async recentAttempts(limit = 20): Promise<AttemptSummary[]> {
    const d = await this.execute(RecentAttemptsDoc, { limit });
    return d.recentAttempts as AttemptSummary[];
  }

  async createQuiz(input: Parameters<QuizClient["createQuiz"]>[0]): Promise<Quiz> {
    const d = await this.execute(CreateQuizDoc, { input });
    return d.createQuiz as Quiz;
  }

  async editQuiz(quizId: string, patch: EditPatch): Promise<Quiz | null> {
    const d = await this.execute(EditQuizDoc, { quizId, patch });
    return (d.editQuiz ?? null) as Quiz | null;
  }

  async toggleFavorite(quizId: string): Promise<Quiz | null> {
    const d = await this.execute(ToggleFavoriteDoc, { quizId });
    return (d.toggleFavorite ?? null) as Quiz | null;
  }

  async submitAttempt(
    quizId: string,
    answers: AnswerSelection[],
    startedAt?: string,
  ): Promise<Attempt> {
    const d = await this.execute(SubmitAttemptDoc, { quizId, answers, startedAt });
    return d.submitAttempt as Attempt;
  }

  async submitSession(
    quizIds: string[],
    answers: AnswerSelection[],
    opts?: { startedAt?: string; title?: string },
  ): Promise<Attempt> {
    const d = await this.execute(SubmitSessionDoc, {
      quizIds,
      answers,
      startedAt: opts?.startedAt,
      title: opts?.title,
    });
    return d.submitSession as Attempt;
  }

  async getAttemptDetail(attemptId: string): Promise<AttemptDetail | null> {
    const d = await this.execute(GetAttemptDoc, { id: attemptId });
    return (d.attempt ?? null) as AttemptDetail | null;
  }

  async presentQuiz(args: { quizId?: string; tags?: string[] }): Promise<Quiz | null> {
    const d = await this.execute(PresentQuizDoc, { quizId: args.quizId, tags: args.tags });
    return (d.presentQuiz ?? null) as Quiz | null;
  }
}
