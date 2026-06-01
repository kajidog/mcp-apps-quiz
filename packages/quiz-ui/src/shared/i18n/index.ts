import library from "@/features/quiz-library/messages.js";
import session from "@/features/quiz-session/messages.js";
import editor from "@/features/quiz-editor/messages.js";
import history from "@/features/history/messages.js";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import common from "./common.messages.js";

/**
 * UI 多言語対応の中枢。各 feature の messages.ts を catalogs に集約し、
 * namespace 単位で i18next に登録する。
 *
 * 制約: vite-plugin-singlefile で単一 HTML にバンドルするため、翻訳は HTTP backend で
 * 遅延ロードできない。必ずこのように import してインライン同梱する。
 */

export const defaultNS = "common" as const;
export const supportedLngs = ["ja", "en"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

const catalogs = {
  common,
  editor,
  history,
  library,
  session,
} as const;

type Catalogs = typeof catalogs;
type Namespace = keyof Catalogs;

export const ns = Object.keys(catalogs) as Namespace[];

function buildResources<C extends Record<string, Record<SupportedLng, unknown>>>(input: C) {
  const names = Object.keys(input) as Array<keyof C>;
  return Object.fromEntries(
    supportedLngs.map((lng) => [
      lng,
      Object.fromEntries(names.map((name) => [name, input[name]![lng]])),
    ]),
  ) as { [L in SupportedLng]: { [N in keyof C]: C[N][L] } };
}

export const resources = buildResources(catalogs);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    ns,
    supportedLngs,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "ja",
    interpolation: { escapeValue: false }, // React 側でエスケープされる
    returnNull: false,
    saveMissing: false,
    debug: false,
    // 要件: 存在しないキーはエラーにせずキー文字列をそのまま表示する。
    parseMissingKeyHandler: (key) => key,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
