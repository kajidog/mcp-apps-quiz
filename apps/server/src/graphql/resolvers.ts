import type { QuizService } from "@quiz/core";

/**
 * GraphQL リゾルバ。MCP ツールと同じく QuizService に委譲するだけの薄い層。
 */
export function createResolvers(service: QuizService) {
  return {
    Query: {
      quiz: (_: unknown, { id }: { id: string }) => service.getQuiz(id),
      searchQuizzes: (
        _: unknown,
        args: {
          query?: string | null;
          tags?: string[] | null;
          favoriteOnly?: boolean | null;
          limit?: number | null;
        },
      ) =>
        service.searchQuizzes({
          query: args.query ?? undefined,
          tags: args.tags ?? undefined,
          favoriteOnly: args.favoriteOnly ?? undefined,
          limit: args.limit ?? 20,
        }),
      recentAttempts: (_: unknown, { limit }: { limit?: number | null }) =>
        service.recentAttempts(limit ?? 20),
      attempt: (_: unknown, { id }: { id: string }) => service.getAttemptDetail(id),
    },
    Mutation: {
      createQuiz: (_: unknown, { input }: { input: unknown }) => service.createQuiz(input),
      editQuiz: (_: unknown, args: { quizId: string; patch: unknown }) =>
        service.editQuiz({ quizId: args.quizId, patch: args.patch as never }),
      toggleFavorite: (_: unknown, { quizId }: { quizId: string }) =>
        service.toggleFavorite(quizId),
      deleteQuiz: (_: unknown, { quizId }: { quizId: string }) => service.deleteQuiz(quizId),
      submitAttempt: (
        _: unknown,
        args: { quizId: string; answers: unknown; startedAt?: string | null },
      ) =>
        service.recordAttempt({
          quizId: args.quizId,
          answers: args.answers as never,
          startedAt: args.startedAt ?? undefined,
        }),
      submitSession: (
        _: unknown,
        args: {
          quizIds: string[];
          answers: unknown;
          startedAt?: string | null;
          title?: string | null;
        },
      ) =>
        service.recordSession({
          quizIds: args.quizIds,
          answers: args.answers as never,
          startedAt: args.startedAt ?? undefined,
          title: args.title ?? undefined,
        }),
      presentQuiz: (_: unknown, args: { quizId?: string | null; tags?: string[] | null }) =>
        service.presentQuiz({ quizId: args.quizId ?? undefined, tags: args.tags ?? undefined }),
    },
  };
}
