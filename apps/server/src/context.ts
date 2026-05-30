import { type QuizService, createQuizService } from "@quiz/core";
import type { ServerConfig } from "./config.js";

/**
 * アプリ全体で共有する依存。QuizService(=DB) は 1 インスタンスを共有し、
 * MCP・GraphQL の両経路から同じデータを参照する。
 */
export interface AppContext {
  config: ServerConfig;
  service: QuizService;
}

export function createAppContext(config: ServerConfig): AppContext {
  return {
    config,
    service: createQuizService(config.dbPath),
  };
}
