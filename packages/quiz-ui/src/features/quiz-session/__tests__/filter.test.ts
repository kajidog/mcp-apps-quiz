import type { QuizSummary } from "@quiz/core";
import { describe, expect, it } from "vitest";
import { collectTags, filterQuizzes, totalQuestions } from "../lib/filter.js";

function quiz(p: Partial<QuizSummary>): QuizSummary {
  return {
    id: "id",
    title: "t",
    tags: [],
    favorite: false,
    questionCount: 0,
    createdAt: "",
    updatedAt: "",
    ...p,
  };
}

const all = [
  quiz({ id: "a", tags: ["IT", "資格"], favorite: true, questionCount: 5 }),
  quiz({ id: "b", tags: ["数学"], favorite: false, questionCount: 2 }),
  quiz({ id: "c", tags: ["IT"], favorite: false, questionCount: 10 }),
];

describe("collectTags", () => {
  it("重複を除きソートして返す", () => {
    expect(collectTags(all)).toEqual(["IT", "数学", "資格"]);
  });
});

describe("filterQuizzes", () => {
  const base = { favoriteOnly: false, minQuestions: 0, activeTags: new Set<string>() };

  it("お気に入りのみ", () => {
    expect(filterQuizzes(all, { ...base, favoriteOnly: true }).map((q) => q.id)).toEqual(["a"]);
  });
  it("最小問題数", () => {
    expect(filterQuizzes(all, { ...base, minQuestions: 5 }).map((q) => q.id)).toEqual(["a", "c"]);
  });
  it("タグ OR 一致", () => {
    expect(filterQuizzes(all, { ...base, activeTags: new Set(["IT"]) }).map((q) => q.id)).toEqual([
      "a",
      "c",
    ]);
  });
  it("複数条件の AND", () => {
    expect(
      filterQuizzes(all, {
        favoriteOnly: false,
        minQuestions: 5,
        activeTags: new Set(["IT"]),
      }).map((q) => q.id),
    ).toEqual(["a", "c"]);
  });
});

describe("totalQuestions", () => {
  it("合計問題数", () => {
    expect(totalQuestions(all)).toBe(17);
  });
});
