import type { MessageShape } from "@/shared/i18n/types.js";
import type { ja } from "./messages.ja.js";

export const en = {
  search: {
    placeholder: "Search by title, question, or tag",
    submit: "Search",
  },
  empty: "No quizzes yet. Ask the AI to create one, or make a new one.",
  card: {
    close: "Close",
    review: "Review",
    questionCount_one: "{{count}} question",
    questionCount_other: "{{count}} questions",
  },
  review: {
    correct: "✓ Correct",
    explanation: "Explanation:",
  },
} satisfies MessageShape<typeof ja>;
