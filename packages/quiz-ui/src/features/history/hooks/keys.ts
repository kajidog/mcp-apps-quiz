/** history の React Query キー。受験採点後の invalidate からも参照する。 */
export const historyKeys = {
  all: ["history"] as const,
  recent: (limit: number) => ["history", "recent", limit] as const,
  detail: (id: string) => ["history", "detail", id] as const,
};
