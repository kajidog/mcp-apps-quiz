import { useQuizSearch } from "@/features/quiz-library";
import { cn } from "@/shared/lib/utils.js";
import { Badge, Button, Card, CardContent } from "@/shared/ui/index.js";
import { useMemo, useState } from "react";
import { collectTags, filterQuizzes, totalQuestions } from "../lib/filter.js";

interface Props {
  /** 選択したクイズ ID 群でまとめ受験を開始する */
  onStart: (quizIds: string[]) => void;
}

/**
 * 受験前の絞り込み画面。問題数・タグ・お気に入り・個別選択で対象を絞り、
 * 件数を確認してから「まとめ受験」を開始する。
 */
export function QuizSession({ onStart }: Props) {
  const { data: all = [], isLoading } = useQuizSearch("");

  const [minQuestions, setMinQuestions] = useState(0);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allTags = useMemo(() => collectTags(all), [all]);
  const filtered = useMemo(
    () => filterQuizzes(all, { favoriteOnly, minQuestions, activeTags }),
    [all, favoriteOnly, minQuestions, activeTags],
  );
  const target = useMemo(() => filtered.filter((q) => selected.has(q.id)), [filtered, selected]);
  const targetQuestionTotal = totalQuestions(target);

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelected((prev) => new Set([...prev, ...filtered.map((q) => q.id)]));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  if (isLoading) return <p className="p-4 text-sm text-slate-500">読み込み中…</p>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">受験するクイズを選ぶ</h1>

      {/* --- 絞り込み条件 --- */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5">
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-slate-700">問題数（{minQuestions} 問以上）</span>
            <input
              type="range"
              min={0}
              max={20}
              value={minQuestions}
              onChange={(e) => setMinQuestions(Number(e.target.value))}
              className="w-40"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={favoriteOnly}
              onChange={(e) => setFavoriteOnly(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="font-medium text-slate-700">お気に入りのみ</span>
          </label>

          {allTags.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">タグ</span>
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                      activeTags.has(tag)
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- 件数サマリ + 操作 --- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-600">
          条件に一致 <strong>{filtered.length}</strong> 件 / 選択中 <strong>{target.length}</strong>{" "}
          件・<strong>{targetQuestionTotal}</strong> 問
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={selectAllFiltered}>
            一致を全選択
          </Button>
          <Button variant="ghost" onClick={clearSelection}>
            選択解除
          </Button>
        </div>
      </div>

      {/* --- 個別選択リスト --- */}
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">条件に一致するクイズがありません。</p>
      )}
      {filtered.map((q) => {
        const checked = selected.has(q.id);
        return (
          <Card
            key={q.id}
            className={cn(
              "cursor-pointer",
              checked ? "border-slate-900" : "hover:border-slate-400",
            )}
            onClick={() => toggleSelect(q.id)}
          >
            <CardContent className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSelect(q.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label="このクイズを選択"
                className="h-4 w-4"
              />
              <div className="flex flex-1 flex-col">
                <span className="font-medium">
                  {q.favorite && <span className="mr-1 text-amber-500">★</span>}
                  {q.title}
                </span>
                <div className="flex flex-wrap gap-1">
                  {q.tags.map((t) => (
                    <Badge key={t}>#{t}</Badge>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-500">{q.questionCount} 問</span>
            </CardContent>
          </Card>
        );
      })}

      <Button
        onClick={() => onStart(target.map((q) => q.id))}
        disabled={target.length === 0}
        className="sticky bottom-4 self-end shadow-lg"
      >
        受験を始める（{targetQuestionTotal} 問）
      </Button>
    </div>
  );
}
