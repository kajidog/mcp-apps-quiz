import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { QuizService } from "@quiz/core";
import { registerAppOnlyTools, registerModelTools, registerQuizResource } from "./tools.js";

/**
 * クイズ MCP サーバーを 1 つ生成する。ステートレス HTTP では毎リクエスト生成し、
 * 共有の QuizService(=DB) を注入する。
 */
export function createMcpServer(service: QuizService): McpServer {
  const server = new McpServer({ name: "mcp-apps-quiz", version: "0.1.0" });
  registerModelTools(server, service);
  registerAppOnlyTools(server, service);
  registerQuizResource(server);
  return server;
}
