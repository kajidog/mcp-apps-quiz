# UI i18n Guide

このディレクトリは UI 文言だけを扱う。サーバー、クイズ本文、タグ、履歴データなどのユーザー生成データは翻訳対象にしない。

## 基本方針

- 翻訳は `i18next` + `react-i18next` で扱う。
- `vite-plugin-singlefile` で単一 HTML にするため、翻訳は HTTP で遅延ロードせず bundle に同梱する。
- namespace は `common` と feature 単位に分ける。
- `ja` を基準ロケールにする。
- `en` など他 locale は `satisfies MessageShape<typeof ja>` で、`ja` と同じキー構造を型チェックする。
- 複数形キーは全 locale に同じキーを置く。日本語でも `_one` と `_other` を両方定義する。

## ファイル構成

```text
shared/i18n/
  index.ts                # i18next 初期化、namespace registry、resources 生成
  types.ts                # 翻訳オブジェクトの構造チェック用型
  key-types.ts            # message key 定数用の型と helper
  common.messages.ts      # common namespace の locale 集約
  common.messages.ja.ts   # common の基準ロケール
  common.messages.en.ts   # common の英語
```

feature 側は同じ形で置く。

```text
features/quiz-library/
  messages.ts
  messages.ja.ts
  messages.en.ts
```

## 文言を追加する

まず基準ロケールにキーを追加する。

```ts
// messages.ja.ts
export const ja = {
  search: {
    placeholder: "タイトル・問題文・タグで検索",
    submit: "検索",
  },
} as const;
```

他 locale は `MessageShape<typeof ja>` を満たす必要がある。キー抜けや余計なキーは `pnpm -F @quiz/ui typecheck` で落ちる。

```ts
// messages.en.ts
import type { MessageShape } from "@/shared/i18n/types.js";
import type { ja } from "./messages.ja.js";

export const en = {
  search: {
    placeholder: "Search by title, question, or tag",
    submit: "Search",
  },
} satisfies MessageShape<typeof ja>;
```

## コンポーネントで使う

component 内では `useTranslation(namespace)` を使い、render 時に翻訳する。

```tsx
import { useTranslation } from "react-i18next";

export function SearchButton() {
  const { t } = useTranslation("library");
  return <button type="submit">{t("search.submit")}</button>;
}
```

複数 namespace を使う場合は array で渡し、既定以外の namespace は prefix を付ける。

```tsx
const { t } = useTranslation(["library", "common"]);

return (
  <>
    <button type="button">{t("search.submit")}</button>
    <button type="button">{t("common:edit")}</button>
  </>
);
```

## count と複数形

i18next の複数形は `count` を渡す。

```tsx
const { t } = useTranslation("library");

return <span>{t("card.questionCount", { count: summary.questionCount })}</span>;
```

翻訳ファイルでは全 locale に同じ plural key を置く。

```ts
card: {
  questionCount_one: "{{count}} 問",
  questionCount_other: "{{count}} 問",
}
```

英語も同じキー構造にする。

```ts
card: {
  questionCount_one: "{{count}} question",
  questionCount_other: "{{count}} questions",
}
```

## message key を定数化する

翻訳済み文字列ではなく、message key を定数化する。

```ts
import { defineMessageKeys } from "@/shared/i18n/key-types.js";

export const libraryMessageKeys = defineMessageKeys<"library">()({
  empty: "empty",
  searchSubmit: "search.submit",
  questionCount: "card.questionCount",
});
```

定義した場所で key が検証される。例えば `"serach.submit"` は型エラーになる。

使う側では通常どおり `t()` に渡す。

```tsx
const { t } = useTranslation("library");

return <p>{t(libraryMessageKeys.empty)}</p>;
```

少量なら `satisfies` でもよい。

```ts
import type { LibraryMessageKey } from "@/shared/i18n/key-types.js";

export const libraryMessageKeys = {
  empty: "empty",
  searchSubmit: "search.submit",
} as const satisfies Record<string, LibraryMessageKey>;
```

`ParseKeys` は各ファイルで直接使わず、`key-types.ts` の alias を使う。

## option 配列を定数化する

select、tab、nav などは表示文字列ではなく `labelKey` を持つ。

```ts
import { defineMessageKeys } from "@/shared/i18n/key-types.js";

const commonKeys = defineMessageKeys<"common">()({
  navList: "nav.list",
  navSession: "nav.session",
  navHistory: "nav.history",
});

export const navItems = [
  { key: "list", labelKey: commonKeys.navList },
  { key: "session", labelKey: commonKeys.navSession },
  { key: "history", labelKey: commonKeys.navHistory },
] as const;
```

```tsx
const { t } = useTranslation("common");

return navItems.map((item) => (
  <button key={item.key} type="button">
    {t(item.labelKey)}
  </button>
));
```

## component 外の関数で使う

純粋関数や hook 外では `i18n.t()` を直接呼ばず、`t` を引数で受け取る。

```ts
import type { TFunction } from "i18next";

export function buildEmptyMessage(t: TFunction<"library">) {
  return t("empty");
}
```

```tsx
const { t } = useTranslation("library");
const message = buildEmptyMessage(t);
```

この形だとテストしやすく、言語切替にも追従する。

## namespace を追加する

feature 配下に `messages.ja.ts`、`messages.en.ts`、`messages.ts` を作る。

```ts
// features/quiz-session/messages.ts
import { en } from "./messages.en.js";
import { ja } from "./messages.ja.js";

const session = { ja, en } as const;

export default session;
```

`shared/i18n/index.ts` の `catalogs` に追加する。

```ts
import session from "@/features/quiz-session/messages.js";

const catalogs = {
  common,
  library,
  session,
} as const;
```

`resources` と `ns` は `catalogs` から生成されるため、別途同期しない。

必要なら `key-types.ts` に alias を追加する。

```ts
export type SessionMessageKey = MessageKey<"session">;
```

## locale を追加する

`supportedLngs` に locale を追加する。

```ts
export const supportedLngs = ["ja", "en", "ko"] as const;
```

全 namespace に `messages.ko.ts` を追加し、`messages.ts` で集約する。

```ts
import { en } from "./messages.en.js";
import { ja } from "./messages.ja.js";
import { ko } from "./messages.ko.js";

const library = { ja, en, ko } as const;
```

`buildResources()` の型により、どこかの namespace に `ko` が不足していると型エラーになる。

## 避けること

翻訳済み文字列を module scope の定数にしない。言語切替に追従しない。

```ts
// NG
const emptyMessage = i18n.t("library:empty");
```

代わりに key を定数化し、表示時に `t()` で翻訳する。

```ts
// OK
const emptyKey = "empty";
```

component 外で現在言語に依存する文字列を作る場合も、`t` を呼び出し元から渡す。

## 確認コマンド

```bash
pnpm -F @quiz/ui typecheck
pnpm lint
pnpm -F @quiz/ui test -- --runInBand
```
