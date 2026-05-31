import { useInitialPayload } from "@/shared/api";
import type { Quiz } from "@quiz/core";
import { useEffect, useState } from "react";

export type View = "list" | "session" | "run" | "quiz" | "history" | "attempt" | "edit";

/**
 * ルート画面のビュー遷移を集約する。
 * MCP ホストからの初期ペイロード（出題/一覧/履歴）があれば初期ビューへ反映する。
 */
export function useNavigation() {
  const initialPayload = useInitialPayload();
  const [view, setView] = useState<View>("list");
  // 出題中の単一クイズ（"quiz" ビュー）
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // 編集対象。null なら新規作成として QuizEditor を開く。
  const [editTarget, setEditTarget] = useState<Quiz | null>(null);
  // まとめ受験の対象クイズ ID 群
  const [sessionQuizIds, setSessionQuizIds] = useState<string[]>([]);
  // 履歴詳細の対象 attempt ID
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPayload) return;
    if (initialPayload.kind === "quiz") {
      setQuiz(initialPayload.quiz);
      setView("quiz");
    } else if (initialPayload.kind === "list") {
      setView("list");
    } else if (initialPayload.kind === "history") {
      setView("history");
    }
  }, [initialPayload]);

  return {
    view,
    quiz,
    editTarget,
    sessionQuizIds,
    attemptId,
    goto: setView,
    startCreate() {
      setEditTarget(null);
      setView("edit");
    },
    startEdit(target: Quiz) {
      setEditTarget(target);
      setView("edit");
    },
    onSaved() {
      setEditTarget(null);
      setView("list");
    },
    startSession(ids: string[]) {
      setSessionQuizIds(ids);
      setView("run");
    },
    openAttempt(id: string) {
      setAttemptId(id);
      setView("attempt");
    },
  };
}
