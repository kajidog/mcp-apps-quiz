# mcp-apps-quiz

AI が生成したクイズを対話型 UI で表示し、後から再受験・検索・編集・履歴閲覧ができる
**MCP Apps** サーバー。同じ UI を **MCP ホスト（Claude Desktop 等）** と **ブラウザ単体** の
両方で動かせる（データアクセスを抽象化し、MCP 経路は `callServerTool`、ブラウザ経路は GraphQL）。

## MCP ツール

| ツール | 種別 | 用途 |
| --- | --- | --- |
| `quiz_create` | model | AI 生成のクイズを保存し UI 出題（新規作成） |
| `quiz_present` | model | 既存クイズを ID/タグで出題（再受験） |
| `quiz_search` | model | タイトル・問題文・タグで検索 |
| `quiz_edit` | model | クイズ編集 |
| `quiz_history` | model | 直近の受験履歴 |
| `_get_quiz` / `_submit_attempt` / `_toggle_favorite` / `_search_quizzes` / `_recent_attempts` | app | UI が呼ぶ内部ツール（GraphQL 操作と 1:1） |

全モデル向けツールは UI リソース `ui://quiz/mcp-app.html`（mime: `text/html;profile=mcp-app`）を表示する。

## セットアップ

```bash
pnpm install
# better-sqlite3 のネイティブビルドが必要な環境では:
#   (ルート package.json の pnpm.onlyBuiltDependencies で許可済み)
pnpm -F @quiz/ui build      # UI 単一HTMLバンドルを生成
```

## 起動

```bash
# HTTP モード（/mcp・/graphql・ブラウザUI）
pnpm -F @quiz/server start
#   MCP:     POST http://localhost:3001/mcp
#   GraphQL: http://localhost:3001/graphql （GraphiQL あり）
#   UI:      http://localhost:3001/

# stdio MCP モード（ローカル MCP クライアント用）
pnpm -F @quiz/server start:stdio
```

環境変数: `PORT`(既定3001) / `QUIZ_DB_PATH`(既定 `quiz.sqlite`、`:memory:` 可) /
`MCP_API_KEY`(設定時のみ `X-API-Key` か `Authorization: Bearer` を要求)。

## 開発コマンド

```bash
pnpm -F @quiz/core test        # サービス層のユニットテスト(Vitest)
pnpm -r typecheck              # 型チェック
pnpm lint                      # Biome
pnpm -F @quiz/server codegen   # 共有SDLからサーバのリゾルバ型を生成
pnpm -F @quiz/ui codegen       # 共有SDLからUIの型付きGraphQLクライアントを生成(client-preset)
pnpm -F @quiz/ui dev           # UI を Vite dev で単体起動
```

## MCP ホストでの動作確認

```bash
pnpm -F @quiz/server start                       # ターミナル1
cd tmp/ext-apps/examples/basic-host && npm i      # ターミナル2
SERVERS='["http://localhost:3001/mcp"]' npm start # → http://localhost:8080
```

`quiz_create` を呼ぶと iframe に出題 UI が描画され、回答→採点→履歴記録まで動作する。
