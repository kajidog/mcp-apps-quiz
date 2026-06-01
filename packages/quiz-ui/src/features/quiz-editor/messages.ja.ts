/** クイズ作成・編集画面の文言。namespace = "editor"。 */
export const ja = {
  title: {
    create: "クイズを新規作成",
    edit: "クイズを編集",
  },
  cancel: "キャンセル",
  fields: {
    title: "タイトル",
    titlePlaceholder: "例: 基本情報技術者 模試",
    tags: "タグ（カンマ区切り）",
    tagsPlaceholder: "例: IT, 資格",
    questionPlaceholder: "問題文",
    correctChoiceAria: "正解にする",
    choicePlaceholder: "選択肢 {{number}}",
    removeChoiceAria: "選択肢を削除",
    addChoice: "選択肢を追加",
    explanationPlaceholder: "解説（任意）",
  },
  actions: {
    removeQuestion: "設問を削除",
    addQuestion: "設問を追加",
    saving: "保存中…",
    update: "更新する",
    create: "作成する",
  },
  errors: {
    saveFailed: "保存に失敗しました。",
    titleRequired: "タイトルを入力してください。",
    questionsRequired: "設問は 1 つ以上必要です。",
    questionTextRequired: "Q{{number}}: 問題文を入力してください。",
    choicesRequired: "Q{{number}}: 選択肢は 2 つ以上必要です。",
    correctChoiceRequired: "Q{{number}}: 正解の選択肢を 1 つ以上選んでください。",
  },
} as const;
