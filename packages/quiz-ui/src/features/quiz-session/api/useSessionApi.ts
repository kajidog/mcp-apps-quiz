import { useFeatureApi } from "@/shared/api";
import { type SessionApi, createGraphqlSessionApi, createMcpSessionApi } from "./session.api.js";

/** 現在のトランスポートに応じた SessionApi を返す（未確定時は null）。 */
export function useSessionApi(): SessionApi | null {
  return useFeatureApi(createMcpSessionApi, createGraphqlSessionApi);
}
