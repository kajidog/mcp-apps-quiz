import type { MessageShape } from "@/shared/i18n/types.js";
import type { ja } from "./messages.ja.js";

export const en = {
  select: {
    title: "Choose quizzes to take",
    minQuestions: "Questions ({{count}} or more)",
    favoriteOnly: "Favorites only",
    tags: "Tags",
    summary:
      "Matches: {{filtered}} / selected: {{selected}} quizzes, {{questions}} questions",
    selectAll: "Select all matches",
    clearSelection: "Clear selection",
    empty: "No quizzes match these filters.",
    selectQuizAria: "Select this quiz",
    questionCount_one: "{{count}} question",
    questionCount_other: "{{count}} questions",
    start_one: "Start session ({{count}} question)",
    start_other: "Start session ({{count}} questions)",
  },
  runner: {
    favoriteAria: "Toggle favorite",
    backToList: "Back to list",
    back: "Back",
    noQuestions: "No questions found.",
    multiTitle: "Session ({{quizCount}} quizzes, {{questionCount}} questions)",
    answered:
      "Answered {{answered}} / {{total}} (unanswered questions are skipped and counted incorrect)",
    score: "Score: {{score}} / {{total}}",
    retry: "Try again",
    viewInHistory: "View in history",
    done: "Done",
    grading: "Grading…",
    grade: "Grade answers",
  },
} satisfies MessageShape<typeof ja>;
