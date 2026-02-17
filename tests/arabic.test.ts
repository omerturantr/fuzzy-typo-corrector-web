import { describe, expect, it } from "vitest";

import { generateCandidates } from "../src/lib/candidates/generateCandidates";
import { extractFeatures } from "../src/lib/features/extractFeatures";
import { runFuzzyInference } from "../src/lib/fuzzy/inference";
import { normalizeWord } from "../src/lib/fuzzy/language";

describe("arabic language support", () => {
  it("normalizes Arabic letter variants and diacritics", () => {
    expect(normalizeWord("إِمْلَاء", "ar")).toBe("املاء");
    expect(normalizeWord("مدرسة", "ar")).toBe("مدرسه");
    expect(normalizeWord("ـالْكِتَاب", "ar")).toBe("الكتاب");
  });

  it("returns Arabic typo candidate from dictionary", async () => {
    const result = await generateCandidates({
      word: "الكتبا",
      lang: "ar",
      maxDistance: 2,
      limit: 250,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((candidate) => candidate.word === "الكتاب")).toBe(true);
  });

  it("scores close Arabic typo higher than unrelated word", () => {
    const closeFeatures = extractFeatures("الكتبا", "الكتاب", "ar");
    const unrelatedFeatures = extractFeatures("الكتبا", "سلام", "ar");

    const close = runFuzzyInference(closeFeatures, { maxDistance: 2, profile: "balanced" });
    const unrelated = runFuzzyInference(unrelatedFeatures, { maxDistance: 2, profile: "balanced" });

    expect(close.score).toBeGreaterThan(unrelated.score);
    expect(close.score).toBeGreaterThan(60);
    expect(unrelated.score).toBeLessThan(40);
  });
});
