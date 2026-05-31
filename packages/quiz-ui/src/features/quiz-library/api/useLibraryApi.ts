import { useFeatureApi } from "@/shared/api";
import { type LibraryApi, createGraphqlLibraryApi, createMcpLibraryApi } from "./library.api.js";

/** 現在のトランスポートに応じた LibraryApi を返す（未確定時は null）。 */
export function useLibraryApi(): LibraryApi | null {
  return useFeatureApi(createMcpLibraryApi, createGraphqlLibraryApi);
}
