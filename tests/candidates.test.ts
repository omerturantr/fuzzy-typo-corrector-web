import { afterEach, describe, expect, it } from "vitest";

import { clearWordlistCache, generateCandidates } from "../src/lib/candidates/generateCandidates";

afterEach(() => {
  clearWordlistCache();
});

describe("candidate generation", () => {
  it("returns Turkish correction candidate within distance", async () => {
    const result = await generateCandidates({
      word: "bilgsayar",
      lang: "tr",
      maxDistance: 2,
      limit: 10,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((candidate) => candidate.word === "bilgisayar")).toBe(true);
  });

  it("sorts by smallest distance first", async () => {
    const result = await generateCandidates({
      word: "compuetr",
      lang: "en",
      maxDistance: 2,
      limit: 10,
    });

    expect(result[0]?.distance).toBeLessThanOrEqual(
      result[1]?.distance ?? result[0]?.distance ?? 0,
    );
  });

  it("prioritizes exact match when the input exists", async () => {
    const result = await generateCandidates({
      word: "pen",
      lang: "en",
      maxDistance: 2,
      limit: 10,
    });

    expect(result[0]).toEqual({ word: "pen", distance: 0 });
  });

  it("fills up to limit with nearest fallback words when strict filtering is sparse", async () => {
    const result = await generateCandidates({
      word: "zzzzz",
      lang: "en",
      maxDistance: 0,
      limit: 5,
    });

    expect(result).toHaveLength(5);
  });
});
