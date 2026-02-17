import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const EN_SOURCE_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt";
const TR_WIKTIONARY_URL =
  "https://en.wiktionary.org/w/index.php?title=Wiktionary:Frequency_lists/Turkish_wordlist&action=raw";
const TR_FREQUENT_URL =
  "https://raw.githubusercontent.com/ahmetaa/zemberek-nlp/master/normalization/src/test/resources/10000_frequent_turkish_word";
const TR_MASTER_URL =
  "https://raw.githubusercontent.com/ahmetaa/zemberek-nlp/master/morphology/src/main/resources/tr/master-dictionary.dict";

const WORDLIST_DIR = path.join(process.cwd(), "data", "wordlists");
const EN_OUTPUT = path.join(WORDLIST_DIR, "en.txt");
const TR_OUTPUT = path.join(WORDLIST_DIR, "tr.txt");

const EN_SEED_WORDS = [
  "fuzzy",
  "inference",
  "corrector",
  "typo",
  "keyboard",
  "levenshtein",
  "typescript",
  "algorithm",
];

const TR_SEED_WORDS = [
  "bulanık",
  "çıkarım",
  "düzeltme",
  "klavye",
  "yazım",
  "algoritma",
  "bilgisayar",
  "mühendislik",
];

const fetchText = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
};

const normalizeEnglishWord = (word) => {
  const normalized = word
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (normalized.length < 2 || normalized.length > 32) {
    return null;
  }

  if (!/^[a-z]+$/u.test(normalized)) {
    return null;
  }

  return normalized;
};

const normalizeTurkishWord = (word) => {
  const normalized = word
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[’'`-]/g, "")
    .replace(/[^a-zçğıöşüâîû]/gu, "");

  if (normalized.length < 2 || normalized.length > 32) {
    return null;
  }

  if (!/^[a-zçğıöşüâîû]+$/u.test(normalized)) {
    return null;
  }

  if (!/[aeıioöuüâîû]/u.test(normalized)) {
    return null;
  }

  if (/^(.)\1+$/u.test(normalized)) {
    return null;
  }

  return normalized;
};

const dedupeSorted = (words, locale) => {
  const unique = Array.from(new Set(words));

  return unique.sort((a, b) => a.localeCompare(b, locale));
};

const hasTurkishSpecificCharacter = (word) => /[çğıöşüâîû]/u.test(word);

const parseWiktionaryTurkishWords = (content) => {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^([^\s<]+)\s+\d+<BR\/>$/u);
      return match ? match[1] : null;
    })
    .filter(Boolean);
};

const parseMasterDictionaryWords = (content) => {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/\s+/u)[0])
    .filter(Boolean);
};

const parsePlainWordList = (content) => {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const main = async () => {
  await mkdir(WORDLIST_DIR, { recursive: true });

  const [enSource, trWiktionary, trFrequent, trMaster] = await Promise.all([
    fetchText(EN_SOURCE_URL),
    fetchText(TR_WIKTIONARY_URL),
    fetchText(TR_FREQUENT_URL),
    fetchText(TR_MASTER_URL),
  ]);

  const enWords = dedupeSorted(
    [...EN_SEED_WORDS, ...parsePlainWordList(enSource)].map(normalizeEnglishWord).filter(Boolean),
    "en",
  );

  const trSeedWords = TR_SEED_WORDS.map(normalizeTurkishWord).filter(Boolean);
  const trFrequentWords = parsePlainWordList(trFrequent).map(normalizeTurkishWord).filter(Boolean);
  const trMasterWords = parseMasterDictionaryWords(trMaster)
    .map(normalizeTurkishWord)
    .filter(Boolean);
  const trBaseSet = new Set([...trSeedWords, ...trFrequentWords, ...trMasterWords]);
  const trWiktionaryWords = parseWiktionaryTurkishWords(trWiktionary)
    .map(normalizeTurkishWord)
    .filter(Boolean)
    .filter((word) => trBaseSet.has(word) || hasTurkishSpecificCharacter(word));

  const trWords = dedupeSorted([...trBaseSet, ...trWiktionaryWords], "tr");

  await Promise.all([
    writeFile(EN_OUTPUT, `${enWords.join("\n")}\n`, "utf8"),
    writeFile(TR_OUTPUT, `${trWords.join("\n")}\n`, "utf8"),
  ]);

  console.log(`English words: ${enWords.length}`);
  console.log(`Turkish words: ${trWords.length}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
