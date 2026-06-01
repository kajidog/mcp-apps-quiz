import { QuizPlay } from "@/shared/components/QuizPlay.js";
import { Button, Card, CardContent } from "@/shared/ui/index.js";
import type { Attempt } from "@quiz/core";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionQuizzes } from "../hooks/useSessionQuizzes.js";
import { useSubmitSession } from "../hooks/useSubmitSession.js";
import {
  type Selections,
  buildResultMap,
  countAnswered,
  toAnswers,
  toggleChoice,
} from "../lib/grading.js";

interface Props {
  quizIds: string[];
  onBack: () => void;
  /** 採点後に履歴詳細へ遷移する導線 */
  onViewResult?: (attemptId: string) => void;
}

/**
 * 選択した複数クイズの設問を連結し、1 セッションとしてまとめて受験する画面。
 * 未回答（スキップ）も許容し、最後に採点して履歴へ 1 件残す。
 */
export function SessionRunner({ quizIds, onBack, onViewResult }: Props) {
  const { t } = useTranslation(["session", "common"]);
  const submit = useSubmitSession();
  const { data: quizzes } = useSessionQuizzes(quizIds);
  const [selections, setSelections] = useState<Selections>({});
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());

  const questions = useMemo(() => quizzes?.flatMap((q) => q.questions) ?? [], [quizzes]);
  const resultByQuestion = useMemo(() => (attempt ? buildResultMap(attempt) : null), [attempt]);
  const answeredCount = countAnswered(questions, selections);

  function toggle(questionId: string, choiceId: string) {
    setSelections((prev) => toggleChoice(prev, questionId, choiceId));
  }

  async function onSubmit() {
    if (!quizzes) return;
    const answers = toAnswers(questions, selections);
    setAttempt(await submit.mutateAsync({ quizIds: quizzes.map((q) => q.id), answers, startedAt }));
  }

  if (!quizzes) return <p className="p-4 text-sm text-slate-500">{t("common:loading")}</p>;
  if (questions.length === 0)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <p className="text-sm text-slate-500">{t("runner.noQuestions")}</p>
        <Button variant="outline" onClick={onBack} className="self-start">
          {t("runner.back")}
        </Button>
      </div>
    );

  const title =
    quizzes.length === 1
      ? quizzes[0]!.title
      : t("runner.multiTitle", { quizCount: quizzes.length, questionCount: questions.length });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{title}</h1>
          {!attempt && (
            <span className="text-xs text-slate-500">
              {t("runner.answered", { answered: answeredCount, total: questions.length })}
            </span>
          )}
        </div>
        <Button variant="outline" onClick={onBack}>
          {t("runner.back")}
        </Button>
      </header>

      {attempt && (
        <Card className="border-slate-300 bg-slate-50">
          <CardContent className="flex items-center justify-between pt-5">
            <span className="text-lg font-semibold">
              {t("runner.score", { score: attempt.score, total: attempt.total })}
            </span>
            <div className="flex gap-2">
              {onViewResult && (
                <Button variant="outline" onClick={() => onViewResult(attempt.id)}>
                  {t("runner.viewInHistory")}
                </Button>
              )}
              <Button onClick={onBack}>{t("runner.done")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <QuizPlay
        questions={questions}
        selections={selections}
        resultByQuestion={resultByQuestion}
        onToggle={toggle}
      />

      {!attempt && (
        <Button onClick={() => void onSubmit()} disabled={submit.isPending} className="self-end">
          {submit.isPending ? t("runner.grading") : t("runner.grade")}
        </Button>
      )}
    </div>
  );
}
