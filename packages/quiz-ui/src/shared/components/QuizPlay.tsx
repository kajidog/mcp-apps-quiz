import type { Question, QuestionResult } from "@quiz/core";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/index.js";

interface Props {
  questions: Question[];
  /** 設問 ID → 選択中の選択肢 ID 集合 */
  selections: Record<string, Set<string>>;
  /** 採点済み結果（あれば正誤・解説を表示し、選択を固定する）。null なら回答中。 */
  resultByQuestion?: Map<string, QuestionResult> | null;
  onToggle?: (questionId: string, choiceId: string) => void;
  /** 設問番号の表示開始（複数クイズ連結時の通し番号用、既定 0） */
  startIndex?: number;
}

/**
 * 設問・選択肢の描画と採点結果表示を担う表示専用コンポーネント。
 * 単一クイズ・まとめ受験・履歴詳細の 3 画面で共有する（横断ドメインコンポーネント）。
 */
export function QuizPlay({
  questions,
  selections,
  resultByQuestion,
  onToggle,
  startIndex = 0,
}: Props) {
  const { t } = useTranslation("common");
  const graded = !!resultByQuestion;
  return (
    <>
      {questions.map((q, qi) => {
        const result = resultByQuestion?.get(q.id);
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle>
                Q{startIndex + qi + 1}. {q.text}
                {result && (
                  <span
                    className={cn(
                      "ml-2 text-sm",
                      result.isCorrect ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {result.isCorrect ? t("quizPlay.correct") : t("quizPlay.incorrect")}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {q.choices.map((c) => {
                const selected = selections[q.id]?.has(c.id) ?? false;
                const showCorrect = graded && c.isCorrect;
                const showWrong = graded && selected && !c.isCorrect;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggle?.(q.id, c.id)}
                    disabled={graded}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      selected ? "border-slate-900 bg-slate-100" : "border-slate-200",
                      showCorrect && "border-green-500 bg-green-50",
                      showWrong && "border-red-400 bg-red-50",
                      graded ? "cursor-default" : "hover:bg-slate-50",
                    )}
                  >
                    <span className="font-mono text-xs text-slate-500">{selected ? "☑" : "☐"}</span>
                    <span>{c.text}</span>
                    {showCorrect && <span className="ml-auto text-green-600">✓</span>}
                  </button>
                );
              })}
              {result && q.explanation && (
                <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {t("quizPlay.explanation")} {q.explanation}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
