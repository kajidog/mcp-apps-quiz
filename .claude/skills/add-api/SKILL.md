---
name: add-api
description: >-
  クイズサーバに API を追加・変更するときの手順。GraphQL の query/mutation と、
  それに 1:1 対応する MCP ツールの両方を、service → SDL → resolver → MCPツール →
  UIクライアント → codegen の順で漏れなく実装するためのチェックリスト。
  「エンドポイントを追加」「新しいツールを生やす」「操作を増やす」系の依頼で使う。
---

# API を追加する

このリポジトリの API は「ブラウザ経路(GraphQL)」と「MCPホスト経路(MCPツール)」の
**二重トランスポート**で、両方とも `@quiz/core` の `QuizService` に委譲する薄い層にすぎない。
**ロジックは必ず QuizService に置く**。resolver と MCP ツールには分岐を書かない。

依存方向は一方向: `apps/server` と `packages/quiz-ui` → `packages/quiz-core`。
core は repo 内の何にも依存しない。

## 実装する順番（この順で進める）

1. **サービス本体** — `packages/quiz-core/src/service.ts`
   - メソッドを追加。採点・バリデーション・整形などロジックはすべてここ。
   - 入力は `unknown` で受け、次の zod スキーマで parse してから使う。

2. **入力の zod スキーマ** — `packages/quiz-core/src/schemas.ts`
   - `xxxInputSchema` を追加し、`export type XxxInput = z.infer<...>` も出す。
   - サービス境界でのバリデーションはここに集約する。

3. **共有 SDL** — `packages/quiz-core/schema.graphql`（**バックエンドではなく core にある**）
   - `Query` / `Mutation` にフィールドを追加。必要なら `input` / 出力 `type` も。
   - これが「真実の源」。サーバと UI の両 codegen がこの 1 ファイルを参照する。

4. **GraphQL リゾルバ** — `apps/server/src/graphql/resolvers.ts`
   - `service.xxx(...)` に委譲するだけ。null 許容引数は `?? undefined` で正規化する
     （既存メソッドと同じ書き方に合わせる）。

5. **MCP ツール** — `apps/server/src/mcp/tools.ts`
   - **モデル向け**ツールなら `_meta.ui.resourceUri`（`const ui` を流用）を付ける。
   - **UI 専用**ツールなら名前を `_xxx` にして `visibility: ["app"]`（`const appOnly`）を付ける。
     UI 専用ツールは GraphQL の操作と **1:1** で対応させる。
   - 返り値は必ず `text` フォールバックと `structuredContent: { kind, ... }` の両方。
   - 新しい表示種別が要るなら `kind` を増やし、`ToolPayload`（手順 7）と揃える。

6. **UI クライアント（feature の api スライス）** —
   `packages/quiz-ui/src/features/<feature>/api/<feature>.api.ts`
   - `XxxApi` インターフェースにメソッドを追加。
   - `createMcpXxxApi`（`McpCaller` 経由で手順 5 のツールを呼ぶ）と
     `createGraphqlXxxApi`（手順 3 の SDL から生成した型付きドキュメントを実行）の
     **両方**を更新する。片方だけにしない。

7. **共有ペイロード型** — `packages/quiz-ui/src/shared/api/types.ts`
   - MCP の `structuredContent` に新しい `kind` を足したなら、`ToolPayload` にも追加して
     `tools.ts` 側と一致させる。

8. **codegen を両方回す**（SDL を触ったら必須）
   ```bash
   pnpm -F @quiz/server codegen   # resolver の型
   pnpm -F @quiz/ui codegen       # UI の型付きクライアント
   ```
   生成物（`**/__generated__/**`, `packages/quiz-ui/src/gql/**`）は gitignore かつ
   lint 対象外。**手編集しない**。

9. **検証**
   ```bash
   pnpm -r typecheck
   pnpm -F @quiz/core test            # サービス層の単体テストを足す/通す
   ```
   テストは `packages/quiz-core/src/service.test.ts` に追加し、DB は `:memory:` を使う。

## 注意（このリポジトリ固有）

- Drizzle のリレーショナルクエリは同期実行。`db.query.x.findFirst(...)` には
  **`.sync()` を付ける**。忘れるとフィールドが `undefined` になる。
- UI を動かして確認するなら、サーバ起動前に `pnpm -F @quiz/ui build` が必要
  （未ビルドだとプレースホルダ UI になる）。
- 純粋なクエリだけ（MCP ツール不要）なら手順 5・7 は省略可。逆に、モデルにだけ見せたい
  ツールなら UI スライス(手順 6)は不要なこともある。**何を追加したかで取捨選択する**。
