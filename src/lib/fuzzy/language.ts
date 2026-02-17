import type { SupportedLanguage } from "./config";

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const ARABIC_LETTER_REGEX = /[^\u0621-\u063A\u0641-\u064A]/gu;

export const localeForLanguage = (lang: SupportedLanguage): string => {
  switch (lang) {
    case "tr":
      return "tr-TR";
    case "ar":
      return "ar";
    default:
      return "en-US";
  }
};

const normalizeArabicWord = (value: string): string => {
  return value
    .trim()
    .toLocaleLowerCase("ar")
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(/[\u200C\u200D]/gu, "")
    .replace(/\u0640/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/[ؤ]/gu, "و")
    .replace(/[ئى]/gu, "ي")
    .replace(/[ة]/gu, "ه")
    .replace(/ا{2,}/gu, "ا")
    .replace(ARABIC_LETTER_REGEX, "");
};

const normalizeLatinWord = (value: string, lang: SupportedLanguage): string => {
  return value.trim().toLocaleLowerCase(localeForLanguage(lang));
};

export const normalizeWord = (value: string, lang: SupportedLanguage): string => {
  if (lang === "ar") {
    return normalizeArabicWord(value);
  }

  return normalizeLatinWord(value, lang);
};

export const localeCompareByLanguage = (
  left: string,
  right: string,
  lang: SupportedLanguage,
): number => {
  return left.localeCompare(right, localeForLanguage(lang));
};
