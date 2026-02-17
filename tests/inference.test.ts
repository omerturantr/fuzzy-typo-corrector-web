import { describe, expect, it } from "vitest";

import type { CandidateFeatures } from "../src/lib/fuzzy/config";
import { runFuzzyInference } from "../src/lib/fuzzy/inference";

const closeMatch: CandidateFeatures = {
  editDistance: 1,
  normalizedDistance: 0.1,
  keyboardProximityScore: 0.92,
  lengthDiff: 0,
  lengthDiffRatio: 0,
  prefixSimilarity: 0.9,
};

const weakMatch: CandidateFeatures = {
  editDistance: 3,
  normalizedDistance: 0.5,
  keyboardProximityScore: 0.2,
  lengthDiff: 3,
  lengthDiffRatio: 0.5,
  prefixSimilarity: 0.2,
};

describe("fuzzy inference", () => {
  it("scores close matches higher than weak matches", () => {
    const strong = runFuzzyInference(closeMatch, { maxDistance: 2, profile: "balanced" });
    const weak = runFuzzyInference(weakMatch, { maxDistance: 2, profile: "balanced" });

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBeGreaterThan(70);
    expect(weak.score).toBeLessThan(60);
  });

  it("forgiving profile gives slightly higher score on difficult typo", () => {
    const strict = runFuzzyInference(weakMatch, { maxDistance: 3, profile: "strict" });
    const forgiving = runFuzzyInference(weakMatch, { maxDistance: 3, profile: "forgiving" });

    expect(forgiving.score).toBeGreaterThan(strict.score);
  });
});
