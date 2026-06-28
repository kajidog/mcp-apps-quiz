import { graphql } from "@/gql";
import type { GraphqlExecutor, McpCaller } from "@/shared/api";
import type { Quiz, QuizSummary } from "@quiz/core";
import "@/shared/api/graphql/fragments.js";

export interface SearchArgs {
  query?: string;
  tags?: string[];
  favoriteOnly?: boolean;
}

/** クイズ一覧・確認に関するデータアクセス。 */
export interface LibraryApi {
  searchQuizzes(args: SearchArgs): Promise<QuizSummary[]>;
  getQuiz(id: string): Promise<Quiz | null>;
  toggleFavorite(quizId: string): Promise<Quiz | null>;
  /** クイズを削除する。削除できたら true。 */
  deleteQuiz(quizId: string): Promise<boolean>;
}

const SearchQuizzesDoc = graphql(`
  query SearchQuizzes($query: String, $tags: [String!], $favoriteOnly: Boolean) {
    searchQuizzes(query: $query, tags: $tags, favoriteOnly: $favoriteOnly) {
      id title tags favorite questionCount createdAt updatedAt
    }
  }
`);
const GetQuizDoc = graphql(`
  query GetQuiz($id: ID!) { quiz(id: $id) { ...QuizFields } }
`);
const ToggleFavoriteDoc = graphql(`
  mutation ToggleFavorite($quizId: ID!) { toggleFavorite(quizId: $quizId) { ...QuizFields } }
`);
const DeleteQuizDoc = graphql(`
  mutation DeleteQuiz($quizId: ID!) { deleteQuiz(quizId: $quizId) }
`);

export function createMcpLibraryApi(caller: McpCaller): LibraryApi {
  return {
    async searchQuizzes(args) {
      const r = await caller.structured<{ quizzes: QuizSummary[] }>("_search_quizzes", { ...args });
      return r.quizzes;
    },
    getQuiz: (id) => caller.field<Quiz>("_get_quiz", { quizId: id }, "quiz"),
    toggleFavorite: (quizId) => caller.field<Quiz>("_toggle_favorite", { quizId }, "quiz"),
    async deleteQuiz(quizId) {
      const r = await caller.call("_delete_quiz", { quizId });
      return !r.isError;
    },
  };
}

export function createGraphqlLibraryApi(execute: GraphqlExecutor): LibraryApi {
  return {
    async searchQuizzes(args) {
      const d = await execute(SearchQuizzesDoc, {
        query: args.query,
        tags: args.tags,
        favoriteOnly: args.favoriteOnly,
      });
      return d.searchQuizzes as QuizSummary[];
    },
    async getQuiz(id) {
      const d = await execute(GetQuizDoc, { id });
      return (d.quiz ?? null) as Quiz | null;
    },
    async toggleFavorite(quizId) {
      const d = await execute(ToggleFavoriteDoc, { quizId });
      return (d.toggleFavorite ?? null) as Quiz | null;
    },
    async deleteQuiz(quizId) {
      const d = await execute(DeleteQuizDoc, { quizId });
      return Boolean(d.deleteQuiz);
    },
  };
}
