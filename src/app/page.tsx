"use client";

import { useMemo, useState, type FormEvent } from "react";

type SupportedLanguage = "tr" | "en";
type FuzzyProfile = "strict" | "balanced" | "forgiving";
type WebsiteLanguage = "en" | "tr";
type CorrectnessLabel = "low" | "medium" | "high" | "veryHigh";
type ScoreBand = "strong" | "good" | "weak" | "poor";

interface CandidateFeatures {
  editDistance: number;
  normalizedDistance: number;
  keyboardProximityScore: number;
  lengthDiff: number;
  lengthDiffRatio: number;
  prefixSimilarity: number;
}

interface CandidateResponse {
  word: string;
  score: number;
  dominantOutput: CorrectnessLabel;
  summary: string;
  features: CandidateFeatures;
}

interface ApiResponse {
  input: string;
  score: number;
  best: string | null;
  candidates: CandidateResponse[];
  explanation: {
    summary: string;
    dominantOutput: string;
    topRules: { id: string; output: string; strength: number }[];
    debug: unknown;
  } | null;
  settings: {
    lang: SupportedLanguage;
    maxDistance: number;
    topK: number;
    profile: FuzzyProfile;
  };
}

const prettyPercent = (value: number): string => `${Math.round(value * 100)}%`;

const websiteCopy: Record<
  WebsiteLanguage,
  {
    headerBadge: string;
    title: string;
    subtitle: string;
    websiteLanguage: string;
    wordInput: string;
    wordPlaceholder: string;
    dictionaryLanguage: string;
    fuzzyProfile: string;
    maxEditDistance: string;
    resultCount: string;
    correcting: string;
    correctWord: string;
    results: string;
    noResults: string;
    noReliable: string;
    bestMatch: string;
    topSuggestions: string;
    predictionOverview: string;
    scoreLabel: string;
    confidenceBandLabel: string;
    scoreGapLabel: string;
    runnerUpLabel: string;
    exploratoryLabel: string;
    debugPanel: string;
    requestFailed: string;
    unexpectedError: string;
    metrics: {
      edit: string;
      keyboard: string;
      prefix: string;
      confidence: string;
    };
    outputLabels: Record<CorrectnessLabel, string>;
    scoreBands: Record<ScoreBand, string>;
    profileDescriptions: Record<FuzzyProfile, string>;
    profileLabels: Record<FuzzyProfile, string>;
    options: {
      websiteEnglish: string;
      websiteTurkish: string;
      dictionaryEnglish: string;
      dictionaryTurkish: string;
    };
  }
