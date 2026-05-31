/** quiz-session の React Query キー。 */
export const sessionKeys = {
  all: ["quiz-session"] as const,
  quizzes: (ids: string[]) => ["quiz-session", "quizzes", ids] as const,
};
