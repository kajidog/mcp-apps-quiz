import { graphqlServer } from "@hono/graphql-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiKeyAuth } from "./auth.js";
import type { AppContext } from "./context.js";
import { buildGraphQLSchema } from "./graphql/schema.js";
import { loadQuizHtml } from "./mcp/resource.js";
import { createMcpServer } from "./mcp/server.js";

/**
 * MCP(/mcp)・GraphQL(/graphql)・ブラウザ UI(/) を同居させた単一 Hono アプリ。
 */
export function createApp(ctx: AppContext): Hono {
  const app = new Hono();
  const auth = apiKeyAuth(ctx.config);

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "mcp-session-id",
        "mcp-protocol-version",
        "X-API-Key",
        "Authorization",
      ],
      exposeHeaders: ["mcp-session-id", "mcp-protocol-version"],
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  // MCP: ステートレス。リクエストごとに transport + server を生成し共有 service を注入。
  app.all("/mcp", auth, async (c) => {
    const transport = new WebStandardStreamableHTTPServerTransport();
    const server = createMcpServer(ctx.service);
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
  });

  // GraphQL（ブラウザ経路）
  const schema = buildGraphQLSchema(ctx.service);
  app.use("/graphql", auth);
  app.use("/graphql", graphqlServer({ schema, graphiql: true }));

  // ブラウザ単体 UI（単一 HTML バンドルをそのまま配信）
  const html = loadQuizHtml();
  app.get("/", (c) => c.html(html));
  app.get("/index.html", (c) => c.html(html));

  return app;
}
