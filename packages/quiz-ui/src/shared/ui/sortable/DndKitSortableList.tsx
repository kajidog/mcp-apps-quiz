import { cn } from "@/shared/lib/utils.js";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HTMLAttributes, ReactNode } from "react";

/** renderItem に渡るドラッグ制御情報。trigger="handle" のとき handleProps をハンドル要素へ spread する。 */
export interface DndKitItemRender {
  handleProps: HTMLAttributes<HTMLElement>;
  isDragging: boolean;
}

export interface DndKitSortableListProps<T> {
  items: T[];
  /** ドメインを渡さず、安定 ID の抽出関数だけを受け取る。 */
  getItemId: (item: T) => string;
  /** 並び替え確定後の新しい配列を返す。 */
  onReorder: (next: T[]) => void;
  renderItem: (item: T, info: DndKitItemRender) => ReactNode;
  /** "handle"（既定）=専用ハンドルのみドラッグ可 / "item"=アイテム全体ドラッグ可。 */
  trigger?: "handle" | "item";
  disabled?: boolean;
  /** リスト全体のスタイル。 */
  className?: string;
  /** 各アイテムラッパのスタイル。 */
  itemClassName?: string;
}

interface SortableItemProps {
  id: string;
  trigger: "handle" | "item";
  disabled: boolean;
  className?: string;
  children: (info: DndKitItemRender) => ReactNode;
}

function SortableItem({ id, trigger, disabled, className, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    // ドラッグ中の要素を最前面に。
    zIndex: isDragging ? 1 : undefined,
  };

  // handle モードでは listeners をハンドルにだけ付け、item モードではラッパ全体に付ける。
  // dnd-kit の attributes は role: string などを含み HTMLAttributes と厳密一致しないため cast する。
  const dragProps = { ...attributes, ...listeners } as unknown as HTMLAttributes<HTMLElement>;
  const handleProps: HTMLAttributes<HTMLElement> = trigger === "handle" ? dragProps : {};
  const wrapperDragProps: HTMLAttributes<HTMLElement> = trigger === "item" ? dragProps : {};

  return (
    <div ref={setNodeRef} style={style} className={className} {...wrapperDragProps}>
      {children({ handleProps, isDragging })}
    </div>
  );
}

/**
 * @dnd-kit を使った汎用の縦並び替えリスト（ドメイン非依存）。
 * ポインタ操作に加えキーボード操作（ハンドルにフォーカス→Space→矢印）でも並び替え可能。
 */
export function DndKitSortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  trigger = "handle",
  disabled = false,
  className,
  itemClassName,
}: DndKitSortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map(getItemId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>
        <div className={cn("flex flex-col gap-2", className)}>
          {items.map((item) => {
            const id = getItemId(item);
            return (
              <SortableItem
                key={id}
                id={id}
                trigger={trigger}
                disabled={disabled}
                className={itemClassName}
              >
                {(info) => renderItem(item, info)}
              </SortableItem>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
