import { useFeatureApi } from "@/shared/api";
import { type EditorApi, createGraphqlEditorApi, createMcpEditorApi } from "./editor.api.js";

/** 現在のトランスポートに応じた EditorApi を返す（未確定時は null）。 */
export function useEditorApi(): EditorApi | null {
  return useFeatureApi(createMcpEditorApi, createGraphqlEditorApi);
}
