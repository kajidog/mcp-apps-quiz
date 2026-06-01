/** 基準ロケールと同じキー構造を要求し、翻訳値だけ string に広げる。 */
export type MessageShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageShape<T[K]>;
};
