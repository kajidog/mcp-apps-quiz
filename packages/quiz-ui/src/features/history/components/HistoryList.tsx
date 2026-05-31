import { Card, CardContent } from "@/shared/ui/index.js";
import type { AttemptSummary } from "@quiz/core";
import { useRecentAttempts } from "../hooks/useRecentAttempts.js";

interface Props {
  initial?: AttemptSummary[];
  /** 履歴 1 件の詳細（採点内容）を開く */
  onOpen: (attemptId: string) => void;
}

/** 直近の受験履歴一覧。 */
export function HistoryList({ initial, onOpen }: Props) {
  const { data: attempts = [], isLoading } = useRecentAttempts(20, initial);

  if (isLoading) return <p className="p-4 text-sm text-slate-500">読み込み中…</p>;
  if (attempts.length === 0)
    return <p className="p-4 text-sm text-slate-500">受験履歴はまだありません。</p>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2 p-4">
      {attempts.map((a) => (
        <Card
          key={a.id}
          className="cursor-pointer hover:border-slate-400"
          onClick={() => onOpen(a.id)}
        >
          <CardContent className="flex items-center justify-between pt-5">
            <div className="flex flex-col">
              <span className="font-medium">{a.quizTitle}</span>
              <span className="text-xs text-slate-500">
                {new Date(a.finishedAt).toLocaleString()}
              </span>
            </div>
            <span className="text-sm font-semibold">
              {a.score} / {a.total}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
