import type {
  CorrectnessLabel,
  EditDistanceLabel,
  FuzzyInputs,
  KeyboardProximityLabel,
  LengthDiffLabel,
} from "./config";

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const triangular = (x: number, a: number, b: number, c: number): number => {
  if (x <= a || x >= c) {
    return 0;
  }

  if (x === b) {
    return 1;
  }

  if (x < b) {
    return (x - a) / (b - a);
  }

  return (c - x) / (c - b);
};

const trapezoidal = (x: number, a: number, b: number, c: number, d: number): number => {
  if (a === b && x <= b) {
    return 1;
  }

  if (c === d && x >= c) {
    return 1;
  }

  if (x <= a || x >= d) {
    return 0;
  }

  if (x >= b && x <= c) {
    return 1;
  }

  if (x > a && x < b) {
    return (x - a) / (b - a);
  }

  return (d - x) / (d - c);
};

export const fuzzifyEditDistance = (value: number): Record<EditDistanceLabel, number> => {
  const x = clamp(value, 0, 1);

  return {
    low: trapezoidal(x, 0, 0, 0.12, 0.3),
    medium: triangular(x, 0.18, 0.42, 0.68),
    high: trapezoidal(x, 0.52, 0.72, 1, 1),
  };
};

export const fuzzifyKeyboardProximity = (value: number): Record<KeyboardProximityLabel, number> => {
  const x = clamp(value, 0, 1);

  return {
    near: trapezoidal(x, 0.65, 0.82, 1, 1),
    medium: triangular(x, 0.35, 0.58, 0.82),
    far: trapezoidal(x, 0, 0, 0.2, 0.42),
  };
};

export const fuzzifyLengthDiff = (value: number): Record<LengthDiffLabel, number> => {
  const x = clamp(value, 0, 1);

  return {
    small: trapezoidal(x, 0, 0, 0.16, 0.36),
    medium: triangular(x, 0.2, 0.45, 0.72),
    large: trapezoidal(x, 0.56, 0.78, 1, 1),
  };
};

export const fuzzifyInputs = (inputs: FuzzyInputs) => {
  return {
    editDistance: fuzzifyEditDistance(inputs.editDistanceRatio),
    keyboardProximity: fuzzifyKeyboardProximity(inputs.keyboardProximityScore),
    lengthDiff: fuzzifyLengthDiff(inputs.lengthDiffRatio),
  };
};

export const outputMembership = (label: CorrectnessLabel, value: number): number => {
  const x = clamp(value, 0, 100);

  switch (label) {
    case "low":
      return trapezoidal(x, 0, 0, 18, 40);
    case "medium":
      return triangular(x, 30, 50, 70);
    case "high":
      return triangular(x, 60, 78, 92);
    case "veryHigh":
      return trapezoidal(x, 84, 93, 100, 100);
    default:
      return 0;
  }
};
