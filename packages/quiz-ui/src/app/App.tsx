import { HistoryList } from "@/features/history";
import { AttemptDetailView } from "@/features/history";
import { QuizEditor } from "@/features/quiz-editor";
import { QuizList } from "@/features/quiz-library";
import { QuizRunner } from "@/features/quiz-session";
import { QuizSession } from "@/features/quiz-session";
import { SessionRunner } from "@/features/quiz-session";
import { useInitialPayload, useTransport } from "@/shared/api";
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher.js";
import { Button } from "@/shared/ui/index.js";
import { useTranslation } from "react-i18next";
import { type View, useNavigation } from "./useNavigation.js";

/**
 * ルート画面。一覧（確認）/ 受験（絞り込み→まとめ受験）/ 履歴（詳細閲覧）/ 作成・編集 を切り替える。
 */
export function App() {
  const { transport } = useTransport();
  const initialPayload = useInitialPayload();
  const nav = useNavigation();
  const { t } = useTranslation("common");

  if (transport === "connecting") {
    return <p className="p-6 text-sm text-slate-500">{t("connecting")}</p>;
  }

  const navItems: { key: View; label: string }[] = [
    { key: "list", label: t("nav.list") },
    { key: "session", label: t("nav.session") },
    { key: "history", label: t("nav.history") },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="mr-2 font-bold">Quiz</span>
        {navItems.map((item) => (
          <Button
            key={item.key}
            variant={nav.view === item.key ? "secondary" : "ghost"}
            onClick={() => nav.goto(item.key)}
          >
            {item.label}
          </Button>
        ))}
        <Button variant={nav.view === "edit" ? "secondary" : "ghost"} onClick={nav.startCreate}>
          {t("nav.create")}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <span className="text-xs text-slate-400">{transport}</span>
        </div>
      </nav>

      {nav.view === "list" && (
        <QuizList
          initial={initialPayload?.kind === "list" ? initialPayload.quizzes : undefined}
          onEdit={nav.startEdit}
        />
      )}
      {nav.view === "session" && <QuizSession onStart={nav.startSession} />}
      {nav.view === "run" && (
        <SessionRunner
          quizIds={nav.sessionQuizIds}
          onBack={() => nav.goto("session")}
          onViewResult={nav.openAttempt}
        />
      )}
      {nav.view === "quiz" && nav.quiz && (
        <QuizRunner
          quiz={nav.quiz}
          onBack={() => nav.goto("list")}
          onEdit={() => nav.startEdit(nav.quiz!)}
        />
      )}
      {nav.view === "history" && (
        <HistoryList
          initial={initialPayload?.kind === "history" ? initialPayload.attempts : undefined}
          onOpen={nav.openAttempt}
        />
      )}
      {nav.view === "attempt" && nav.attemptId && (
        <AttemptDetailView attemptId={nav.attemptId} onBack={() => nav.goto("history")} />
      )}
      {nav.view === "edit" && (
        <QuizEditor quiz={nav.editTarget} onSaved={nav.onSaved} onCancel={() => nav.goto("list")} />
      )}
    </div>
  );
}
