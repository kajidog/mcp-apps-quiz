import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "./db/client.js";
import { DrizzleQuizRepository } from "./repository.js";
import type { CreateQuizInput } from "./schemas.js";
import { QuizService } from "./service.js";

function makeService() {
  return new QuizService(new DrizzleQuizRepository(createDb(":memory:")));
}

const sampleQuiz: CreateQuizInput = {
  title: "TypeScript 基礎",
  tags: ["typescript", "programming"],
  questions: [
    {
      text: "TypeScript の型注釈の記号は？",
      explanation: "コロンで型を注釈する",
      choices: [
        { text: ":", isCorrect: true },
        { text: "::", isCorrect: false },
        { text: "->", isCorrect: false },
      ],
    },
    {
      text: "次のうち真偽値型はどれ（複数選択）",
      explanation: "boolean のみ",
      choices: [
        { text: "boolean", isCorrect: true },
        { text: "bool", isCorrect: false },
        { text: "Boolean(プリミティブ)", isCorrect: false },
      ],
    },
  ],
};

describe("QuizService", () => {
  let svc: QuizService;
  beforeEach(() => {
    svc = makeService();
  });

  it("作成→取得で内容が往復する", () => {
    const created = svc.createQuiz(sampleQuiz);
    expect(created.id).toBeTruthy();
    const fetched = svc.getQuiz(created.id);
    expect(fetched?.title).toBe("TypeScript 基礎");
    expect(fetched?.tags.sort()).toEqual(["programming", "typescript"]);
    expect(fetched?.questions).toHaveLength(2);
    expect(fetched?.questions[0]?.choices).toHaveLength(3);
  });

  it("削除すると取得できなくなり、存在しない ID は false", () => {
    const created = svc.createQuiz(sampleQuiz);
    expect(svc.deleteQuiz(created.id)).toBe(true);
    expect(svc.getQuiz(created.id)).toBeNull();
    // 一覧からも消える
    expect(svc.searchQuizzes({}).some((q) => q.id === created.id)).toBe(false);
    // 二重削除・存在しない ID は false
    expect(svc.deleteQuiz(created.id)).toBe(false);
    expect(svc.deleteQuiz("does-not-exist")).toBe(false);
  });

  it("不正な入力を弾く（正解なし）", () => {
    expect(() =>
      svc.createQuiz({
        title: "bad",
        tags: [],
        questions: [
          {
            text: "q",
            choices: [
              { text: "a", isCorrect: false },
              { text: "b", isCorrect: false },
            ],
          },
        ],
      }),
    ).toThrow();
  });

  it("タイトル・問題文・タグで検索できる", () => {
    svc.createQuiz(sampleQuiz);
    svc.createQuiz({
      title: "Go 入門",
      tags: ["go"],
      questions: [
        {
          text: "Go のスライス宣言は？",
          choices: [
            { text: "[]int", isCorrect: true },
            { text: "Array<int>", isCorrect: false },
          ],
        },
      ],
    });

    expect(svc.searchQuizzes({ query: "TypeScript" })).toHaveLength(1); // タイトルヒット
    expect(svc.searchQuizzes({ query: "型注釈" })).toHaveLength(1); // 問題文ヒット
    expect(svc.searchQuizzes({ tags: ["go"] })).toHaveLength(1);
    expect(svc.searchQuizzes({})).toHaveLength(2);
  });

  it("採点: 完全一致のみ正答（部分点なし）", () => {
    const quiz = svc.createQuiz(sampleQuiz);
    const q0 = quiz.questions[0]!;
    const q1 = quiz.questions[1]!;
    const correct0 = q0.choices.find((c) => c.isCorrect)!.id;
    const correct1 = q1.choices.find((c) => c.isCorrect)!.id;
    const wrong1 = q1.choices.find((c) => !c.isCorrect)!.id;

    const attempt = svc.recordAttempt({
      quizId: quiz.id,
      answers: [
        { questionId: q0.id, choiceIds: [correct0] },
        { questionId: q1.id, choiceIds: [correct1, wrong1] }, // 余分を含むので不正解
      ],
    });
    expect(attempt.total).toBe(2);
    expect(attempt.score).toBe(1);
    expect(attempt.results[0]?.isCorrect).toBe(true);
    expect(attempt.results[1]?.isCorrect).toBe(false);
  });

  it("履歴が新しい順で取得できる", () => {
    const quiz = svc.createQuiz(sampleQuiz);
    svc.recordAttempt({ quizId: quiz.id, answers: [] });
    svc.recordAttempt({ quizId: quiz.id, answers: [] });
    const recent = svc.recentAttempts(10);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.quizTitle).toBe("TypeScript 基礎");
  });

  it("セッション: 複数クイズをまとめて採点し履歴1件にまとめる", () => {
    const q1 = svc.createQuiz(sampleQuiz); // 2問
    const q2 = svc.createQuiz({
      title: "Go 入門",
      tags: ["go"],
      questions: [
        {
          text: "Go のスライス宣言は？",
          choices: [
            { text: "[]int", isCorrect: true },
            { text: "Array<int>", isCorrect: false },
          ],
        },
      ],
    }); // 1問
    const correctGo = q2.questions[0]!.choices.find((c) => c.isCorrect)!.id;
    const correct0 = q1.questions[0]!.choices.find((c) => c.isCorrect)!.id;

    const attempt = svc.recordSession({
      quizIds: [q1.id, q2.id],
      answers: [
        { questionId: q1.questions[0]!.id, choiceIds: [correct0] },
        // q1 の2問目はスキップ（未回答=不正解）
        { questionId: q2.questions[0]!.id, choiceIds: [correctGo] },
      ],
    });
    expect(attempt.total).toBe(3);
    expect(attempt.score).toBe(2);

    const recent = svc.recentAttempts(10);
    expect(recent).toHaveLength(1); // まとめて1件
    expect(recent[0]?.quizTitle).toContain("まとめ受験");
    expect(recent[0]?.total).toBe(3);
  });

  it("履歴詳細: 出題内容・自分の解答・正解・解説が取得できる", () => {
    const quiz = svc.createQuiz(sampleQuiz);
    const q0 = quiz.questions[0]!;
    const correct0 = q0.choices.find((c) => c.isCorrect)!.id;
    const attempt = svc.recordSession({
      quizIds: [quiz.id],
      answers: [{ questionId: q0.id, choiceIds: [correct0] }],
    });

    const detail = svc.getAttemptDetail(attempt.id);
    expect(detail?.title).toBe("TypeScript 基礎"); // 単一クイズは元クイズ名
    expect(detail?.answers).toHaveLength(2);
    const a0 = detail!.answers.find((a) => a.questionId === q0.id)!;
    expect(a0.question?.text).toBe(q0.text);
    expect(a0.question?.explanation).toBe("コロンで型を注釈する");
    expect(a0.selectedChoiceIds).toEqual([correct0]);
    expect(a0.correctChoiceIds).toEqual([correct0]);
    expect(a0.isCorrect).toBe(true);
  });

  it("お気に入りトグル", () => {
    const quiz = svc.createQuiz(sampleQuiz);
    expect(quiz.favorite).toBe(false);
    expect(svc.toggleFavorite(quiz.id)?.favorite).toBe(true);
    expect(svc.toggleFavorite(quiz.id)?.favorite).toBe(false);
  });

  it("編集で設問を差し替えられる", () => {
    const quiz = svc.createQuiz(sampleQuiz);
    const edited = svc.editQuiz({
      quizId: quiz.id,
      patch: {
        title: "改訂版",
        questions: [
          {
            text: "新しい設問",
            choices: [
              { text: "正", isCorrect: true },
              { text: "誤", isCorrect: false },
            ],
          },
        ],
      },
    });
    expect(edited?.title).toBe("改訂版");
    expect(edited?.questions).toHaveLength(1);
    expect(edited?.questions[0]?.text).toBe("新しい設問");
  });
});
