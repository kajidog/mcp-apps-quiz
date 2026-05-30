import { createRequire } from "node:module";
import type { CodegenConfig } from "@graphql-codegen/cli";

// 共有 SDL を相対パスではなくパッケージの exports 経由で解決する（リポジトリ構成に非依存）。
const schemaPath = createRequire(import.meta.url).resolve("@quiz/core/schema.graphql");

/**
 * 共有 SDL（@quiz/core）からサーバ側リゾルバ型を生成する。
 * 実行: pnpm -F @quiz/server codegen
 */
const config: CodegenConfig = {
  schema: schemaPath,
  generates: {
    "./src/graphql/__generated__/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
      },
    },
  },
};

export default config;
