import { cn } from "@/shared/lib/utils.js";
import { type DragEvent, type HTMLAttributes, type ReactNode, useState } from "react";
import { arrayMove } from "./reorder.js";

/** renderItem に渡るドラッグ制御情報。trigger="handle" のとき handleProps をハンドル要素へ spread する。 */
export interface NativeItemRender {
  handleProps: HTMLAttributes<HTMLElement>;
  isDragging: boolean;
}

export interface NativeSortableListProps<T> {
  items: T[];
  /** ドメインを渡さず、安定 ID の抽出関数だけを受け取る。 */
  getItemId: (item: T) => string;
  /** 並び替え確定後の新しい配列を返す。 */
  onReorder: (next: T[]) => void;
  renderItem: (item: T, info: NativeItemRender) => ReactNode;
  /** "handle"（既定）=専用ハンドルのみドラッグ可 / "item"=アイテム全体ドラッグ可。 */
  trigger?: "handle" | "item";
  disabled?: boolean;
  /** リスト全体のスタイル。 */
  className?: string;
  /** 各アイテムラッパのスタイル。 */
  itemClassName?: string;
}

/**
 * ライブラリ非依存の汎用並び替えリスト（HTML5 Drag and Drop API のみで実装、ドメイン非依存）。
 *
 * handle モードでは、ラッパの draggable をハンドル押下時にだけ有効化することで、
 * 行内のテキスト入力でのテキスト選択を妨げず、ハンドル以外からのドラッグを抑止する。
 *
 * 制約: HTML5 DnD はキーボード操作・タッチ操作に非対応（その用途では dnd-kit 版を使う）。
 */
export function NativeSortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  trigger = "handle",
  disabled = false,
  className,
  itemClassName,
}: NativeSortableListProps<T>) {
  // ドラッグ中の元 index / ドラッグ先 index（挿入位置の表示用）。
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // handle モードで「いまハンドルが押されたアイテム」だけを draggable にする。
  const [armedIndex, setArmedIndex] = useState<number | null>(null);

  function reset() {
    setDragIndex(null);
    setOverIndex(null);
    setArmedIndex(null);
  }

  function handleDrop(target: number) {
    if (dragIndex !== null && dragIndex !== target) {
      onReorder(arrayMove(items, dragIndex, target));
    }
    reset();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((item, index) => {
        const id = getItemId(item);
        const isDragging = dragIndex === index;
        const showDropBefore = overIndex === index && dragIndex !== null && dragIndex > index;
        const showDropAfter = overIndex === index && dragIndex !== null && dragIndex < index;

        // handle モードではハンドル押下でその行を一時的に draggable にする。
        const handleProps: HTMLAttributes<HTMLElement> =
          trigger === "handle"
            ? {
                onPointerDown: () => {
                  if (!disabled) setArmedIndex(index);
                },
                onPointerUp: () => setArmedIndex(null),
                style: { cursor: "grab", touchAction: "none" },
              }
            : {};

        const draggable = !disabled && (trigger === "item" || armedIndex === index);

        function onDragStart(e: DragEvent<HTMLDivElement>) {
          // handle モードでハンドル外から始まったドラッグはキャンセル。
          if (trigger === "handle" && armedIndex !== index) {
            e.preventDefault();
            return;
          }
          setDragIndex(index);
          e.dataTransfer.effectAllowed = "move";
          // Firefox はデータが無いとドラッグを開始しないため必須。
          e.dataTransfer.setData("text/plain", id);
        }

        function onDragOver(e: DragEvent<HTMLDivElement>) {
          if (dragIndex === null) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (overIndex !== index) setOverIndex(index);
        }

        return (
          <div
            key={id}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            onDragEnd={reset}
            className={cn(
              "transition-shadow",
              showDropBefore && "border-t-2 border-slate-900",
              showDropAfter && "border-b-2 border-slate-900",
              isDragging && "opacity-60",
              itemClassName,
            )}
          >
            {renderItem(item, { handleProps, isDragging })}
          </div>
        );
      })}
    </div>
  );
}
