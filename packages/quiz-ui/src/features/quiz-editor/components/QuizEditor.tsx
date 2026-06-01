import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/index.js";
import type { Quiz } from "@quiz/core";
import { useState } from "react";
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

/** クイズの新規作成・編集フォーム。設問・選択肢を動的に増減できる。 */
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{editing ? t("title.edit") : t("title.create")}</h1>
        <Button variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </header>

      <div className="flex flex-col gap-2">
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

      {questions.map((q, qi) => (
        // 設問・選択肢には安定 ID がないため index を key に用いる（並べ替えは未対応）。
        // biome-ignore lint/suspicious/noArrayIndexKey: drafts have no stable id
        <Card key={qi}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Q{qi + 1}</CardTitle>
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

            <div className="flex flex-col gap-2">
              {q.choices.map((c, ci) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: drafts have no stable id
                <div key={ci} className="flex items-center gap-2">
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
              ))}
              <Button variant="outline" onClick={() => addChoice(qi)} className="self-start">
                {t("fields.addChoice")}
              </Button>
            </div>

            <textarea
              value={q.explanation}
              onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
              placeholder={t("fields.explanationPlaceholder")}
              rows={2}
              className={inputClass}
            />
          </CardContent>
        </Card>
      ))}

      <Button variant="secondary" onClick={addQuestion}>
        {t("actions.addQuestion")}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={() => void onSave()} disabled={save.isPending} className="self-end">
        {save.isPending ? t("actions.saving") : editing ? t("actions.update") : t("actions.create")}
      </Button>
    </div>
  );
}
