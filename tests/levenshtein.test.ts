import { describe, expect, it } from "vitest";

import { levenshtein } from "../src/lib/fuzzy/levenshtein";

describe("levenshtein", () => {
  it("returns zero for same string", () => {
    expect(levenshtein("fuzzy", "fuzzy")).toBe(0);
  });

  it("calculates insertion, deletion and substitution", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("book", "boo")).toBe(1);
    expect(levenshtein("core", "care")).toBe(1);
  });

  it("treats adjacent transposition as one edit", () => {
    expect(levenshtein("ab", "ba")).toBe(1);
    expect(levenshtein("الكتبا", "الكتاب")).toBe(1);
  });

  it("handles empty input", () => {
    expect(levenshtein("", "test")).toBe(4);
    expect(levenshtein("abc", "")).toBe(3);
  });
});
