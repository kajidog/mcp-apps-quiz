import { QuizPlay } from "@/shared/components/QuizPlay.js";
import { Button, Card, CardContent } from "@/shared/ui/index.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAttemptDetail } from "../hooks/useAttemptDetail.js";
import { toAttemptPlayModel } from "../lib/attempt-view.js";

interface Props {
  attemptId: string;
  onBack: () => void;
}

/** 履歴 1 件の内容（出題内容・自分の解答・正解・解説）を読み取り専用で表示する。 */
export function AttemptDetailView({ attemptId, onBack }: Props) {
  const { i18n, t } = useTranslation(["history", "common"]);
  const { data: detail, isLoading } = useAttemptDetail(attemptId);

  const { questions, selections, resultByQuestion, missingCount } = useMemo(
    () => toAttemptPlayModel(detail),
    [detail],
  );

  if (isLoading) return <p className="p-4 text-sm text-slate-500">{t("common:loading")}</p>;
  if (!detail)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <p className="text-sm text-slate-500">{t("notFound")}</p>
        <Button variant="outline" onClick={onBack} className="self-start">
          {t("backToHistory")}
        </Button>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold">{detail.title}</h1>
          <span className="text-xs text-slate-500">
            {new Date(detail.finishedAt).toLocaleString(i18n.resolvedLanguage)}
          </span>
        </div>
        <Button variant="outline" onClick={onBack}>
          {t("backToHistory")}
        </Button>
      </header>

      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="pt-5 text-lg font-semibold">
          {t("score", { score: detail.score, total: detail.total })}
        </CardContent>
      </Card>

      <QuizPlay questions={questions} selections={selections} resultByQuestion={resultByQuestion} />

      {missingCount > 0 && (
        <p className="text-xs text-slate-400">
          {t("missingQuestions", { count: missingCount })}
        </p>
      )}
    </div>
  );
}
