/**
 * 配列の要素を from から to へ移動した新しい配列を返す純粋関数。
 * ネイティブ実装の並び替え確定に用いる（@dnd-kit 版はライブラリの arrayMove を使う）。
 * 範囲外インデックスは元配列のコピーを返す。
 */
export function arrayMove<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) {
    return next;
  }
  const moved = next.splice(from, 1)[0] as T;
  next.splice(to, 0, moved);
  return next;
}
