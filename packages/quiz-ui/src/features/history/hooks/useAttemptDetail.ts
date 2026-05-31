import { useQuery } from "@tanstack/react-query";
import { useHistoryApi } from "../api/useHistoryApi.js";
import { historyKeys } from "./keys.js";

/** 履歴1件の採点済み詳細を取得する。 */
export function useAttemptDetail(attemptId: string) {
  const api = useHistoryApi();
  return useQuery({
    queryKey: historyKeys.detail(attemptId),
    queryFn: () => api!.getAttemptDetail(attemptId),
    enabled: !!api && !!attemptId,
  });
}
