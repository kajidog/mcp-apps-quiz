import type { Attempt, Quiz } from "@quiz/core";
import { useMemo, useState } from "react";
import type { QuizClient } from "../client/types.js";
import { QuizPlay } from "./QuizPlay.js";
import { Badge, Button, Card, CardContent } from "./ui.js";

interface Props {
  quiz: Quiz;
  client: QuizClient;
  onBack?: () => void;
  onEdit?: () => void;
}

/** 単一クイズの出題・回答・採点結果表示を担うメイン画面。 */
export function QuizRunner({ quiz: initialQuiz, client, onBack, onEdit }: Props) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // この QuizRunner インスタンス（=1 回の出題）の開始時刻
  const [startedAt] = useState(() => new Date().toISOString());

  const resultByQuestion = useMemo(() => {
    if (!attempt) return null;
    return new Map(attempt.results.map((r) => [r.questionId, r]));
  }, [attempt]);

  function toggleChoice(questionId: string, choiceId: string) {
    setSelections((prev) => {
      const next = new Set(prev[questionId] ?? []);
      next.has(choiceId) ? next.delete(choiceId) : next.add(choiceId);
      return { ...prev, [questionId]: next };
    });
  }

  async function submit() {
    setSubmitting(true);
    try {
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        choiceIds: [...(selections[q.id] ?? [])],
      }));
      setAttempt(await client.submitAttempt(quiz.id, answers, startedAt));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAttempt(null);
    setSelections({});
  }

  async function toggleFavorite() {
    const updated = await client.toggleFavorite(quiz.id);
    if (updated) setQuiz(updated);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <div className="flex flex-wrap gap-1">
            {quiz.tags.map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={toggleFavorite} aria-label="favorite">
            {quiz.favorite ? "★" : "☆"}
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              編集
            </Button>
          )}
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              一覧へ
            </Button>
          )}
        </div>
      </header>

      {attempt && (
        <Card className="border-slate-300 bg-slate-50">
          <CardContent className="flex items-center justify-between pt-5">
            <span className="text-lg font-semibold">
              スコア: {attempt.score} / {attempt.total}
            </span>
            <Button onClick={reset}>もう一度</Button>
          </CardContent>
        </Card>
      )}

      <QuizPlay
        questions={quiz.questions}
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
