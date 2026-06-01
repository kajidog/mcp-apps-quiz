import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/index.js";
import type { Quiz, QuizSummary } from "@quiz/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLibraryApi } from "../api/useLibraryApi.js";
import { libraryKeys } from "../hooks/keys.js";
import { useQuizDetail } from "../hooks/useQuizDetail.js";
import { QuizReview } from "./QuizReview.js";

interface Props {
  summary: QuizSummary;
  onEdit: (quiz: Quiz) => void;
}

/** 一覧の1カード。展開時に完全なクイズ内容を遅延ロードして確認・編集導線を出す。 */
export function QuizListCard({ summary, onEdit }: Props) {
  const { t } = useTranslation(["library", "common"]);
  const api = useLibraryApi();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const detail = useQuizDetail(summary.id, open);

  async function openEdit() {
    const full =
      detail.data ??
      (await qc.fetchQuery({
        queryKey: libraryKeys.detail(summary.id),
        queryFn: () => api!.getQuiz(summary.id),
      }));
    if (full) onEdit(full);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            {summary.favorite && <span className="mr-1 text-amber-500">★</span>}
            {summary.title}
          </CardTitle>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => setOpen((v) => !v)}>
              {open ? t("card.close") : t("card.review")}
            </Button>
            <Button variant="ghost" onClick={() => void openEdit()}>
              {t("common:edit")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {summary.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {t("card.questionCount", { count: summary.questionCount })}
          </span>
        </div>
        {open && detail.isLoading && (
          <p className="text-sm text-slate-500">{t("common:loading")}</p>
        )}
        {open && detail.data && <QuizReview quiz={detail.data} />}
      </CardContent>
    </Card>
  );
}
