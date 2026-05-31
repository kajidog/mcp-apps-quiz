import type { GraphqlExecutor } from "@/shared/api";
import { fakeMcpCaller } from "@/test/utils";
import { describe, expect, it } from "vitest";
import { createGraphqlLibraryApi, createMcpLibraryApi } from "../api/library.api.js";

describe("LibraryApi (MCP マッピング)", () => {
  it("searchQuizzes は _search_quizzes の quizzes を返す", async () => {
    const caller = fakeMcpCaller((name) => {
      expect(name).toBe("_search_quizzes");
      return { structuredContent: { quizzes: [{ id: "q1" }] } };
    });
    const api = createMcpLibraryApi(caller);
    expect(await api.searchQuizzes({ query: "x" })).toEqual([{ id: "q1" }]);
  });

  it("getQuiz は isError のとき null", async () => {
    const api = createMcpLibraryApi(fakeMcpCaller(() => ({ isError: true })));
    expect(await api.getQuiz("nope")).toBeNull();
  });

  it("toggleFavorite は quiz を返す", async () => {
    const api = createMcpLibraryApi(
      fakeMcpCaller(() => ({ structuredContent: { quiz: { id: "q9" } } })),
    );
    expect((await api.toggleFavorite("q9"))?.id).toBe("q9");
  });
});

describe("LibraryApi (GraphQL マッピング)", () => {
  const exec = (data: unknown): GraphqlExecutor => (async () => data) as GraphqlExecutor;

  it("searchQuizzes は data.searchQuizzes", async () => {
    const api = createGraphqlLibraryApi(exec({ searchQuizzes: [{ id: "g1" }] }));
    expect(await api.searchQuizzes({})).toEqual([{ id: "g1" }]);
  });

  it("getQuiz は null フォールバック", async () => {
    const api = createGraphqlLibraryApi(exec({ quiz: null }));
    expect(await api.getQuiz("x")).toBeNull();
  });
});
