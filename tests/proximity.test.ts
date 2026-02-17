import { describe, expect, it } from "vitest";

import { keyboardProximityScore } from "../src/lib/fuzzy/keyboard/proximity";

describe("keyboard proximity", () => {
  it("returns 1 for exact match", () => {
    expect(keyboardProximityScore("kalem", "kalem", "tr")).toBe(1);
  });

  it("keeps realistic typo pair relatively high", () => {
    expect(keyboardProximityScore("bilgsayar", "bilgisayar", "tr")).toBeGreaterThan(0.5);
  });

  it("does not overestimate unrelated shifted words", () => {
    expect(keyboardProximityScore("terlak", "selam", "tr")).toBeLessThan(0.55);
  });
});
