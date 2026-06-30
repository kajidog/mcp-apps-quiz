import { cn } from "@/shared/lib/utils.js";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/index.js";
import {
  type DndKitItemRender,
  DndKitSortableList,
  type NativeItemRender,
  NativeSortableList,
} from "@/shared/ui/sortable/index.js";
import type { Quiz } from "@quiz/core";
import { type HTMLAttributes, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSaveQuiz } from "../hooks/useSaveQuiz.js";
import {
  type ChoiceDraft,
  type QuestionDraft,
  buildQuestions,
  emptyChoice,
  emptyQuestion,
  parseTags,
  toDraft,
  validateBuiltQuiz,
} from "../lib/draft.js";

interface Props {
  /** 指定時は編集モード。未指定なら新規作成。 */
  quiz?: Quiz | null;
  /** 保存完了時に確定したクイズを渡す */
  onSaved: (quiz: Quiz) => void;
  onCancel: () => void;
}

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
const handleClass =
  "flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-100 active:cursor-grabbing";

/** クイズの新規作成・編集フォーム。設問・選択肢を動的に増減・並び替えできる。 */
export function QuizEditor({ quiz, onSaved, onCancel }: Props) {
  const { t } = useTranslation("editor");
  const editing = !!quiz;
  const save = useSaveQuiz();
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [tags, setTags] = useState((quiz?.tags ?? []).join(", "));
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    quiz ? toDraft(quiz) : [emptyQuestion()],
  );
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(qi: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }
  function updateChoice(qi: number, ci: number, patch: Partial<ChoiceDraft>) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, choices: q.choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }
          : q,
      ),
    );
  }
  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }
  function removeQuestion(qi: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  }
  function addChoice(qi: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, choices: [...q.choices, emptyChoice()] } : q)),
    );
  }
  function removeChoice(qi: number, ci: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, choices: q.choices.filter((_, j) => j !== ci) } : q)),
    );
  }
  // 並び替えは共有状態を丸ごと差し替えるだけ（保存時に配列順 = order として確定される）。
  function reorderQuestions(next: QuestionDraft[]) {
    setQuestions(next);
  }
  function reorderChoices(qi: number, next: ChoiceDraft[]) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, choices: next } : q)));
  }

  async function onSave() {
    setError(null);
    const cleanTitle = title.trim();
    const cleanTags = parseTags(tags);
    const builtQuestions = buildQuestions(questions);

    const validationError = validateBuiltQuiz(cleanTitle, builtQuestions, {
      titleRequired: () => t("errors.titleRequired"),
      questionsRequired: () => t("errors.questionsRequired"),
      questionTextRequired: (number) => t("errors.questionTextRequired", { number }),
      choicesRequired: (number) => t("errors.choicesRequired", { number }),
      correctChoiceRequired: (number) => t("errors.correctChoiceRequired", { number }),
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const result = await save.mutateAsync({
        quizId: quiz?.id,
        title: cleanTitle,
        tags: cleanTags,
        questions: builtQuestions,
      });
      if (!result) {
        setError(t("errors.saveFailed"));
        return;
      }
      onSaved(result);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /**
   * 設問編集カード本体。並び替えハンドルは引数で受け取り、汎用リスト側の dnd 制御を差し込む。
   * dnd-kit 版・ネイティブ版どちらのリストからも同じ描画関数を再利用する。
   */
  function renderQuestionCard(
    q: QuestionDraft,
    handleProps: HTMLAttributes<HTMLElement>,
  ): ReactNode {
    const qi = questions.findIndex((x) => x.id === q.id);
    if (qi === -1) return null;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t("reorder.dragHandleAria")}
                className={handleClass}
                {...handleProps}
              >
                ⋮⋮
              </button>
              <CardTitle>Q{qi + 1}</CardTitle>
            </div>
            {questions.length > 1 && (
              <Button variant="ghost" onClick={() => removeQuestion(qi)}>
                {t("actions.removeQuestion")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <textarea
            value={q.text}
            onChange={(e) => updateQuestion(qi, { text: e.target.value })}
            placeholder={t("fields.questionPlaceholder")}
            rows={2}
            className={inputClass}
          />

          <NativeSortableList
            items={q.choices}
            getItemId={(c) => c.id ?? ""}
            onReorder={(next) => reorderChoices(qi, next)}
            renderItem={(c, info) => renderChoiceRow(qi, q, c, info)}
          />
          <Button variant="outline" onClick={() => addChoice(qi)} className="self-start">
            {t("fields.addChoice")}
          </Button>

          <textarea
            value={q.explanation}
            onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
            placeholder={t("fields.explanationPlaceholder")}
            rows={2}
            className={inputClass}
          />
        </CardContent>
      </Card>
    );
  }

  /** 選択肢 1 行。並び替えハンドルは汎用リストから渡される handleProps を使う。 */
  function renderChoiceRow(qi: number, q: QuestionDraft, c: ChoiceDraft, info: NativeItemRender) {
    const ci = q.choices.findIndex((x) => x.id === c.id);
    if (ci === -1) return null;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t("reorder.choiceHandleAria")}
          className={cn(handleClass, "h-6")}
          {...info.handleProps}
        >
          ⋮
        </button>
        <input
          type="checkbox"
          checked={c.isCorrect}
          onChange={(e) => updateChoice(qi, ci, { isCorrect: e.target.checked })}
          aria-label={t("fields.correctChoiceAria")}
          className="h-4 w-4"
        />
        <input
          value={c.text}
          onChange={(e) => updateChoice(qi, ci, { text: e.target.value })}
          placeholder={t("fields.choicePlaceholder", { number: ci + 1 })}
          className={inputClass}
        />
        {q.choices.length > 2 && (
          <Button
            variant="ghost"
            onClick={() => removeChoice(qi, ci)}
            aria-label={t("fields.removeChoiceAria")}
          >
            ✕
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{editing ? t("title.edit") : t("title.create")}</h1>
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </header>

      <div className="flex max-w-2xl flex-col gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="quiz-title">
          {t("fields.title")}
        </label>
        <input
          id="quiz-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("fields.titlePlaceholder")}
          className={inputClass}
        />
        <label className="text-sm font-medium text-slate-700" htmlFor="quiz-tags">
          {t("fields.tags")}
        </label>
        <input
          id="quiz-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t("fields.tagsPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t("reorder.sectionTitle")}</h2>
        <p className="text-sm text-slate-500">{t("reorder.sectionHint")}</p>
      </div>

      {/* 同じ questions 状態を共有する 2 実装を左右に並べて比較する。 */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t("reorder.dndkitLabel")}
          </span>
          <DndKitSortableList
            items={questions}
            getItemId={(q) => q.id ?? ""}
            onReorder={reorderQuestions}
            renderItem={(q, info: DndKitItemRender) => renderQuestionCard(q, info.handleProps)}
          />
        </section>

        <section className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {t("reorder.nativeLabel")}
          </span>
          <NativeSortableList
            items={questions}
            getItemId={(q) => q.id ?? ""}
            onReorder={reorderQuestions}
            renderItem={(q, info: NativeItemRender) => renderQuestionCard(q, info.handleProps)}
          />
        </section>
      </div>

      <Button variant="secondary" onClick={addQuestion} className="max-w-2xl">
        {t("actions.addQuestion")}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={() => void onSave()} disabled={save.isPending} className="self-end">
        {save.isPending ? t("actions.saving") : editing ? t("actions.update") : t("actions.create")}
      </Button>
    </div>
  );
}
