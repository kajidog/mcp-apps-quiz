import { readFileSync } from "node:fs";

/**
 * 共有 GraphQL スキーマ(SDL)。パッケージ直下の schema.graphql を真実の源として読み込む。
 * サーバのリゾルバ構築と、ブラウザ UI の codegen の双方がこれ(または同ファイル)を参照する。
 */
export const typeDefs: string = readFileSync(
  new URL("../schema.graphql", import.meta.url),
  "utf-8",
);
