import { historyKeys } from "@/features/history";
import type { AnswerSelection } from "@/shared/api";
import type { Attempt } from "@quiz/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionApi } from "../api/useSessionApi.js";

interface Vars {
  quizId: string;
  answers: AnswerSelection[];
  startedAt?: string;
}

/** 単一クイズを採点し、成功時に履歴キャッシュを無効化する。 */
export function useSubmitAttempt() {
  const api = useSessionApi();
  const qc = useQueryClient();
  return useMutation<Attempt, Error, Vars>({
    mutationFn: ({ quizId, answers, startedAt }) => api!.submitAttempt(quizId, answers, startedAt),
    onSuccess: () => qc.invalidateQueries({ queryKey: historyKeys.all }),
  });
}
