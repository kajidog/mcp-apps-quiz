import { createRequire } from "node:module";
import type { CodegenConfig } from "@graphql-codegen/cli";

// 共有 SDL を相対パスではなくパッケージの exports 経由で解決する（リポジトリ構成に非依存）。
const schemaPath = createRequire(import.meta.url).resolve("@quiz/core/schema.graphql");

/**
 * 共有 SDL（@quiz/core/schema.graphql）から、ブラウザ用の型付き GraphQL クライアントを生成する。
 * src 内の graphql(`...`) で書いた operation を走査し、型付き TypedDocumentNode を出力する。
 * 実行: pnpm -F @quiz/ui codegen
 */
const config: CodegenConfig = {
  schema: schemaPath,
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      // verbatimModuleSyntax 対応: 型は type-only import で出力させる
      config: { useTypeImports: true },
    },
  },
};

export default config;
