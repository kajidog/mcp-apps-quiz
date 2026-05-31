import { createWrapper, fakeMcpCaller } from "@/test/utils";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useQuizSearch } from "../hooks/useQuizSearch.js";

describe("useQuizSearch", () => {
  it("MCP トランスポートから検索結果を取得する", async () => {
    const caller = fakeMcpCaller((name, args) => {
      expect(name).toBe("_search_quizzes");
      expect(args).toMatchObject({ query: "react" });
      return { structuredContent: { quizzes: [{ id: "q1", title: "React" }] } };
    });
    const wrapper = createWrapper({ transport: "mcp", caller });

    const { result } = renderHook(() => useQuizSearch("react"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.title).toBe("React");
  });

  it("トランスポート未確定の間はフェッチしない", () => {
    const wrapper = createWrapper({ transport: "connecting" });
    const { result } = renderHook(() => useQuizSearch("x"), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
