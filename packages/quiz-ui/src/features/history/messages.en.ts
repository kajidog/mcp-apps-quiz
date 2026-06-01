import type { MessageShape } from "@/shared/i18n/types.js";
import type { ja } from "./messages.ja.js";

export const en = {
  empty: "No attempts yet.",
  notFound: "Attempt history was not found.",
  backToHistory: "Back to history",
  score: "Score: {{score}} / {{total}}",
  missingQuestions_one: "{{count}} question cannot be shown because it was edited or deleted.",
  missingQuestions_other:
    "{{count}} questions cannot be shown because they were edited or deleted.",
} satisfies MessageShape<typeof ja>;
