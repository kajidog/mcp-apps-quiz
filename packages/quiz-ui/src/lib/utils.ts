/** 簡易 classNames 結合（shadcn の cn 相当。外部依存を避けた最小版）。 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