> = {
  en: {
    headerBadge: "Fuzzy Inference System",
    title: "Fuzzy Logic Typo Corrector",
    subtitle:
      "Local wordlist correction with edit-distance and keyboard-neighborhood aware fuzzy scoring.",
    websiteLanguage: "Website Language",
    wordInput: "Word Input",
    wordPlaceholder: "Type a single word",
    dictionaryLanguage: "Dictionary Language",
    fuzzyProfile: "Fuzzy Profile",
    maxEditDistance: "Max Edit Distance",
    resultCount: "Result Count",
    correcting: "Scoring...",
    correctWord: "Correct Word",
    results: "Results",
    noResults: "Submit a word to get ranked typo corrections.",
    noReliable: "No reliable correction found for the current dictionary and settings.",
    bestMatch: "Best Match",
    topSuggestions: "Top Suggestions",
    predictionOverview: "Prediction Overview",
    scoreLabel: "Score",
    confidenceBandLabel: "Confidence band",
    scoreGapLabel: "Lead over next candidate",
    runnerUpLabel: "Runner-up",
    exploratoryLabel: "Exploratory suggestions (low confidence)",
    debugPanel: "Debug Panel",
    requestFailed: "Request failed.",
    unexpectedError: "Unexpected error.",
    metrics: {
      edit: "edit",
      keyboard: "keyboard",
      prefix: "prefix",
      confidence: "confidence",
    },
    outputLabels: {
      low: "low",
      medium: "medium",
      high: "high",
      veryHigh: "very high",
    },
    scoreBands: {
      strong: "strong",
      good: "good",
      weak: "weak",
      poor: "poor",
    },
    profileDescriptions: {
      strict: "Fewer candidates, stronger penalties for distance.",
      balanced: "General-purpose ranking profile.",
      forgiving: "Keeps wider typo distance and rewards keyboard-near mistakes.",
    },
    profileLabels: {
      strict: "strict",
      balanced: "balanced",
      forgiving: "forgiving",
    },
    options: {
      websiteEnglish: "English UI",
      websiteTurkish: "Turkish UI",
      dictionaryEnglish: "English (en)",
      dictionaryTurkish: "Turkish (tr)",
    },
  },
  tr: {
    headerBadge: "Bulanık Çıkarım Sistemi",
    title: "Bulanık Mantık Yazım Düzeltici",
    subtitle:
      "Yerel sözlük üzerinde, düzenleme mesafesi ve klavye yakınlığına dayalı bulanık puanlama.",
    websiteLanguage: "Site Dili",
    wordInput: "Kelime Girişi",
    wordPlaceholder: "Tek bir kelime yazın",
    dictionaryLanguage: "Sözlük Dili",
    fuzzyProfile: "Bulanık Profil",
    maxEditDistance: "Maks Düzenleme Mesafesi",
    resultCount: "Sonuç Sayısı",
    correcting: "Puanlanıyor...",
    correctWord: "Kelimeyi Düzelt",
    results: "Sonuçlar",
    noResults: "Sıralı yazım düzeltmeleri için bir kelime gönderin.",
    noReliable: "Mevcut sözlük ve ayarlarda güvenilir bir düzeltme bulunamadı.",
    bestMatch: "En İyi Eşleşme",
    topSuggestions: "En İyi Öneriler",
    predictionOverview: "Tahmin Özeti",
    scoreLabel: "Skor",
    confidenceBandLabel: "Güven seviyesi",
    scoreGapLabel: "Sonraki adaya fark",
    runnerUpLabel: "İkinci aday",
    exploratoryLabel: "Keşif amaçlı öneriler (düşük güven)",
    debugPanel: "Hata Ayıklama Paneli",
    requestFailed: "İstek başarısız oldu.",
    unexpectedError: "Beklenmeyen bir hata oluştu.",
    metrics: {
      edit: "mesafe",
      keyboard: "klavye",
      prefix: "önek",
      confidence: "güven",
    },
    outputLabels: {
      low: "düşük",
      medium: "orta",
      high: "yüksek",
      veryHigh: "çok yüksek",
    },
    scoreBands: {
      strong: "çok güçlü",
      good: "iyi",
      weak: "zayıf",
      poor: "çok zayıf",
    },
    profileDescriptions: {
      strict: "Daha az aday ve mesafe için daha sert ceza uygular.",
      balanced: "Genel amaçlı sıralama profili.",
      forgiving: "Daha geniş yazım hatalarına izin verir, klavye yakınlığını ödüllendirir.",
    },
    profileLabels: {
      strict: "katı",
      balanced: "dengeli",
      forgiving: "hoşgörülü",
    },
    options: {
      websiteEnglish: "İngilizce Arayüz",
      websiteTurkish: "Türkçe Arayüz",
      dictionaryEnglish: "İngilizce (en)",
      dictionaryTurkish: "Türkçe (tr)",
    },
  },
};

const outputTone: Record<CorrectnessLabel, string> = {
  low: "border-rose-300/35 bg-rose-300/10 text-rose-100",
  medium: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  high: "border-teal-300/35 bg-teal-300/10 text-teal-100",
  veryHigh: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
};

const scoreBarTone = (score: number): string => {
  if (score >= 85) {
    return "bg-emerald-300";
  }

  if (score >= 70) {
    return "bg-teal-300";
  }

  if (score >= 50) {
    return "bg-amber-300";
  }

  return "bg-rose-300";
};

