import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 各テスト後に React Testing Library のマウントを破棄する。
afterEach(() => {
  cleanup();
});
