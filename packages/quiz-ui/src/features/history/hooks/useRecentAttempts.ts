import type { AttemptSummary } from "@quiz/core";
import { useQuery } from "@tanstack/react-query";
import { useHistoryApi } from "../api/useHistoryApi.js";
import { historyKeys } from "./keys.js";

/** 直近の受験履歴一覧。`initialData` は MCP ホストからの初期ペイロード seed 用。 */
export function useRecentAttempts(limit = 20, initialData?: AttemptSummary[]) {
  const api = useHistoryApi();
  return useQuery({
    queryKey: historyKeys.recent(limit),
    queryFn: () => api!.recentAttempts(limit),
    enabled: !!api,
    initialData,
  });
}
