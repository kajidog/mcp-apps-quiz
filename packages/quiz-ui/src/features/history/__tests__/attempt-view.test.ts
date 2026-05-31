import type { AttemptDetail } from "@quiz/core";
import { describe, expect, it } from "vitest";
import { toAttemptPlayModel } from "../lib/attempt-view.js";

const detail = {
  id: "a1",
  title: "T",
  score: 1,
  total: 2,
  startedAt: "",
  finishedAt: "",
  answers: [
    {
      questionId: "q1",
      selectedChoiceIds: ["c1"],
      correctChoiceIds: ["c1"],
      isCorrect: true,
      question: {
        id: "q1",
        order: 0,
        text: "Q1",
        explanation: null,
        choices: [{ id: "c1", order: 0, text: "A", isCorrect: true }],
      },
    },
    {
      // 設問が削除され復元できない解答
      questionId: "q2",
      selectedChoiceIds: ["c9"],
      correctChoiceIds: [],
      isCorrect: false,
      question: null,
    },
  ],
} as unknown as AttemptDetail;

describe("toAttemptPlayModel", () => {
  it("復元できる設問だけを並べ、選択状態と採点結果を作る", () => {
    const m = toAttemptPlayModel(detail);
    expect(m.questions.map((q) => q.id)).toEqual(["q1"]);
    expect([...m.selections.q1!]).toEqual(["c1"]);
    expect(m.resultByQuestion.get("q1")?.isCorrect).toBe(true);
  });

  it("復元できない解答を missingCount に数える", () => {
    expect(toAttemptPlayModel(detail).missingCount).toBe(1);
  });

  it("null/undefined は空モデル", () => {
    const m = toAttemptPlayModel(null);
    expect(m.questions).toEqual([]);
    expect(m.missingCount).toBe(0);
  });
});
