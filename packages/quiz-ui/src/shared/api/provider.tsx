import { useApp } from "@modelcontextprotocol/ext-apps/react";
import { type ReactNode, createContext, useContext, useMemo, useState } from "react";
import {
  type GraphqlExecutor,
  type McpCaller,
  createGraphqlExecutor,
  createMcpCaller,
} from "./transport.js";
import type { ToolPayload } from "./types.js";

/**
 * トランスポートの状態。各 feature はここから caller / executor を取り出して
 * 自分の API スライス（createMcp○○Api / createGraphql○○Api）を組み立てる。
 * これにより shared は feature に依存せず、feature 追加で本ファイルを触る必要がない。
 */
export interface TransportValue {
  transport: "mcp" | "graphql" | "connecting";
  caller: McpCaller | null;
  executor: GraphqlExecutor | null;
  /** MCP ホストがツールを呼んだ際に届く初期ペイロード（出題など） */
  initialPayload: ToolPayload | null;
}

const TransportContext = createContext<TransportValue>({
  transport: "connecting",
  caller: null,
  executor: null,
  initialPayload: null,
});

/** トップウィンドウ（=ブラウザ単体）か iframe 埋め込み（=MCP ホスト）かを判定 */
function detectEmbedded(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

/**
 * 埋め込み時は MCP ホストへ接続して McpCaller を、トップウィンドウ（または接続失敗）時は
 * GraphqlExecutor を提供する。判定とブリッジはここに集約する。
 */
export function ApiProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<TransportValue>(() => {
    if (isEmbedded && app) {
      return { transport: "mcp", caller: createMcpCaller(app), executor: null, initialPayload };
    }
    if (!isEmbedded || error) {
      // ブラウザ単体、または MCP 接続失敗時は GraphQL 経路へフォールバック
      return {
        transport: "graphql",
        caller: null,
        executor: createGraphqlExecutor(),
        initialPayload,
      };
    }
    return { transport: "connecting", caller: null, executor: null, initialPayload };
  }, [isEmbedded, app, error, initialPayload]);

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}

export function useTransport(): TransportValue {
  return useContext(TransportContext);
}

/** MCP ホストからの初期ペイロード（なければ null）。 */
export function useInitialPayload(): ToolPayload | null {
  return useTransport().initialPayload;
}

/**
 * テスト用に任意の TransportValue を流し込むプロバイダ。
 * 実アプリでは {@link ApiProvider} を使う。
 */
export const TransportProvider = TransportContext.Provider;
