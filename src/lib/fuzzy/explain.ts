import type { CandidateExplanation, CandidateFeatures } from "./config";
import type { InferenceResult } from "./inference";

const asPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const explainCandidate = (
  input: string,
  candidate: string,
  features: CandidateFeatures,
  inference: InferenceResult,
): CandidateExplanation => {
  const topRules = inference.debug.activations.slice(0, 3);
  const summary = [
    `\"${candidate}\" scored ${inference.score.toFixed(1)} based on fuzzy output \"${inference.dominantOutput}\".`,
    `Edit distance: ${features.editDistance}, keyboard proximity: ${asPercent(features.keyboardProximityScore)}.`,
    `Prefix similarity: ${asPercent(features.prefixSimilarity)} for input \"${input}\".`,
  ].join(" ");

  return {
    summary,
    dominantOutput: inference.dominantOutput,
    topRules,
    debug: inference.debug,
  };
};
