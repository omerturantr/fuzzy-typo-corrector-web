import { NextResponse, type NextRequest } from "next/server";

import { generateCandidates } from "@/lib/candidates/generateCandidates";
import { extractFeatures } from "@/lib/features/extractFeatures";
import {
  DEFAULT_REQUEST,
  PROFILE_TUNING,
  type CorrectionRequest,
  type FuzzyProfile,
  type ScoredCandidate,
  type SupportedLanguage,
} from "@/lib/fuzzy/config";
import { explainCandidate } from "@/lib/fuzzy/explain";
import { runFuzzyInference } from "@/lib/fuzzy/inference";

const clampInteger = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
};

const isProfile = (value: unknown): value is FuzzyProfile => {
  return value === "strict" || value === "balanced" || value === "forgiving";
};

const isSupportedLanguage = (value: unknown): value is SupportedLanguage => {
  return value === "tr" || value === "en";
};

const MIN_RELIABLE_SCORE: Record<FuzzyProfile, number> = {
  strict: 45,
  balanced: 38,
  forgiving: 32,
};

const parseRequest = (body: unknown): CorrectionRequest | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const data = body as Record<string, unknown>;
  const word = typeof data.word === "string" ? data.word.trim() : "";

  if (!word || /\s/u.test(word)) {
    return null;
  }

  const lang = isSupportedLanguage(data.lang) ? data.lang : DEFAULT_REQUEST.lang;
  const profile = isProfile(data.profile) ? data.profile : DEFAULT_REQUEST.profile;

  return {
    word,
    lang,
    profile,
    maxDistance: clampInteger(data.maxDistance, 1, PROFILE_TUNING[profile].maxDistanceCap, 2),
    topK: clampInteger(data.topK, 1, 20, DEFAULT_REQUEST.topK),
  };
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const payload = parseRequest(rawBody);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid payload. Provide a single word and valid settings." },
        { status: 400 },
      );
    }

    const candidates = await generateCandidates({
      word: payload.word,
      lang: payload.lang,
      maxDistance: payload.maxDistance,
      limit: Math.max(25, payload.topK * 5),
    });

    const scoredCandidates: ScoredCandidate[] = candidates.map((candidate) => {
      const features = extractFeatures(payload.word, candidate.word, payload.lang);
      const inference = runFuzzyInference(features, {
        maxDistance: payload.maxDistance,
        profile: payload.profile,
      });

      return {
        word: candidate.word,
        score: inference.score,
        features,
        explanation: explainCandidate(payload.word, candidate.word, features, inference),
      };
    });

    const ranked = scoredCandidates
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }

        if (a.features.editDistance !== b.features.editDistance) {
          return a.features.editDistance - b.features.editDistance;
        }

        if (a.features.prefixSimilarity !== b.features.prefixSimilarity) {
          return b.features.prefixSimilarity - a.features.prefixSimilarity;
        }

        if (a.features.keyboardProximityScore !== b.features.keyboardProximityScore) {
          return b.features.keyboardProximityScore - a.features.keyboardProximityScore;
        }

        return a.word.localeCompare(b.word, payload.lang === "tr" ? "tr" : "en");
      })
      .slice(0, payload.topK);

    const reliableRanked = ranked.filter(
      (candidate) => candidate.score >= MIN_RELIABLE_SCORE[payload.profile],
    );

    const bestCandidate = reliableRanked[0] ?? null;

    return NextResponse.json({
      input: payload.word,
      score: bestCandidate?.score ?? 0,
      best: bestCandidate?.word ?? null,
      candidates: ranked.map((candidate) => ({
        word: candidate.word,
        score: candidate.score,
        features: candidate.features,
        dominantOutput: candidate.explanation.dominantOutput,
        summary: candidate.explanation.summary,
      })),
      explanation: bestCandidate?.explanation ?? null,
      settings: {
        lang: payload.lang,
        maxDistance: payload.maxDistance,
        topK: payload.topK,
        profile: payload.profile,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while calculating corrections." },
      { status: 500 },
    );
  }
}
