import {
  PROFILE_TUNING,
  type CandidateFeatures,
  type CorrectnessLabel,
  type FuzzyProfile,
  type InferenceDebug,
  type RuleActivation,
} from "./config";
import { defuzzifyCentroid } from "./defuzzify";
import { FUZZY_RULES } from "./rules";
import { clamp, fuzzifyInputs } from "./membership";

export interface InferenceOptions {
  maxDistance: number;
  profile: FuzzyProfile;
}

export interface InferenceResult {
  score: number;
  dominantOutput: CorrectnessLabel;
  debug: InferenceDebug;
}

const getDominantOutput = (
  aggregatedOutput: Record<CorrectnessLabel, number>,
): CorrectnessLabel => {
  const labels = Object.keys(aggregatedOutput) as CorrectnessLabel[];

  return labels.reduce((bestLabel, currentLabel) => {
    return aggregatedOutput[currentLabel] > aggregatedOutput[bestLabel] ? currentLabel : bestLabel;
  }, labels[0]);
};

const toHeuristicScore = (features: CandidateFeatures, profile: FuzzyProfile): number => {
  const tuning = PROFILE_TUNING[profile];

  const distanceScore = 1 - clamp(features.normalizedDistance * tuning.distanceSensitivity, 0, 1);
  const keyboardScore = clamp(features.keyboardProximityScore * tuning.keyboardSensitivity, 0, 1);
  const prefixScore = clamp(features.prefixSimilarity, 0, 1);
  const lengthScore = 1 - clamp(features.lengthDiffRatio * tuning.distanceSensitivity, 0, 1);

  let blendedScore =
    0.58 * distanceScore + 0.12 * keyboardScore + 0.2 * prefixScore + 0.1 * lengthScore;

  // Additional dampening for very distant candidates.
  if (features.normalizedDistance >= 0.45) {
    blendedScore *= 0.88;
  }

  return Number((100 * clamp(blendedScore, 0, 1)).toFixed(2));
};

export const runFuzzyInference = (
  features: CandidateFeatures,
  options: InferenceOptions,
): InferenceResult => {
  const tuning = PROFILE_TUNING[options.profile];

  const fuzzifiedInputs = fuzzifyInputs({
    editDistanceRatio: clamp(features.normalizedDistance * tuning.distanceSensitivity, 0, 1),
    keyboardProximityScore: clamp(
      features.keyboardProximityScore * tuning.keyboardSensitivity,
      0,
      1,
    ),
    lengthDiffRatio: clamp(features.lengthDiffRatio * tuning.distanceSensitivity, 0, 1),
  });

  const aggregatedOutput: Record<CorrectnessLabel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    veryHigh: 0,
  };

  const activations: RuleActivation[] = [];

  FUZZY_RULES.forEach((rule) => {
    const strengths: number[] = [];

    if (rule.antecedent.editDistance) {
      strengths.push(fuzzifiedInputs.editDistance[rule.antecedent.editDistance]);
    }

    if (rule.antecedent.keyboardProximity) {
      strengths.push(fuzzifiedInputs.keyboardProximity[rule.antecedent.keyboardProximity]);
    }

    if (rule.antecedent.lengthDiff) {
      strengths.push(fuzzifiedInputs.lengthDiff[rule.antecedent.lengthDiff]);
    }

    if (strengths.length === 0) {
      return;
    }

    const baseStrength = Math.min(...strengths);
    const weightedStrength = Number((baseStrength * (rule.weight ?? 1)).toFixed(4));

    if (weightedStrength <= 0) {
      return;
    }

    activations.push({ id: rule.id, output: rule.consequent, strength: weightedStrength });
    aggregatedOutput[rule.consequent] = Math.max(
      aggregatedOutput[rule.consequent],
      weightedStrength,
    );
  });

  if (activations.length === 0) {
    aggregatedOutput.medium = 0.25;
  }

  const fuzzyScore = defuzzifyCentroid(aggregatedOutput);
  const heuristicScore = toHeuristicScore(features, options.profile);
  const score = Number(
    clamp(
      fuzzyScore * tuning.fuzzyWeight + heuristicScore * (1 - tuning.fuzzyWeight),
      0,
      100,
    ).toFixed(2),
  );

  const sortedActivations = [...activations].sort((a, b) => b.strength - a.strength);

  const debug: InferenceDebug = {
    fuzzifiedInputs,
    activations: sortedActivations,
    aggregatedOutput,
    fuzzyScore,
    heuristicScore,
  };

  return {
    score,
    dominantOutput: getDominantOutput(aggregatedOutput),
    debug,
  };
};
