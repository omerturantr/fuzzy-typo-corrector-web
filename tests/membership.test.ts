import { describe, expect, it } from "vitest";

import {
  fuzzifyEditDistance,
  fuzzifyKeyboardProximity,
  fuzzifyLengthDiff,
  outputMembership,
} from "../src/lib/fuzzy/membership";

describe("membership functions", () => {
  it("marks zero edit distance as low", () => {
    const result = fuzzifyEditDistance(0);

    expect(result.low).toBeGreaterThan(0.95);
    expect(result.high).toBe(0);
  });

  it("marks high keyboard proximity as near", () => {
    const result = fuzzifyKeyboardProximity(0.9);

    expect(result.near).toBeGreaterThan(0.7);
    expect(result.far).toBe(0);
  });

  it("marks large length ratio as large", () => {
    const result = fuzzifyLengthDiff(0.9);

    expect(result.large).toBeGreaterThan(0.8);
    expect(result.small).toBe(0);
  });

  it("has high veryHigh membership near 98 score", () => {
    expect(outputMembership("veryHigh", 98)).toBeGreaterThan(0.7);
    expect(outputMembership("low", 98)).toBe(0);
  });
});
