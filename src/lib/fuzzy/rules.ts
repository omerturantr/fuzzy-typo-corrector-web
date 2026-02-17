import type {
  CorrectnessLabel,
  EditDistanceLabel,
  KeyboardProximityLabel,
  LengthDiffLabel,
} from "./config";

export interface FuzzyRule {
  id: string;
  antecedent: {
    editDistance?: EditDistanceLabel;
    keyboardProximity?: KeyboardProximityLabel;
    lengthDiff?: LengthDiffLabel;
  };
  consequent: CorrectnessLabel;
  weight?: number;
}

export const FUZZY_RULES: FuzzyRule[] = [
  {
    id: "R1",
    antecedent: { editDistance: "low", keyboardProximity: "near", lengthDiff: "small" },
    consequent: "veryHigh",
    weight: 1,
  },
  {
    id: "R2",
    antecedent: { editDistance: "low", keyboardProximity: "near", lengthDiff: "medium" },
    consequent: "high",
    weight: 0.95,
  },
  {
    id: "R3",
    antecedent: { editDistance: "low", keyboardProximity: "medium", lengthDiff: "small" },
    consequent: "high",
    weight: 0.92,
  },
  {
    id: "R4",
    antecedent: { editDistance: "low", keyboardProximity: "far" },
    consequent: "medium",
    weight: 0.8,
  },
  {
    id: "R5",
    antecedent: { editDistance: "low", lengthDiff: "small" },
    consequent: "high",
    weight: 0.75,
  },
  {
    id: "R6",
    antecedent: { editDistance: "medium", keyboardProximity: "near", lengthDiff: "small" },
    consequent: "high",
    weight: 0.88,
  },
  {
    id: "R7",
    antecedent: { editDistance: "medium", keyboardProximity: "near", lengthDiff: "medium" },
    consequent: "medium",
    weight: 0.8,
  },
  {
    id: "R8",
    antecedent: { editDistance: "medium", keyboardProximity: "medium", lengthDiff: "small" },
    consequent: "medium",
    weight: 0.78,
  },
  {
    id: "R9",
    antecedent: { editDistance: "medium", keyboardProximity: "far" },
    consequent: "low",
    weight: 0.92,
  },
  {
    id: "R10",
    antecedent: { editDistance: "high" },
    consequent: "low",
    weight: 1,
  },
  {
    id: "R11",
    antecedent: { lengthDiff: "large" },
    consequent: "low",
    weight: 0.94,
  },
  {
    id: "R12",
    antecedent: { editDistance: "medium", lengthDiff: "large" },
    consequent: "low",
    weight: 0.9,
  },
];
