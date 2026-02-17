import { readFile } from "node:fs/promises";
import path from "node:path";

import type { SupportedLanguage } from "../fuzzy/config";
import { localeCompareByLanguage, normalizeWord } from "../fuzzy/language";
import { levenshtein } from "../fuzzy/levenshtein";

const WORDLIST_CACHE = new Map<SupportedLanguage, string[]>();

const getWordlistPath = (lang: SupportedLanguage): string => {
  return path.join(process.cwd(), "data", "wordlists", `${lang}.txt`);
};

const loadWordlist = async (lang: SupportedLanguage): Promise<string[]> => {
  const cached = WORDLIST_CACHE.get(lang);

  if (cached) {
    return cached;
  }

  const contents = await readFile(getWordlistPath(lang), "utf8");
  const words = Array.from(
    new Set(
      contents
        .split(/\r?\n/u)
        .map((word) => word.trim())
        .filter((word) => word.length > 0),
    ),
  );

  WORDLIST_CACHE.set(lang, words);

  return words;
};

export interface CandidateWithDistance {
  word: string;
  distance: number;
}

export interface GenerateCandidatesParams {
  word: string;
  lang: SupportedLanguage;
  maxDistance: number;
  limit: number;
}

export const clearWordlistCache = (): void => {
  WORDLIST_CACHE.clear();
};

export const generateCandidates = async (
  params: GenerateCandidatesParams,
): Promise<CandidateWithDistance[]> => {
  const normalizedInput = normalizeWord(params.word, params.lang);
  const dictionary = await loadWordlist(params.lang);

  const scored = dictionary.map((dictionaryWord) => {
    const normalizedDictionaryWord = normalizeWord(dictionaryWord, params.lang);

    return {
      word: dictionaryWord,
      distance: levenshtein(normalizedInput, normalizedDictionaryWord),
      lengthDiff: Math.abs(normalizedInput.length - normalizedDictionaryWord.length),
    };
  });

  const sorted = scored.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }

    if (a.lengthDiff !== b.lengthDiff) {
      return a.lengthDiff - b.lengthDiff;
    }

    return localeCompareByLanguage(a.word, b.word, params.lang);
  });

  const normalizedLimit = Math.max(params.limit, 1);
  const primary = sorted.filter((candidate) => candidate.distance <= params.maxDistance);

  if (primary.length >= normalizedLimit) {
    return primary.slice(0, normalizedLimit).map(({ word, distance }) => ({ word, distance }));
  }

  const fallback = sorted.filter((candidate) => candidate.distance > params.maxDistance);
  const completed = [...primary, ...fallback].slice(0, normalizedLimit);

  return completed.map(({ word, distance }) => ({ word, distance }));
};
