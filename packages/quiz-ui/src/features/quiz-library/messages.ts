import { en } from "./messages.en.js";
import { ja } from "./messages.ja.js";

/**
 * 新しいページを足すときは、その feature 配下に同様の messages.ts を作り、
 * shared/i18n/index.ts の catalogs に namespace を 1 つ加える。
 */
const library = { ja, en } as const;

export default library;
