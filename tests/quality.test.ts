import { describe, expect, it } from "vitest";

import { extractFeatures } from "../src/lib/features/extractFeatures";
import { runFuzzyInference } from "../src/lib/fuzzy/inference";

describe("scoring quality", () => {
  it("keeps realistic typo score clearly above unrelated match", () => {
    const closeFeatures = extractFeatures("bilgsayar", "bilgisayar", "tr");
    const unrelatedFeatures = extractFeatures("terlak", "selam", "tr");

    const close = runFuzzyInference(closeFeatures, { maxDistance: 2, profile: "balanced" });
    const unrelated = runFuzzyInference(unrelatedFeatures, { maxDistance: 3, profile: "balanced" });

    expect(close.score).toBeGreaterThan(70);
    expect(unrelated.score).toBeLessThan(35);
    expect(close.score).toBeGreaterThan(unrelated.score);
  });
});
