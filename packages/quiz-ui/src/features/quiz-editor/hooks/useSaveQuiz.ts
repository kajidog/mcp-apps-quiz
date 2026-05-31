import { libraryKeys } from "@/features/quiz-library";
import type { CreateQuizInput, Quiz } from "@quiz/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditorApi } from "../api/useEditorApi.js";

export interface SaveQuizInput {
  /** 指定時は編集、未指定なら新規作成。 */
  quizId?: string;
  title: string;
  tags: string[];
  questions: CreateQuizInput["questions"];
}

/** 新規作成・編集を1つの mutation で扱い、成功時に一覧キャッシュを無効化する。 */
export function useSaveQuiz() {
  const api = useEditorApi();
  const qc = useQueryClient();
  return useMutation<Quiz | null, Error, SaveQuizInput>({
    mutationFn: ({ quizId, title, tags, questions }) =>
      quizId
        ? api!.editQuiz(quizId, { title, tags, questions })
        : api!.createQuiz({ title, tags, questions }),
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.all }),
  });
}
