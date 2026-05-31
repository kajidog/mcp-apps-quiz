import { useFeatureApi } from "@/shared/api";
import { type HistoryApi, createGraphqlHistoryApi, createMcpHistoryApi } from "./history.api.js";

/** 現在のトランスポートに応じた HistoryApi を返す（未確定時は null）。 */
export function useHistoryApi(): HistoryApi | null {
  return useFeatureApi(createMcpHistoryApi, createGraphqlHistoryApi);
}
