export type SupportedLanguage = "en" | "tr";

export type FuzzyProfile = "strict" | "balanced" | "forgiving";

export interface CorrectionRequest {
  word: string;
  lang: SupportedLanguage;
  maxDistance: number;
  topK: number;
  profile: FuzzyProfile;
}

export interface CandidateFeatures {
  editDistance: number;
  normalizedDistance: number;
  keyboardProximityScore: number;
  lengthDiff: number;
  lengthDiffRatio: number;
  prefixSimilarity: number;
}

export interface FuzzyInputs {
  editDistanceRatio: number;
  keyboardProximityScore: number;
  lengthDiffRatio: number;
}

export type EditDistanceLabel = "low" | "medium" | "high";
export type KeyboardProximityLabel = "near" | "medium" | "far";
export type LengthDiffLabel = "small" | "medium" | "large";
export type CorrectnessLabel = "low" | "medium" | "high" | "veryHigh";

export interface RuleActivation {
  id: string;
  output: CorrectnessLabel;
  strength: number;
}

export interface InferenceDebug {
  fuzzifiedInputs: {
    editDistance: Record<EditDistanceLabel, number>;
    keyboardProximity: Record<KeyboardProximityLabel, number>;
    lengthDiff: Record<LengthDiffLabel, number>;
  };
  activations: RuleActivation[];
  aggregatedOutput: Record<CorrectnessLabel, number>;
  fuzzyScore: number;
  heuristicScore: number;
}

export interface CandidateExplanation {
  summary: string;
  dominantOutput: CorrectnessLabel;
  topRules: RuleActivation[];
  debug: InferenceDebug;
}

export interface ScoredCandidate {
  word: string;
  score: number;
  features: CandidateFeatures;
  explanation: CandidateExplanation;
}

export interface ProfileTuning {
  distanceSensitivity: number;
  keyboardSensitivity: number;
  fuzzyWeight: number;
  maxDistanceCap: number;
}

export const PROFILE_TUNING: Record<FuzzyProfile, ProfileTuning> = {
  strict: {
    distanceSensitivity: 1.18,
    keyboardSensitivity: 0.92,
    fuzzyWeight: 0.78,
    maxDistanceCap: 2,
  },
  balanced: {
    distanceSensitivity: 1,
    keyboardSensitivity: 1,
    fuzzyWeight: 0.72,
    maxDistanceCap: 3,
  },
  forgiving: {
    distanceSensitivity: 0.86,
    keyboardSensitivity: 1.12,
    fuzzyWeight: 0.66,
    maxDistanceCap: 4,
  },
};

export const DEFAULT_REQUEST: CorrectionRequest = {
  word: "",
  lang: "tr",
  maxDistance: 2,
  topK: 10,
  profile: "balanced",
};

export const CORRECTNESS_DOMAIN = {
  min: 0,
  max: 100,
  step: 1,
};
