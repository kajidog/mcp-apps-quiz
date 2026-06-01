/** クイズ受験画面の文言。namespace = "session"。 */
export const ja = {
  select: {
    title: "受験するクイズを選ぶ",
    minQuestions: "問題数（{{count}} 問以上）",
    favoriteOnly: "お気に入りのみ",
    tags: "タグ",
    summary:
      "条件に一致 {{filtered}} 件 / 選択中 {{selected}} 件・{{questions}} 問",
    selectAll: "一致を全選択",
    clearSelection: "選択解除",
    empty: "条件に一致するクイズがありません。",
    selectQuizAria: "このクイズを選択",
    questionCount_one: "{{count}} 問",
    questionCount_other: "{{count}} 問",
    start_one: "受験を始める（{{count}} 問）",
    start_other: "受験を始める（{{count}} 問）",
  },
  runner: {
    favoriteAria: "お気に入りを切り替え",
    backToList: "一覧へ",
    back: "戻る",
    noQuestions: "設問がありません。",
    multiTitle: "まとめ受験（{{quizCount}}クイズ・{{questionCount}}問）",
    answered:
      "回答済み {{answered}} / {{total}}（未回答はスキップ可・不正解扱い）",
    score: "スコア: {{score}} / {{total}}",
    retry: "もう一度",
    viewInHistory: "履歴で見る",
    done: "完了",
    grading: "採点中…",
    grade: "採点する",
  },
} as const;
