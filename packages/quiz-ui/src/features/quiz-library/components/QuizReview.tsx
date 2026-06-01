import { cn } from "@/shared/lib/utils.js";
import type { Quiz } from "@quiz/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * 確認用のクイズ閲覧。設問の選択肢をクリックすると、その設問だけ
 * 正解と解説が開く（採点・履歴保存はしない）。
 */
export function QuizReview({ quiz }: { quiz: Quiz }) {
  const { t } = useTranslation("library");
  // 設問 ID → クリックした選択肢 ID（クリックで解説を開く）
  const [picked, setPicked] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-3">
      {quiz.questions.map((q, qi) => {
        const pick = picked[q.id];
        const revealed = pick !== undefined;
        return (
          <div key={q.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              Q{qi + 1}. {q.text}
            </p>
            {q.choices.map((c) => {
              const isPicked = pick === c.id;
              const showCorrect = revealed && c.isCorrect;
              const showWrong = revealed && isPicked && !c.isCorrect;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPicked((prev) => ({ ...prev, [q.id]: c.id }))}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    isPicked ? "border-slate-900 bg-slate-100" : "border-slate-200",
                    showCorrect && "border-green-500 bg-green-50",
                    showWrong && "border-red-400 bg-red-50",
                    "hover:bg-slate-50",
                  )}
                >
                  <span>{c.text}</span>
                  {showCorrect && (
                    <span className="ml-auto text-green-600">{t("review.correct")}</span>
                  )}
                </button>
              );
            })}
            {revealed && q.explanation && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {t("review.explanation")} {q.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
