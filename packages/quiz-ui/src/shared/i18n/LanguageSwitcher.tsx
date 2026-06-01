import { useTranslation } from "react-i18next";

/** 表示言語（ja / en）の切り替え。選択は localStorage に保持される。 */
const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation("common");
  // i18n.language は "en-US" のように地域付きのことがあるので先頭2文字で判定。
  const current = i18n.language?.split("-")[0] ?? "ja";

  return (
    <select
      aria-label={t("languageSwitcher.label")}
      value={current}
      onChange={(e) => void i18n.changeLanguage(e.target.value)}
      className={className ?? "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
