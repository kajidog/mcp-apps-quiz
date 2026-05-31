import { describe, expect, it } from "vitest";
import { buildQuestions, emptyQuestion, parseTags, validateBuiltQuiz } from "../lib/draft.js";

describe("parseTags", () => {
  it("カンマ区切りをトリムし空要素を除く", () => {
    expect(parseTags(" IT, 資格 ,, 基本情報 ")).toEqual(["IT", "資格", "基本情報"]);
  });
  it("空文字は空配列", () => {
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("buildQuestions", () => {
  it("空欄の選択肢を除去し、解説の空欄は undefined にする", () => {
    const built = buildQuestions([
      {
        text: " 設問 ",
        explanation: "   ",
        choices: [
          { text: " A ", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "B", isCorrect: false },
        ],
      },
    ]);
    expect(built).toEqual([
      {
        text: "設問",
        explanation: undefined,
        choices: [
          { text: "A", isCorrect: true },
          { text: "B", isCorrect: false },
        ],
      },
    ]);
  });
});

describe("validateBuiltQuiz", () => {
  const valid = buildQuestions([
    {
      text: "Q",
      explanation: "",
      choices: [
        { text: "A", isCorrect: true },
        { text: "B", isCorrect: false },
      ],
    },
  ]);

  it("正しい入力は null", () => {
    expect(validateBuiltQuiz("タイトル", valid)).toBeNull();
  });
  it("タイトル空はエラー", () => {
    expect(validateBuiltQuiz("  ", valid)).toMatch(/タイトル/);
  });
  it("設問0件はエラー", () => {
    expect(validateBuiltQuiz("t", [])).toMatch(/設問は 1/);
  });
  it("選択肢が2未満はエラー", () => {
    const built = buildQuestions([
      { ...emptyQuestion(), text: "Q", choices: [{ text: "A", isCorrect: true }] },
    ]);
    expect(validateBuiltQuiz("t", built)).toMatch(/選択肢は 2/);
  });
  it("正解なしはエラー", () => {
    const built = buildQuestions([
      {
        text: "Q",
        explanation: "",
        choices: [
          { text: "A", isCorrect: false },
          { text: "B", isCorrect: false },
        ],
      },
    ]);
    expect(validateBuiltQuiz("t", built)).toMatch(/正解/);
  });
});
