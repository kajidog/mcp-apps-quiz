import { historyKeys } from "@/features/history";
import type { AnswerSelection } from "@/shared/api";
import type { Attempt } from "@quiz/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionApi } from "../api/useSessionApi.js";

interface Vars {
  quizIds: string[];
  answers: AnswerSelection[];
  startedAt?: string;
  title?: string;
}

/** 複数クイズをまとめて採点し、成功時に履歴キャッシュを無効化する。 */
export function useSubmitSession() {
  const api = useSessionApi();
  const qc = useQueryClient();
  return useMutation<Attempt, Error, Vars>({
    mutationFn: ({ quizIds, answers, startedAt, title }) =>
      api!.submitSession(quizIds, answers, { startedAt, title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: historyKeys.all }),
  });
}
