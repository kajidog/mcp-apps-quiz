export * from "./domain.js";
export * from "./schemas.js";
export { QuizService } from "./service.js";
export { DrizzleQuizRepository } from "./repository.js";
export type { QuizRepository } from "./repository.js";
export { createDb } from "./db/client.js";
export type { QuizDb } from "./db/client.js";
export * as schema from "./db/schema.js";
export { typeDefs } from "./graphql.js";

import { createDb } from "./db/client.js";
import { DrizzleQuizRepository } from "./repository.js";
import { QuizService } from "./service.js";

/** SQLite ファイル(または :memory:)を開いて QuizService を組み立てる便利関数 */
export function createQuizService(dbPath?: string): QuizService {
  const db = createDb(dbPath);
  return new QuizService(new DrizzleQuizRepository(db));
}
