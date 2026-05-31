import type { Attempt, Question } from "@quiz/core";
import { describe, expect, it } from "vitest";
import { buildResultMap, countAnswered, toAnswers, toggleChoice } from "../lib/grading.js";

const questions = [{ id: "q1" }, { id: "q2" }] as unknown as Question[];

describe("toggleChoice", () => {
  it("未選択を選択に、再度で解除する（非破壊）", () => {
    const s0 = {};
    const s1 = toggleChoice(s0, "q1", "c1");
    expect([...s1.q1!]).toEqual(["c1"]);
    expect(s0).toEqual({}); // 元は変更されない
    const s2 = toggleChoice(s1, "q1", "c1");
    expect([...s2.q1!]).toEqual([]);
  });
  it("複数選択を保持する", () => {
    const s = toggleChoice(toggleChoice({}, "q1", "c1"), "q1", "c2");
    expect([...s.q1!].sort()).toEqual(["c1", "c2"]);
  });
});

describe("toAnswers", () => {
  it("選択を解答配列に変換し、未選択は空配列にする", () => {
    const selections = { q1: new Set(["c1", "c2"]) };
    expect(toAnswers(questions, selections)).toEqual([
      { questionId: "q1", choiceIds: ["c1", "c2"] },
      { questionId: "q2", choiceIds: [] },
    ]);
  });
});

describe("buildResultMap", () => {
  it("設問IDで結果を引ける Map を返す", () => {
    const attempt = {
      results: [
        { questionId: "q1", selectedChoiceIds: [], correctChoiceIds: [], isCorrect: true },
        { questionId: "q2", selectedChoiceIds: [], correctChoiceIds: [], isCorrect: false },
      ],
    } as unknown as Attempt;
    const map = buildResultMap(attempt);
    expect(map.get("q1")?.isCorrect).toBe(true);
    expect(map.get("q2")?.isCorrect).toBe(false);
  });
});

describe("countAnswered", () => {
  it("1つ以上選択した設問数を数える", () => {
    expect(countAnswered(questions, { q1: new Set(["c1"]), q2: new Set() })).toBe(1);
  });
});
