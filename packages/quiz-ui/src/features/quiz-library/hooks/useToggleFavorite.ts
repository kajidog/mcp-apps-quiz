import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLibraryApi } from "../api/useLibraryApi.js";
import { libraryKeys } from "./keys.js";

/** お気に入りをトグルし、成功時に一覧・詳細キャッシュを無効化する。 */
export function useToggleFavorite() {
  const api = useLibraryApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => api!.toggleFavorite(quizId),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.all }),
  });
}
