import type { Attempt, Quiz } from "@quiz/core";
import { useEffect, useMemo, useState } from "react";
import type { QuizClient } from "../client/types.js";
import { QuizPlay } from "./QuizPlay.js";
import { Button, Card, CardContent } from "./ui.js";

interface Props {
  quizIds: string[];
  client: QuizClient;
  onBack: () => void;
  /** 採点後に履歴詳細へ遷移する導線 */
  onViewResult?: (attemptId: string) => void;
}

/**
 * 選択した複数クイズの設問を連結し、1 セッションとしてまとめて受験する画面。
 * 未回答（スキップ）も許容し、最後に採点して履歴へ 1 件残す。
 */
export function SessionRunner({ quizIds, client, onBack, onViewResult }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    let active = true;
    void (async () => {
      const loaded = await Promise.all(quizIds.map((id) => client.getQuiz(id)));
      if (active) setQuizzes(loaded.filter((q): q is Quiz => !!q));
    })();
    return () => {
      active = false;
    };
  }, [quizIds, client]);

  const questions = useMemo(() => quizzes?.flatMap((q) => q.questions) ?? [], [quizzes]);

  const resultByQuestion = useMemo(() => {
    if (!attempt) return null;
    return new Map(attempt.results.map((r) => [r.questionId, r]));
  }, [attempt]);

  const answeredCount = questions.filter((q) => (selections[q.id]?.size ?? 0) > 0).length;

  function toggleChoice(questionId: string, choiceId: string) {
    setSelections((prev) => {
      const next = new Set(prev[questionId] ?? []);
      next.has(choiceId) ? next.delete(choiceId) : next.add(choiceId);
      return { ...prev, [questionId]: next };
    });
  }

  async function submit() {
    if (!quizzes) return;
    setSubmitting(true);
    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        choiceIds: [...(selections[q.id] ?? [])],
      }));
      setAttempt(
        await client.submitSession(
          quizzes.map((q) => q.id),
          answers,
          { startedAt },
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!quizzes) return <p className="p-4 text-sm text-slate-500">読み込み中…</p>;
  if (questions.length === 0)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <p className="text-sm text-slate-500">設問がありません。</p>
        <Button variant="outline" onClick={onBack} className="self-start">
          戻る
        </Button>
      </div>
    );

  const title =
    quizzes.length === 1
      ? quizzes[0]!.title
      : `まとめ受験（${quizzes.length}クイズ・${questions.length}問）`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{title}</h1>
          {!attempt && (
            <span className="text-xs text-slate-500">
              回答済み {answeredCount} / {questions.length}（未回答はスキップ可・不正解扱い）
            </span>
          )}
        </div>
        <Button variant="outline" onClick={onBack}>
          戻る
        </Button>
      </header>

      {attempt && (
        <Card className="border-slate-300 bg-slate-50">
          <CardContent className="flex items-center justify-between pt-5">
            <span className="text-lg font-semibold">
              スコア: {attempt.score} / {attempt.total}
            </span>
            <div className="flex gap-2">
              {onViewResult && (
                <Button variant="outline" onClick={() => onViewResult(attempt.id)}>
                  履歴で見る
                </Button>
              )}
              <Button onClick={onBack}>完了</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <QuizPlay
        questions={questions}
        selections={selections}
        resultByQuestion={resultByQuestion}
        onToggle={toggleChoice}
      />

      {!attempt && (
        <Button onClick={submit} disabled={submitting} className="self-end">
          {submitting ? "採点中…" : "採点する"}
        </Button>
      )}
    </div>
  );
}
