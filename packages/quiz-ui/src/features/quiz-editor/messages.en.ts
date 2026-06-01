import type { MessageShape } from "@/shared/i18n/types.js";
import type { ja } from "./messages.ja.js";

export const en = {
  title: {
    create: "Create quiz",
    edit: "Edit quiz",
  },
  cancel: "Cancel",
  fields: {
    title: "Title",
    titlePlaceholder: "Example: Fundamentals of IT practice test",
    tags: "Tags (comma-separated)",
    tagsPlaceholder: "Example: IT, Certification",
    questionPlaceholder: "Question",
    correctChoiceAria: "Mark as correct",
    choicePlaceholder: "Choice {{number}}",
    removeChoiceAria: "Remove choice",
    addChoice: "Add choice",
    explanationPlaceholder: "Explanation (optional)",
  },
  actions: {
    removeQuestion: "Remove question",
    addQuestion: "Add question",
    saving: "Saving…",
    update: "Update",
    create: "Create",
  },
  errors: {
    saveFailed: "Failed to save.",
    titleRequired: "Enter a title.",
    questionsRequired: "At least one question is required.",
    questionTextRequired: "Q{{number}}: Enter the question text.",
    choicesRequired: "Q{{number}}: Add at least two choices.",
    correctChoiceRequired: "Q{{number}}: Select at least one correct choice.",
  },
} satisfies MessageShape<typeof ja>;
