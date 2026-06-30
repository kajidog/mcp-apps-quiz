import { describe, expect, it } from "vitest";
import { arrayMove } from "../reorder.js";

describe("arrayMove", () => {
  it("前から後ろへ移動", () => {
    expect(arrayMove(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });
  it("後ろから前へ移動", () => {
    expect(arrayMove(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("from === to は変化なし（コピーを返す）", () => {
    const src = ["a", "b", "c"];
    const out = arrayMove(src, 1, 1);
    expect(out).toEqual(src);
    expect(out).not.toBe(src);
  });
  it("範囲外インデックスは元配列のコピー", () => {
    expect(arrayMove(["a", "b"], 5, 0)).toEqual(["a", "b"]);
    expect(arrayMove(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
  it("元配列を破壊しない", () => {
    const src = ["a", "b", "c"];
    arrayMove(src, 0, 2);
    expect(src).toEqual(["a", "b", "c"]);
  });
});
