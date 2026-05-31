import { ApiProvider } from "@/shared/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// データ取得のキャッシュは TanStack Query が一元管理する。
// 埋め込み iframe では window focus の挙動が読みづらいため refetchOnWindowFocus は無効化。
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

/** アプリ全体のプロバイダ（Query キャッシュ + トランスポート）。 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider>{children}</ApiProvider>
    </QueryClientProvider>
  );
}
