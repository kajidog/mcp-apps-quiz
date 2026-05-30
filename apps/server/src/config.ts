/** 環境変数から組み立てるサーバ設定 */
export interface ServerConfig {
  port: number;
  /** SQLite ファイルパス。未指定ならファイル永続化(quiz.sqlite)。 */
  dbPath: string;
  /** API キー。設定された場合のみ認証を要求する。 */
  apiKey: string | null;
}

export function loadConfig(): ServerConfig {
  return {
    port: Number.parseInt(process.env.PORT ?? "3001", 10),
    dbPath: process.env.QUIZ_DB_PATH ?? "quiz.sqlite",
    apiKey: process.env.MCP_API_KEY ?? null,
  };
}
