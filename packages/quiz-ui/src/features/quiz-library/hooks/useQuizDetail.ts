import { useQuery } from "@tanstack/react-query";
import { useLibraryApi } from "../api/useLibraryApi.js";
import { libraryKeys } from "./keys.js";

/** クイズ1件の完全な内容を取得する（`enabled` が true のときだけフェッチ）。 */
export function useQuizDetail(id: string, enabled = true) {
  const api = useLibraryApi();
  return useQuery({
    queryKey: libraryKeys.detail(id),
    queryFn: () => api!.getQuiz(id),
    enabled: enabled && !!api,
  });
}
