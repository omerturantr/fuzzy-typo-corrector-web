import type { SupportedLanguage } from "../config";
import { normalizeWord } from "../language";
import { ARABIC_LAYOUT } from "./ar_layout";
import { QWERTY_LAYOUT, type KeyboardLayout } from "./qwerty_layout";
import { TR_Q_LAYOUT } from "./tr_q_layout";

const MAX_KEY_DISTANCE = 6;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const resolveLayout = (lang: SupportedLanguage): KeyboardLayout => {
  if (lang === "tr") {
    return TR_Q_LAYOUT;
  }

  if (lang === "ar") {
    return ARABIC_LAYOUT;
  }

  return QWERTY_LAYOUT;
};

const keyDistance = (left: string, right: string, layout: KeyboardLayout): number => {
  const leftPos = layout[left];
  const rightPos = layout[right];

  if (!leftPos || !rightPos) {
    return MAX_KEY_DISTANCE * 0.75;
  }

  const xDiff = leftPos.x - rightPos.x;
  const yDiff = leftPos.y - rightPos.y;

  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
};

export const keyboardProximityScore = (
  input: string,
  candidate: string,
  lang: SupportedLanguage,
): number => {
  const normalizedInput = normalizeWord(input, lang);
  const normalizedCandidate = normalizeWord(candidate, lang);

  const maxLength = Math.max(normalizedInput.length, normalizedCandidate.length);

  if (maxLength === 0) {
    return 1;
  }

  const layout = resolveLayout(lang);
  const scoreWithOffset = (offset: number): number => {
    let total = 0;
    let comparedCharacters = 0;

    for (let index = 0; index < maxLength; index += 1) {
      const left = normalizedInput[index];
      const right = normalizedCandidate[index + offset];

      if (!left || !right) {
        continue;
      }

      comparedCharacters += 1;

      if (left === right) {
        total += 1;
        continue;
      }

      const distance = keyDistance(left, right, layout);
      total += clamp(1 - distance / MAX_KEY_DISTANCE, 0, 1);
    }

    const baseScore = total / maxLength;
    const overlapRatio = comparedCharacters / maxLength;
    const shiftPenalty = offset === 0 ? 1 : clamp(1 - 0.28 * Math.abs(offset), 0.35, 1);

    return baseScore * overlapRatio * shiftPenalty;
  };

  // A small shift window helps with single insert/delete mistakes, but shifted matches are penalized.
  const alignmentOffsets = [-1, 0, 1];
  const bestScore = alignmentOffsets.reduce((best, offset) => {
    return Math.max(best, scoreWithOffset(offset));
  }, 0);

  return Number(bestScore.toFixed(4));
};
