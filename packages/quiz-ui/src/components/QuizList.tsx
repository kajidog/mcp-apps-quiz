import type { Quiz, QuizSummary } from "@quiz/core";
import { useCallback, useEffect, useState } from "react";
import type { QuizClient } from "../client/types.js";
import { QuizReview } from "./QuizReview.js";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "./ui.js";

interface Props {
  client: QuizClient;
  initial?: QuizSummary[];
  /** 編集画面を開く */
  onEdit: (quiz: Quiz) => void;
}

/**
 * クイズ一覧（確認用）。検索し、カードを展開して中身を確認したり、
 * 選択肢をクリックして解説を見たり、編集を開いたりできる。受験はしない。
 */
export function QuizList({ client, initial, onEdit }: Props) {
  const [query, setQuery] = useState("");
  const [quizzes, setQuizzes] = useState<QuizSummary[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  // 展開中カードの完全なクイズ内容（id → Quiz）。null は読み込み中。
  const [expanded, setExpanded] = useState<Record<string, Quiz | null>>({});

  const search = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        setQuizzes(await client.searchQuizzes({ query: q || undefined }));
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  useEffect(() => {
    if (!initial) void search("");
  }, [initial, search]);

  async function toggleExpand(id: string) {
    if (id in expanded) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setExpanded((prev) => ({ ...prev, [id]: null }));
    const quiz = await client.getQuiz(id);
    setExpanded((prev) => ({ ...prev, [id]: quiz }));
  }

  async function openEdit(id: string) {
    const quiz = expanded[id] ?? (await client.getQuiz(id));
    if (quiz) onEdit(quiz);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・問題文・タグで検索"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit">検索</Button>
      </form>

      {loading && <p className="text-sm text-slate-500">読み込み中…</p>}
      {!loading && quizzes.length === 0 && (
        <p className="text-sm text-slate-500">
          クイズがありません。AI に作成を頼むか、新規作成しましょう。
        </p>
      )}

      {quizzes.map((q) => {
        const isOpen = q.id in expanded;
        const full = expanded[q.id];
        return (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>
                  {q.favorite && <span className="mr-1 text-amber-500">★</span>}
                  {q.title}
                </CardTitle>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" onClick={() => void toggleExpand(q.id)}>
                    {isOpen ? "閉じる" : "確認"}
                  </Button>
                  <Button variant="ghost" onClick={() => void openEdit(q.id)}>
                    編集
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {q.tags.map((t) => (
                    <Badge key={t}>#{t}</Badge>
                  ))}
                </div>
                <span className="text-xs text-slate-500">{q.questionCount} 問</span>
              </div>
              {isOpen && full === null && <p className="text-sm text-slate-500">読み込み中…</p>}
              {isOpen && full && <QuizReview quiz={full} />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
