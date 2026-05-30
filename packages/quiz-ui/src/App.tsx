import type { Quiz } from "@quiz/core";
import { useEffect, useState } from "react";
import { useQuizContext } from "./client/provider.js";
import { AttemptDetailView } from "./components/AttemptDetailView.js";
import { HistoryList } from "./components/HistoryList.js";
import { QuizEditor } from "./components/QuizEditor.js";
import { QuizList } from "./components/QuizList.js";
import { QuizRunner } from "./components/QuizRunner.js";
import { QuizSession } from "./components/QuizSession.js";
import { SessionRunner } from "./components/SessionRunner.js";
import { Button } from "./components/ui.js";

type View = "list" | "session" | "run" | "quiz" | "history" | "attempt" | "edit";

/**
 * ルート画面。一覧（確認）/ 受験（絞り込み→まとめ受験）/ 履歴（詳細閲覧）/ 作成・編集 を切り替える。
 * MCP ホストからの初期ペイロード（出題/一覧/履歴）があればそれを反映する。
 */
export function App() {
  const { client, transport, initialPayload } = useQuizContext();
  const [view, setView] = useState<View>("list");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // 編集対象。null なら新規作成として QuizEditor を開く。
  const [editTarget, setEditTarget] = useState<Quiz | null>(null);
  // まとめ受験の対象クイズ ID 群
  const [sessionQuizIds, setSessionQuizIds] = useState<string[]>([]);
  // 履歴詳細の対象 attempt ID
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // MCP ツール結果（quiz_present 等）を初期表示へ反映
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

  if (!client) {
    return <p className="p-6 text-sm text-slate-500">接続中…</p>;
  }

  function startCreate() {
    setEditTarget(null);
    setView("edit");
  }
  function startEdit(target: Quiz) {
    setEditTarget(target);
    setView("edit");
  }
  function onSaved() {
    setEditTarget(null);
    setView("list");
  }
  function startSession(ids: string[]) {
    setSessionQuizIds(ids);
    setView("run");
  }
  function openAttempt(id: string) {
    setAttemptId(id);
    setView("attempt");
  }

  const navItems: { key: View; label: string }[] = [
    { key: "list", label: "一覧" },
    { key: "session", label: "受験" },
    { key: "history", label: "履歴" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="mr-2 font-bold">Quiz</span>
        {navItems.map((item) => (
          <Button
            key={item.key}
            variant={view === item.key ? "secondary" : "ghost"}
            onClick={() => setView(item.key)}
          >
            {item.label}
          </Button>
        ))}
        <Button variant={view === "edit" ? "secondary" : "ghost"} onClick={startCreate}>
          新規作成
        </Button>
        <span className="ml-auto text-xs text-slate-400">{transport}</span>
      </nav>

      {view === "list" && (
        <QuizList
          client={client}
          initial={initialPayload?.kind === "list" ? initialPayload.quizzes : undefined}
          onEdit={startEdit}
        />
      )}
      {view === "session" && <QuizSession client={client} onStart={startSession} />}
      {view === "run" && (
        <SessionRunner
          quizIds={sessionQuizIds}
          client={client}
          onBack={() => setView("session")}
          onViewResult={openAttempt}
        />
      )}
      {view === "quiz" && quiz && (
        <QuizRunner
          quiz={quiz}
          client={client}
          onBack={() => setView("list")}
          onEdit={() => startEdit(quiz)}
        />
      )}
      {view === "history" && (
        <HistoryList
          client={client}
          initial={initialPayload?.kind === "history" ? initialPayload.attempts : undefined}
          onOpen={openAttempt}
        />
      )}
      {view === "attempt" && attemptId && (
        <AttemptDetailView
          attemptId={attemptId}
          client={client}
          onBack={() => setView("history")}
        />
      )}
      {view === "edit" && (
        <QuizEditor
          client={client}
          quiz={editTarget}
          onSaved={onSaved}
          onCancel={() => setView("list")}
        />
      )}
    </div>
  );
}
