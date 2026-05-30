import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** MCP App UI リソースの URI。ツールの `_meta.ui.resourceUri` と一致させる。 */
export const QUIZ_RESOURCE_URI = "ui://quiz/mcp-app.html";

/**
 * quiz-ui のビルド済み単一 HTML (dist/mcp-app.html) を読み込む。
 * pnpm workspace 上では @quiz/ui の package.json から dist パスを解決する。
 * 未ビルドの場合はプレースホルダ HTML を返す（開発時に落ちないように）。
 */
export function loadQuizHtml(): string {
  const override = process.env.QUIZ_UI_HTML;
  if (override && existsSync(override)) return readFileSync(override, "utf-8");

  try {
    // @quiz/ui の exports に登録した単一 HTML を解決する
    const htmlPath = require.resolve("@quiz/ui/mcp-app.html");
    if (existsSync(htmlPath)) return readFileSync(htmlPath, "utf-8");
  } catch {
    // fall through to placeholder
  }

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Quiz</title></head>
<body><div id="root">クイズ UI が未ビルドです。<code>pnpm -F @quiz/ui build</code> を実行してください。</div></body></html>`;
}
