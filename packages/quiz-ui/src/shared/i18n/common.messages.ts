import { en } from "./common.messages.en.js";
import { ja } from "./common.messages.ja.js";

/** 機能ごとの文言は各 feature の messages.ts に置き、shared/i18n/index.ts で集約する。 */
const common = { ja, en } as const;

export default common;
