import type { AttemptDetail, Question, QuestionResult } from "@quiz/core";
import { useEffect, useMemo, useState } from "react";
import type { QuizClient } from "../client/types.js";
import { QuizPlay } from "./QuizPlay.js";
import { Button, Card, CardContent } from "./ui.js";

interface Props {
  attemptId: string;
  client: QuizClient;
  onBack: () => void;
}

/** 履歴 1 件の内容（出題内容・自分の解答・正解・解説）を読み取り専用で表示する。 */
export function AttemptDetailView({ attemptId, client, onBack }: Props) {
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const d = await client.getAttemptDetail(attemptId);
      if (active) {
        setDetail(d);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [attemptId, client]);

  // AttemptDetail を QuizPlay が扱える形（設問配列 + 選択状態 + 採点結果）へ変換
  const { questions, selections, resultByQuestion, missingCount } = useMemo(() => {
    const questions: Question[] = [];
    const selections: Record<string, Set<string>> = {};
    const results = new Map<string, QuestionResult>();
    let missingCount = 0;
    for (const a of detail?.answers ?? []) {
      if (!a.question) {
        missingCount++;
        continue;
      }
      questions.push(a.question);
      selections[a.question.id] = new Set(a.selectedChoiceIds);
      results.set(a.question.id, {
        questionId: a.question.id,
        selectedChoiceIds: a.selectedChoiceIds,
        correctChoiceIds: a.correctChoiceIds,
        isCorrect: a.isCorrect,
      });
    }
    return { questions, selections, resultByQuestion: results, missingCount };
  }, [detail]);

  if (loading) return <p className="p-4 text-sm text-slate-500">読み込み中…</p>;
  if (!detail)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <p className="text-sm text-slate-500">履歴が見つかりませんでした。</p>
        <Button variant="outline" onClick={onBack} className="self-start">
          履歴へ
        </Button>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{detail.title}</h1>
          <span className="text-xs text-slate-500">
            {new Date(detail.finishedAt).toLocaleString()}
          </span>
        </div>
        <Button variant="outline" onClick={onBack}>
          履歴へ
        </Button>
      </header>

      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="pt-5 text-lg font-semibold">
          スコア: {detail.score} / {detail.total}
        </CardContent>
      </Card>

      <QuizPlay questions={questions} selections={selections} resultByQuestion={resultByQuestion} />

      {missingCount > 0 && (
        <p className="text-xs text-slate-400">
          ※ {missingCount} 件の設問は編集・削除により表示できません。
        </p>
      )}
    </div>
  );
}
