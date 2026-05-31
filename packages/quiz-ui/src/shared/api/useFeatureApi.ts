import { useMemo } from "react";
import { useTransport } from "./provider.js";
import type { GraphqlExecutor, McpCaller } from "./transport.js";

/**
 * feature の API スライスを現在のトランスポートに応じて組み立てる共通フック。
 * 各 feature はこれをラップして `useXxxApi()` を1行で定義する。
 * トランスポート未確定（connecting）の間は null を返す。
 */
export function useFeatureApi<T>(
  fromMcp: (caller: McpCaller) => T,
  fromGraphql: (executor: GraphqlExecutor) => T,
): T | null {
  const { transport, caller, executor } = useTransport();
  return useMemo(() => {
    if (transport === "mcp" && caller) return fromMcp(caller);
    if (transport === "graphql" && executor) return fromGraphql(executor);
    return null;
  }, [transport, caller, executor, fromMcp, fromGraphql]);
}
