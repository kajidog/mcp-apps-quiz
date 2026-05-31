import type { QuizSummary } from "@quiz/core";
import { useQuery } from "@tanstack/react-query";
import { useLibraryApi } from "../api/useLibraryApi.js";
import { libraryKeys } from "./keys.js";

/**
 * タイトル・問題文・タグでクイズを検索する。
 * `initialData` は空クエリ（初期一覧）の seed 用。クエリを変えると別キーになるため、
 * 呼び出し側は空クエリのときだけ initialData を渡すこと。
 */
export function useQuizSearch(query: string, initialData?: QuizSummary[]) {
  const api = useLibraryApi();
  const args = { query: query || undefined };
  return useQuery({
    queryKey: libraryKeys.search(args),
    queryFn: () => api!.searchQuizzes(args),
    enabled: !!api,
    initialData,
  });
}
