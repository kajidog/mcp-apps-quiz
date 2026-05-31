import { useToggleFavorite } from "@/features/quiz-library";
import { QuizPlay } from "@/shared/components/QuizPlay.js";
import { Badge, Button, Card, CardContent } from "@/shared/ui/index.js";
import type { Attempt, Quiz } from "@quiz/core";
import { useMemo, useState } from "react";
import { useSubmitAttempt } from "../hooks/useSubmitAttempt.js";
import { type Selections, buildResultMap, toAnswers, toggleChoice } from "../lib/grading.js";

interface Props {
  quiz: Quiz;
  onBack?: () => void;
  onEdit?: () => void;
}

/** 単一クイズの出題・回答・採点結果表示を担うメイン画面。 */
export function QuizRunner({ quiz: initialQuiz, onBack, onEdit }: Props) {
  const submit = useSubmitAttempt();
  const favorite = useToggleFavorite();
  const [quiz, setQuiz] = useState(initialQuiz);
  const [selections, setSelections] = useState<Selections>({});
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  // この QuizRunner インスタンス（=1 回の出題）の開始時刻
  const [startedAt] = useState(() => new Date().toISOString());

  const resultByQuestion = useMemo(() => (attempt ? buildResultMap(attempt) : null), [attempt]);

  function toggle(questionId: string, choiceId: string) {
    setSelections((prev) => toggleChoice(prev, questionId, choiceId));
  }

  async function onSubmit() {
    const answers = toAnswers(quiz.questions, selections);
    setAttempt(await submit.mutateAsync({ quizId: quiz.id, answers, startedAt }));
  }

  function reset() {
    setAttempt(null);
    setSelections({});
  }

  async function onToggleFavorite() {
    const updated = await favorite.mutateAsync(quiz.id);
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
          <Button variant="ghost" onClick={() => void onToggleFavorite()} aria-label="favorite">
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
        onToggle={toggle}
      />

      {!attempt && (
        <Button onClick={() => void onSubmit()} disabled={submit.isPending} className="self-end">
          {submit.isPending ? "採点中…" : "採点する"}
        </Button>
      )}
    </div>
  );
}
