import type { ParseKeys } from "i18next";
import type { ns } from "./index.js";

export type I18nNamespace = (typeof ns)[number];
export type MessageKey<N extends I18nNamespace = I18nNamespace> = ParseKeys<N>;

export type CommonMessageKey = MessageKey<"common">;
export type EditorMessageKey = MessageKey<"editor">;
export type HistoryMessageKey = MessageKey<"history">;
export type LibraryMessageKey = MessageKey<"library">;
export type SessionMessageKey = MessageKey<"session">;

/** 定数化した message key を、定義箇所で namespace ごとに検証する。 */
export function defineMessageKeys<N extends I18nNamespace>() {
  return <const T extends Record<string, MessageKey<N>>>(keys: T) => keys;
}
