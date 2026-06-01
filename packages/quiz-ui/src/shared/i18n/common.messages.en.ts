import type { ja } from "./common.messages.ja.js";
import type { MessageShape } from "./types.js";

export const en = {
  connecting: "Connecting…",
  loading: "Loading…",
  edit: "Edit",
  languageSwitcher: {
    label: "Language",
  },
  quizPlay: {
    correct: "Correct",
    incorrect: "Incorrect",
    explanation: "Explanation:",
  },
  nav: {
    list: "List",
    session: "Take",
    history: "History",
    create: "New",
  },
} satisfies MessageShape<typeof ja>;
