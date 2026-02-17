import type { SupportedLanguage, CandidateFeatures } from "../fuzzy/config";
import { normalizeWord } from "../fuzzy/language";
import { levenshtein } from "../fuzzy/levenshtein";
import { keyboardProximityScore } from "../fuzzy/keyboard/proximity";

const commonPrefixLength = (left: string, right: string): number => {
  const limit = Math.min(left.length, right.length);
  let count = 0;

  for (let index = 0; index < limit; index += 1) {
    if (left[index] !== right[index]) {
      break;
    }

    count += 1;
  }

  return count;
};

export const extractFeatures = (
  input: string,
  candidate: string,
  lang: SupportedLanguage,
): CandidateFeatures => {
  const normalizedInput = normalizeWord(input, lang);
  const normalizedCandidate = normalizeWord(candidate, lang);

  const maxLength = Math.max(normalizedInput.length, normalizedCandidate.length, 1);
  const minLength = Math.max(Math.min(normalizedInput.length, normalizedCandidate.length), 1);

  const editDistance = levenshtein(normalizedInput, normalizedCandidate);
  const normalizedDistance = Number((editDistance / maxLength).toFixed(4));
  const lengthDiff = Math.abs(normalizedInput.length - normalizedCandidate.length);
  const prefixLength = commonPrefixLength(normalizedInput, normalizedCandidate);
  const rawKeyboardProximity = keyboardProximityScore(normalizedInput, normalizedCandidate, lang);

  // Penalize keyboard similarity when overall edit distance is high.
  const distanceDamping = 1 - Math.min(normalizedDistance, 1) * 0.5;
  const adjustedKeyboardProximity = Number((rawKeyboardProximity * distanceDamping).toFixed(4));

  return {
    editDistance,
    normalizedDistance,
    keyboardProximityScore: adjustedKeyboardProximity,
    lengthDiff,
    lengthDiffRatio: Number((lengthDiff / maxLength).toFixed(4)),
    prefixSimilarity: Number((prefixLength / minLength).toFixed(4)),
  };
};
