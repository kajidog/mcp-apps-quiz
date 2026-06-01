import "i18next";
import type { defaultNS, resources } from "./index.js";

/**
 * 型安全の要。これにより t("library:search.submit") などのキーに補完が効き、
 * タイポはコンパイルエラーになる。基準ロケール（ja）の resources を型に使う。
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["ja"];
  }
}
