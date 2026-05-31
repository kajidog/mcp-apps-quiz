import type { Quiz } from "@quiz/core";
import { useQuery } from "@tanstack/react-query";
import { useSessionApi } from "../api/useSessionApi.js";
import { sessionKeys } from "./keys.js";

/** 指定 ID 群のクイズをまとめて取得する（存在しないものは除外）。 */
export function useSessionQuizzes(quizIds: string[]) {
  const api = useSessionApi();
  return useQuery({
    queryKey: sessionKeys.quizzes(quizIds),
    queryFn: async () => {
      const loaded = await Promise.all(quizIds.map((id) => api!.getQuiz(id)));
      return loaded.filter((q): q is Quiz => !!q);
    },
    enabled: !!api && quizIds.length > 0,
  });
}
