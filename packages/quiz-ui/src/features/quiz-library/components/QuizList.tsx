import { Button } from "@/shared/ui/index.js";
import type { Quiz, QuizSummary } from "@quiz/core";
import { useState } from "react";
import { useQuizSearch } from "../hooks/useQuizSearch.js";
import { QuizListCard } from "./QuizListCard.js";

interface Props {
  initial?: QuizSummary[];
  /** 編集画面を開く */
  onEdit: (quiz: Quiz) => void;
}

/**
 * クイズ一覧（確認用）。検索し、カードを展開して中身を確認したり、
 * 選択肢をクリックして解説を見たり、編集を開いたりできる。受験はしない。
 */
export function QuizList({ initial, onEdit }: Props) {
  // 入力中のクエリ（draft）と、実際に検索を投げたクエリ（submitted）を分ける。
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState("");
  // initialData は空クエリ（初期一覧）のときだけ seed に使う。
  const { data: quizzes = [], isLoading } = useQuizSearch(
    submitted,
    submitted ? undefined : initial,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="タイトル・問題文・タグで検索"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit">検索</Button>
      </form>

      {isLoading && <p className="text-sm text-slate-500">読み込み中…</p>}
      {!isLoading && quizzes.length === 0 && (
        <p className="text-sm text-slate-500">
          クイズがありません。AI に作成を頼むか、新規作成しましょう。
        </p>
      )}

      {quizzes.map((q) => (
        <QuizListCard key={q.id} summary={q} onEdit={onEdit} />
      ))}
    </div>
  );
}
