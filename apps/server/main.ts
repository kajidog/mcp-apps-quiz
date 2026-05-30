/**
 * クイズ MCP サーバーのエントリポイント。
 *   tsx main.ts            … HTTP モード（/mcp・/graphql・UI）
 *   tsx main.ts --stdio    … stdio MCP モード（ローカル MCP クライアント用）
 */
import { serve } from "@hono/node-server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./src/config.js";
import { createAppContext } from "./src/context.js";
import { createApp } from "./src/http.js";
import { createMcpServer } from "./src/mcp/server.js";

async function main() {
  const config = loadConfig();
  const ctx = createAppContext(config);

  if (process.argv.includes("--stdio")) {
    const server = createMcpServer(ctx.service);
    await server.connect(new StdioServerTransport());
    console.error("quiz MCP server connected over stdio");
    return;
  }

  const app = createApp(ctx);
  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`Quiz server listening on http://localhost:${info.port}`);
    console.log(`  MCP:     POST http://localhost:${info.port}/mcp`);
    console.log(`  GraphQL: POST http://localhost:${info.port}/graphql (GraphiQL: GET 同URL)`);
    console.log(`  UI:      GET  http://localhost:${info.port}/`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
