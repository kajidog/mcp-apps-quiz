import type { SearchArgs } from "../api/library.api.js";

/** quiz-library の React Query キー。クロス feature の invalidate からも参照する。 */
export const libraryKeys = {
  all: ["quiz-library"] as const,
  search: (args: SearchArgs) => ["quiz-library", "search", args] as const,
  detail: (id: string) => ["quiz-library", "detail", id] as const,
};
