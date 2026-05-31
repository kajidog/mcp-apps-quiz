import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { App } from "@modelcontextprotocol/ext-apps";
import { parse } from "graphql";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGraphqlExecutor, createMcpCaller } from "../transport.js";

describe("createMcpCaller", () => {
  function callerReturning(result: unknown) {
    const app = { callServerTool: vi.fn(async () => result) } as unknown as App;
    return { caller: createMcpCaller(app), app };
  }

  it("structured は structuredContent をそのまま返す", async () => {
    const { caller } = callerReturning({ structuredContent: { quizzes: [{ id: "q1" }] } });
    const r = await caller.structured<{ quizzes: { id: string }[] }>("_search_quizzes", {});
    expect(r.quizzes[0]?.id).toBe("q1");
  });

  it("field は指定キーの値を返す", async () => {
    const { caller } = callerReturning({ structuredContent: { quiz: { id: "q1" } } });
    const quiz = await caller.field<{ id: string }>("_get_quiz", { quizId: "q1" }, "quiz");
    expect(quiz?.id).toBe("q1");
  });

  it("field は isError のとき null を返す", async () => {
    const { caller } = callerReturning({ isError: true, structuredContent: { quiz: { id: "x" } } });
    const quiz = await caller.field<{ id: string }>("_get_quiz", { quizId: "x" }, "quiz");
    expect(quiz).toBeNull();
  });

  it("call には name と arguments を渡す", async () => {
    const { caller, app } = callerReturning({ structuredContent: {} });
    await caller.call("_toggle_favorite", { quizId: "q1" });
    expect(app.callServerTool).toHaveBeenCalledWith({
      name: "_toggle_favorite",
      arguments: { quizId: "q1" },
    });
  });
});

describe("createGraphqlExecutor", () => {
  const Doc = parse(
    "query GetQuiz($id: ID!) { quiz(id: $id) { id } }",
  ) as unknown as TypedDocumentNode<{ quiz: { id: string } | null }, { id: string }>;

  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(body: unknown) {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => ({ json: async () => body }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("data を返す", async () => {
    stubFetch({ data: { quiz: { id: "q1" } } });
    const execute = createGraphqlExecutor("/graphql");
    const d = await execute(Doc, { id: "q1" });
    expect((d as { quiz: { id: string } }).quiz.id).toBe("q1");
  });

  it("errors があれば連結して throw する", async () => {
    stubFetch({ errors: [{ message: "boom" }, { message: "bad" }] });
    const execute = createGraphqlExecutor("/graphql");
    await expect(execute(Doc, { id: "q1" })).rejects.toThrow("boom; bad");
  });

  it("apiKey 指定時は X-API-Key ヘッダを付ける", async () => {
    const fetchMock = stubFetch({ data: {} });
    const execute = createGraphqlExecutor("/graphql", "secret");
    await execute(Doc, { id: "q1" });
    const init = fetchMock.mock.calls[0]?.[1];
    expect((init?.headers as Record<string, string>)["X-API-Key"]).toBe("secret");
  });
});