const toScoreBand = (score: number): ScoreBand => {
  if (score >= 85) {
    return "strong";
  }

  if (score >= 70) {
    return "good";
  }

  if (score >= 50) {
    return "weak";
  }

  return "poor";
};

export default function Home(): React.JSX.Element {
  const [websiteLanguage, setWebsiteLanguage] = useState<WebsiteLanguage>("en");
  const [word, setWord] = useState("");
  const [lang, setLang] = useState<SupportedLanguage>("tr");
  const [maxDistance, setMaxDistance] = useState(2);
  const [topK, setTopK] = useState(10);
  const [profile, setProfile] = useState<FuzzyProfile>("balanced");

  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const uiText = websiteCopy[websiteLanguage];
  const bestScoreBand = toScoreBand(result?.score ?? 0);
  const runnerUp = result?.candidates[1] ?? null;
  const leadGap =
    result?.best && runnerUp ? Number(Math.max(result.score - runnerUp.score, 0).toFixed(2)) : 0;

  const scoreTone = useMemo(() => {
    const value = result?.score ?? 0;

    if (value >= 85) {
      return "text-emerald-200";
    }

    if (value >= 60) {
      return "text-amber-100";
    }

    return "text-rose-200";
  }, [result?.score]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          lang,
          maxDistance,
          topK,
          profile,
        }),
      });

      const payload = (await response.json()) as ApiResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : uiText.requestFailed);
      }

      setResult(payload as ApiResponse);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : uiText.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="animate-rise rounded-3xl border border-white/30 bg-white/10 p-6 shadow-[0_18px_65px_-30px_rgba(17,24,39,0.85)] backdrop-blur md:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6">
            <header className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-100/80">
                {uiText.headerBadge}
              </p>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
                {uiText.title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-100/80 sm:text-base">
                {uiText.subtitle}
              </p>
            </header>

            <form className="grid gap-4" onSubmit={onSubmit}>
              <label className="grid gap-2 text-sm text-slate-100/85" htmlFor="word">
                {uiText.wordInput}
                <input
                  id="word"
                  required
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  className="rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 font-mono text-slate-100 placeholder:text-slate-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder={uiText.wordPlaceholder}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="grid gap-2 text-sm text-slate-100/85" htmlFor="websiteLang">
                  {uiText.websiteLanguage}
                  <select
                    id="websiteLang"
                    value={websiteLanguage}
                    onChange={(event) => setWebsiteLanguage(event.target.value as WebsiteLanguage)}
                    className="rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="en">{uiText.options.websiteEnglish}</option>
                    <option value="tr">{uiText.options.websiteTurkish}</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-100/85" htmlFor="lang">
                  {uiText.dictionaryLanguage}
                  <select
                    id="lang"
                    value={lang}
                    onChange={(event) => setLang(event.target.value as SupportedLanguage)}
                    className="rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="tr">{uiText.options.dictionaryTurkish}</option>
                    <option value="en">{uiText.options.dictionaryEnglish}</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-100/85" htmlFor="profile">
                  {uiText.fuzzyProfile}
                  <select
                    id="profile"
                    value={profile}
                    onChange={(event) => setProfile(event.target.value as FuzzyProfile)}
                    className="rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="strict">{uiText.profileLabels.strict}</option>
                    <option value="balanced">{uiText.profileLabels.balanced}</option>
                    <option value="forgiving">{uiText.profileLabels.forgiving}</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-100/85" htmlFor="distance">
                  {uiText.maxEditDistance}
                  <input
                    id="distance"
                    min={1}
                    max={4}
                    type="number"
                    value={maxDistance}
                    onChange={(event) => setMaxDistance(Number(event.target.value))}
                    className="rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-100/85" htmlFor="topK">
                  {uiText.resultCount}
                  <input
                    id="topK"
                    min={1}
                    max={20}
                    type="number"
                    value={topK}
                    onChange={(event) => setTopK(Number(event.target.value))}
                    className="rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </label>
              </div>

              <p className="text-xs text-slate-200/75">{uiText.profileDescriptions[profile]}</p>

              <button
                className="inline-flex items-center justify-center rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={loading}
                type="submit"
              >
                {loading ? uiText.correcting : uiText.correctWord}
              </button>
            </form>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/25 bg-slate-950/55 p-4 sm:p-6">
            <h2 className="text-sm uppercase tracking-[0.25em] text-slate-300">{uiText.results}</h2>

            {error ? (
              <p className="rounded-lg bg-rose-900/40 p-3 text-sm text-rose-100">{error}</p>
            ) : null}

            {!result && !error ? (
              <p className="text-sm text-slate-300/85">{uiText.noResults}</p>
            ) : null}

            {result ? (
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">
                  {uiText.predictionOverview}
                </p>
                {result.best ? (
                  <div className="grid gap-4 rounded-xl border border-white/15 bg-slate-900/65 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {uiText.bestMatch}
                        </p>
                        <p className="mt-1 font-mono text-xl text-slate-100">{result.best}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">
                          {uiText.scoreLabel}
                        </p>
                        <p className={`font-mono text-4xl ${scoreTone}`}>
                          {result.score.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${scoreBarTone(result.score)}`}
                        style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }}
                      />
                    </div>

                    <div className="grid gap-2 text-xs text-slate-200 sm:grid-cols-3">
                      <p className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                        <span className="text-slate-400">{uiText.confidenceBandLabel}: </span>
                        {uiText.scoreBands[bestScoreBand]}
                      </p>
                      <p className="rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                        <span className="text-slate-400">{uiText.scoreGapLabel}: </span>
                        {leadGap.toFixed(2)}
                      </p>
                      <p className="truncate rounded-lg border border-white/15 bg-black/20 px-2 py-1.5">
                        <span className="text-slate-400">{uiText.runnerUpLabel}: </span>
                        {runnerUp?.word ?? "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 rounded-xl border border-amber-300/35 bg-amber-300/10 p-3 text-sm text-amber-100">
                    <p>{uiText.noReliable}</p>
                    <p className="text-xs text-amber-50/85">{uiText.exploratoryLabel}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-100">{uiText.topSuggestions}</h3>
                  {result.candidates.length > 0 ? (
                    <ul className="grid max-h-80 gap-2 overflow-auto pr-1">
                      {result.candidates.map((candidate, index) => (
                        <li
                          key={`${candidate.word}-${index}`}
                          className="animate-rise rounded-lg border border-white/15 bg-slate-900/55 p-3"
                          style={{ animationDelay: `${index * 90}ms` }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-mono text-sm text-slate-100">
                              {index + 1}. {candidate.word}
                            </span>
                            <span className="font-mono text-sm text-emerald-200">
                              {candidate.score.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all ${scoreBarTone(candidate.score)}`}
                              style={{ width: `${Math.min(100, Math.max(0, candidate.score))}%` }}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                            <span
                              className={`rounded-full border px-2 py-0.5 ${outputTone[candidate.dominantOutput]}`}
                            >
                              {uiText.metrics.confidence}:{" "}
                              {uiText.outputLabels[candidate.dominantOutput]}
                            </span>
                            <span className="rounded-full border border-white/20 px-2 py-0.5">
                              {uiText.metrics.edit}: {candidate.features.editDistance}
                            </span>
                            <span className="rounded-full border border-white/20 px-2 py-0.5">
                              {uiText.metrics.keyboard}:{" "}
                              {prettyPercent(candidate.features.keyboardProximityScore)}
                            </span>
                            <span className="rounded-full border border-white/20 px-2 py-0.5">
                              {uiText.metrics.prefix}:{" "}
                              {prettyPercent(candidate.features.prefixSimilarity)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {result.explanation ? (
                  <details className="rounded-xl border border-white/15 bg-slate-900/55 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                      {uiText.debugPanel}
                    </summary>
                    <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-200">
                      {JSON.stringify(result.explanation, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
