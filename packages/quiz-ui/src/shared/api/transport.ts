import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { App } from "@modelcontextprotocol/ext-apps";
import { print } from "graphql";

/**
 * 低レベルのトランスポート抽象。
 * UI のデータアクセスは MCP App 経路(callServerTool)とブラウザ経路(GraphQL)の 2 系統あり、
 * 各 feature の API スライスはこの 2 つのプリミティブ（McpCaller / GraphqlExecutor）から組み立てる。
 */

export interface CallToolResult {
  structuredContent?: unknown;
  isError?: boolean;
  content?: { type: string; text?: string }[];
}

/** MCP App 経路: サーバの UI 専用ツールを呼び、structuredContent を取り出す。 */
export interface McpCaller {
  /** 生のツール呼び出し結果を返す。 */
  call(name: string, args: Record<string, unknown>): Promise<CallToolResult>;
  /** structuredContent 全体を型 T として取り出す（isError は無視）。 */
  structured<T>(name: string, args: Record<string, unknown>): Promise<T>;
  /** isError のとき null、それ以外は structuredContent の指定キーの値を返す。 */
  field<T>(name: string, args: Record<string, unknown>, key: string): Promise<T | null>;
}

export function createMcpCaller(app: App): McpCaller {
  const call: McpCaller["call"] = async (name, args) =>
    (await app.callServerTool({ name, arguments: args })) as CallToolResult;

  return {
    call,
    async structured(name, args) {
      const r = await call(name, args);
      return r.structuredContent as never;
    },
    async field(name, args, key) {
      const r = await call(name, args);
      if (r.isError) return null;
      const content = (r.structuredContent ?? {}) as Record<string, unknown>;
      return content[key] as never;
    },
  };
}

/** ブラウザ経路: 共有 SDL から生成した型付きドキュメントを /graphql で実行する。 */
export type GraphqlExecutor = <R, V>(doc: TypedDocumentNode<R, V>, variables: V) => Promise<R>;

export function createGraphqlExecutor(endpoint = "/graphql", apiKey?: string): GraphqlExecutor {
  return async (doc, variables) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify({ query: print(doc), variables }),
    });
    const json = (await res.json()) as { data?: unknown; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data as never;
  };
}
