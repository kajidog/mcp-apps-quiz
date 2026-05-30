import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { Attempt, AttemptDetail, AttemptSummary, Quiz, QuizSummary } from "@quiz/core";
import { type ReactNode, createContext, useContext, useMemo, useState } from "react";
import { GraphQLQuizClient } from "./graphql.js";
import { McpQuizClient } from "./mcp.js";
import type { QuizClient } from "./types.js";

/** サーバのツール結果 structuredContent と同じ形 */
export type ToolPayload =
  | { kind: "quiz"; quiz: Quiz }
  | { kind: "list"; quizzes: QuizSummary[] }
  | { kind: "history"; attempts: AttemptSummary[] }
  | { kind: "attempt"; attempt: Attempt }
  | { kind: "attemptDetail"; detail: AttemptDetail }
  | { kind: "error"; message: string };

interface QuizContextValue {
  client: QuizClient | null;
  transport: "mcp" | "graphql" | "connecting";
  /** MCP ホストがツールを呼んだ際に届く初期ペイロード（出題など） */
  initialPayload: ToolPayload | null;
}

const QuizContext = createContext<QuizContextValue>({
  client: null,
  transport: "connecting",
  initialPayload: null,
});

/** トップウィンドウ（=ブラウザ単体）か iframe 埋め込み（=MCP ホスト）かを判定 */
function detectEmbedded(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

export function QuizClientProvider({ children }: { children: ReactNode }) {
  const isEmbedded = useMemo(detectEmbedded, []);
  const [initialPayload, setInitialPayload] = useState<ToolPayload | null>(null);

  // 埋め込み時のみ MCP ホストへ接続を試みる。トップウィンドウでは接続は成立しない。
  const { app, error } = useApp({
    appInfo: { name: "Quiz App", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = (result) => {
        const payload = (result as { structuredContent?: ToolPayload }).structuredContent;
        if (payload) setInitialPayload(payload);
      };
      a.onteardown = async () => ({});
      a.onerror = (e) => console.error(e);
    },
  });

  const value = useMemo<QuizContextValue>(() => {
    if (isEmbedded && app) {
      return { client: new McpQuizClient(app), transport: "mcp", initialPayload };
    }
    if (!isEmbedded || error) {
      // ブラウザ単体、または MCP 接続失敗時は GraphQL 経路へフォールバック
      return { client: new GraphQLQuizClient(), transport: "graphql", initialPayload };
    }
    return { client: null, transport: "connecting", initialPayload };
  }, [isEmbedded, app, error, initialPayload]);

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuizContext(): QuizContextValue {
  return useContext(QuizContext);
}
