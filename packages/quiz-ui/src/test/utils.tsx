import {
  type CallToolResult,
  TransportProvider,
  type TransportValue,
  createMcpCaller,
} from "@/shared/api";
import type { App } from "@modelcontextprotocol/ext-apps";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/** ツール呼び出しに対する固定レスポンスから McpCaller を作る（実体は本物の createMcpCaller）。 */
export function fakeMcpCaller(
  handler: (name: string, args: Record<string, unknown>) => CallToolResult,
) {
  const fakeApp = {
    callServerTool: async ({
      name,
      arguments: args,
    }: {
      name: string;
      arguments: Record<string, unknown>;
    }) => handler(name, args),
  } as unknown as App;
  return createMcpCaller(fakeApp);
}

/** QueryClientProvider + TransportProvider で包む renderHook 用ラッパを返す。 */
export function createWrapper(transport: Partial<TransportValue>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const value: TransportValue = {
    transport: "connecting",
    caller: null,
    executor: null,
    initialPayload: null,
    ...transport,
  };
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TransportProvider value={value}>{children}</TransportProvider>
      </QueryClientProvider>
    );
  };
}
