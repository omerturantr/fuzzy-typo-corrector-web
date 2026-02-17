"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { outputMembership } from "@/lib/fuzzy/membership";

type SupportedLanguage = "tr" | "en" | "ar";
type FuzzyProfile = "strict" | "balanced" | "forgiving";
type WebsiteLanguage = "en" | "tr" | "ar";
type CorrectnessLabel = "low" | "medium" | "high" | "veryHigh";
type ScoreBand = "strong" | "good" | "weak" | "poor";
type EditDistanceMembership = "low" | "medium" | "high";
type KeyboardMembership = "near" | "medium" | "far";
type LengthMembership = "small" | "medium" | "large";

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

interface InferenceDebugPayload {
  crispInputs: {
    editDistanceRatio: number;
    keyboardProximityScore: number;
    lengthDiffRatio: number;
  };
  fuzzifiedInputs: {
    editDistance: Record<EditDistanceMembership, number>;
    keyboardProximity: Record<KeyboardMembership, number>;
    lengthDiff: Record<LengthMembership, number>;
  };
  activations: { id: string; output: CorrectnessLabel; strength: number }[];
  aggregatedOutput: Record<CorrectnessLabel, number>;
  fuzzyScore: number;
  heuristicScore: number;
}

interface ApiResponse {
  input: string;
  score: number;
  best: string | null;
  candidates: CandidateResponse[];
  explanation: {
    summary: string;
    dominantOutput: CorrectnessLabel;
    topRules: { id: string; output: CorrectnessLabel; strength: number }[];
    debug: InferenceDebugPayload;
  } | null;
  settings: {
    lang: SupportedLanguage;
    uiLang: WebsiteLanguage;
    maxDistance: number;
    topK: number;
    profile: FuzzyProfile;
  };
}

const prettyPercent = (value: number): string => `${Math.round(value * 100)}%`;

const buildExplanationSummary = (params: {
  language: WebsiteLanguage;
  input: string;
  candidate: string;
  score: number;
  outputLabel: string;
  features: CandidateFeatures;
}): string => {
  const { language, input, candidate, score, outputLabel, features } = params;

  if (language === "tr") {
    return [
      `"${candidate}" adayı, "${outputLabel}" bulanık çıktısı ile ${score.toFixed(1)} puan aldı.`,
      `Düzenleme mesafesi: ${features.editDistance}, klavye yakınlığı: ${prettyPercent(features.keyboardProximityScore)}.`,
      `"${input}" girdisi için önek benzerliği: ${prettyPercent(features.prefixSimilarity)}.`,
    ].join(" ");
  }

  if (language === "ar") {
    return [
      `المرشح "${candidate}" حصل على ${score.toFixed(1)} اعتمادًا على المخرج الضبابي "${outputLabel}".`,
      `مسافة التحرير: ${features.editDistance}، تقارب لوحة المفاتيح: ${prettyPercent(features.keyboardProximityScore)}.`,
      `تشابه البادئة لكلمة "${input}": ${prettyPercent(features.prefixSimilarity)}.`,
    ].join(" ");
  }

  return [
    `"${candidate}" scored ${score.toFixed(1)} based on fuzzy output "${outputLabel}".`,
    `Edit distance: ${features.editDistance}, keyboard proximity: ${prettyPercent(features.keyboardProximityScore)}.`,
    `Prefix similarity: ${prettyPercent(features.prefixSimilarity)} for input "${input}".`,
  ].join(" ");
};

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
    fuzzyGraphsTitle: string;
    inputMembershipGraphTitle: string;
    ruleStrengthGraphTitle: string;
    outputAggregationGraphTitle: string;
    scoreMixGraphTitle: string;
    graphInputEditLabel: string;
    graphInputKeyboardLabel: string;
    graphInputLengthLabel: string;
    scoreMixFuzzyLabel: string;
    scoreMixHeuristicLabel: string;
    scoreMixFinalLabel: string;
    debugSummaryLabel: string;
    debugDominantOutputLabel: string;
    debugTopRulesLabel: string;
    debugFuzzyScoreLabel: string;
    debugHeuristicScoreLabel: string;
    debugRuleStrengthLabel: string;
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
      websiteArabic: string;
      dictionaryEnglish: string;
      dictionaryTurkish: string;
      dictionaryArabic: string;
    };
    membershipLabels: {
      editDistance: Record<EditDistanceMembership, string>;
      keyboardProximity: Record<KeyboardMembership, string>;
      lengthDiff: Record<LengthMembership, string>;
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
    fuzzyGraphsTitle: "Fuzzy Logic Graphs",
    inputMembershipGraphTitle: "Input Memberships",
    ruleStrengthGraphTitle: "Rule Activations",
    outputAggregationGraphTitle: "Aggregated Output Curve",
    scoreMixGraphTitle: "Score Composition",
    graphInputEditLabel: "Edit Distance",
    graphInputKeyboardLabel: "Keyboard Proximity",
    graphInputLengthLabel: "Length Difference",
    scoreMixFuzzyLabel: "Fuzzy",
    scoreMixHeuristicLabel: "Heuristic",
    scoreMixFinalLabel: "Final",
    debugSummaryLabel: "Summary",
    debugDominantOutputLabel: "Dominant output",
    debugTopRulesLabel: "Top rules",
    debugFuzzyScoreLabel: "Fuzzy score",
    debugHeuristicScoreLabel: "Heuristic score",
    debugRuleStrengthLabel: "strength",
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
      websiteArabic: "Arabic UI",
      dictionaryEnglish: "English (en)",
      dictionaryTurkish: "Turkish (tr)",
      dictionaryArabic: "Arabic (ar)",
    },
    membershipLabels: {
      editDistance: {
        low: "low",
        medium: "medium",
        high: "high",
      },
      keyboardProximity: {
        near: "near",
        medium: "medium",
        far: "far",
      },
      lengthDiff: {
        small: "small",
        medium: "medium",
        large: "large",
      },
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
    fuzzyGraphsTitle: "Bulanık Mantık Grafikleri",
    inputMembershipGraphTitle: "Girdi Üyelikleri",
    ruleStrengthGraphTitle: "Kural Aktivasyonları",
    outputAggregationGraphTitle: "Birleşik Çıktı Eğrisi",
    scoreMixGraphTitle: "Skor Bileşimi",
    graphInputEditLabel: "Düzenleme Mesafesi",
    graphInputKeyboardLabel: "Klavye Yakınlığı",
    graphInputLengthLabel: "Uzunluk Farkı",
    scoreMixFuzzyLabel: "Bulanık",
    scoreMixHeuristicLabel: "Sezgisel",
    scoreMixFinalLabel: "Nihai",
    debugSummaryLabel: "Özet",
    debugDominantOutputLabel: "Baskın çıktı",
    debugTopRulesLabel: "Üst kurallar",
    debugFuzzyScoreLabel: "Bulanık skor",
    debugHeuristicScoreLabel: "Sezgisel skor",
    debugRuleStrengthLabel: "güç",
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
      websiteArabic: "Arapça Arayüz",
      dictionaryEnglish: "İngilizce (en)",
      dictionaryTurkish: "Türkçe (tr)",
      dictionaryArabic: "Arapça (ar)",
    },
    membershipLabels: {
      editDistance: {
        low: "düşük",
        medium: "orta",
        high: "yüksek",
      },
      keyboardProximity: {
        near: "yakın",
        medium: "orta",
        far: "uzak",
      },
      lengthDiff: {
        small: "küçük",
        medium: "orta",
        large: "büyük",
      },
    },
  },
  ar: {
    headerBadge: "نظام الاستدلال الضبابي",
    title: "مصحح الأخطاء الإملائية بالمنطق الضبابي",
    subtitle: "تصحيح محلي بالكلمات اعتمادًا على مسافة التحرير وقرب لوحة المفاتيح.",
    websiteLanguage: "لغة الواجهة",
    wordInput: "إدخال الكلمة",
    wordPlaceholder: "اكتب كلمة واحدة",
    dictionaryLanguage: "لغة القاموس",
    fuzzyProfile: "الملف الضبابي",
    maxEditDistance: "أقصى مسافة تحرير",
    resultCount: "عدد النتائج",
    correcting: "جارِ التقييم...",
    correctWord: "صحح الكلمة",
    results: "النتائج",
    noResults: "أرسل كلمة للحصول على اقتراحات مرتبة.",
    noReliable: "لم يتم العثور على تصحيح موثوق وفق القاموس والإعدادات الحالية.",
    bestMatch: "أفضل تطابق",
    topSuggestions: "أفضل الاقتراحات",
    predictionOverview: "ملخص التنبؤ",
    scoreLabel: "الدرجة",
    confidenceBandLabel: "مستوى الثقة",
    scoreGapLabel: "الفارق عن المرشح التالي",
    runnerUpLabel: "المرشح الثاني",
    exploratoryLabel: "اقتراحات استكشافية (ثقة منخفضة)",
    debugPanel: "لوحة التصحيح",
    fuzzyGraphsTitle: "رسوم المنطق الضبابي",
    inputMembershipGraphTitle: "عضويات المدخلات",
    ruleStrengthGraphTitle: "تفعيل القواعد",
    outputAggregationGraphTitle: "منحنى الخرج المجمّع",
    scoreMixGraphTitle: "تركيب الدرجة",
    graphInputEditLabel: "مسافة التحرير",
    graphInputKeyboardLabel: "قرب لوحة المفاتيح",
    graphInputLengthLabel: "فرق الطول",
    scoreMixFuzzyLabel: "ضبابي",
    scoreMixHeuristicLabel: "استدلالي",
    scoreMixFinalLabel: "نهائي",
    debugSummaryLabel: "الملخص",
    debugDominantOutputLabel: "الخرج المهيمن",
    debugTopRulesLabel: "أعلى القواعد",
    debugFuzzyScoreLabel: "الدرجة الضبابية",
    debugHeuristicScoreLabel: "الدرجة الاستدلالية",
    debugRuleStrengthLabel: "القوة",
    requestFailed: "فشل الطلب.",
    unexpectedError: "حدث خطأ غير متوقع.",
    metrics: {
      edit: "تحرير",
      keyboard: "لوحة المفاتيح",
      prefix: "البادئة",
      confidence: "الثقة",
    },
    outputLabels: {
      low: "منخفض",
      medium: "متوسط",
      high: "مرتفع",
      veryHigh: "مرتفع جدًا",
    },
    scoreBands: {
      strong: "قوية جدًا",
      good: "جيدة",
      weak: "ضعيفة",
      poor: "ضعيفة جدًا",
    },
    profileDescriptions: {
      strict: "مرشحون أقل مع عقوبات أقوى للمسافة.",
      balanced: "ملف عام للتصنيف اليومي.",
      forgiving: "يسمح بأخطاء أوسع ويكافئ قرب لوحة المفاتيح.",
    },
    profileLabels: {
      strict: "صارم",
      balanced: "متوازن",
      forgiving: "متسامح",
    },
    options: {
      websiteEnglish: "واجهة إنجليزية",
      websiteTurkish: "واجهة تركية",
      websiteArabic: "واجهة عربية",
      dictionaryEnglish: "الإنجليزية (en)",
      dictionaryTurkish: "التركية (tr)",
      dictionaryArabic: "العربية (ar)",
    },
    membershipLabels: {
      editDistance: {
        low: "منخفض",
        medium: "متوسط",
        high: "مرتفع",
      },
      keyboardProximity: {
        near: "قريب",
        medium: "متوسط",
        far: "بعيد",
      },
      lengthDiff: {
        small: "صغير",
        medium: "متوسط",
        large: "كبير",
      },
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

const GRAPH_OUTPUT_COLORS: Record<CorrectnessLabel, string> = {
  low: "#fda4af",
  medium: "#fde68a",
  high: "#5eead4",
  veryHigh: "#86efac",
};

const EDIT_DISTANCE_MEMBERSHIP_ORDER: EditDistanceMembership[] = ["low", "medium", "high"];
const KEYBOARD_MEMBERSHIP_ORDER: KeyboardMembership[] = ["near", "medium", "far"];
const LENGTH_MEMBERSHIP_ORDER: LengthMembership[] = ["small", "medium", "large"];
const OUTPUT_ORDER: CorrectnessLabel[] = ["low", "medium", "high", "veryHigh"];

const buildAggregatedOutputPolyline = (
  aggregatedOutput: Record<CorrectnessLabel, number>,
): string => {
  const labels = Object.keys(aggregatedOutput) as CorrectnessLabel[];
  const points: string[] = [];

  for (let x = 0; x <= 100; x += 2) {
    let aggregateMembership = 0;

    labels.forEach((label) => {
      const clipped = Math.min(aggregatedOutput[label], outputMembership(label, x));
      aggregateMembership = Math.max(aggregateMembership, clipped);
    });

    const y = Number((100 - aggregateMembership * 100).toFixed(2));
    points.push(`${x},${y}`);
  }

  return points.join(" ");
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
  const isRtlUi = websiteLanguage === "ar";
  const isRtlWord = lang === "ar";
  const bestScoreBand = toScoreBand(result?.score ?? 0);
  const runnerUp = result?.candidates[1] ?? null;
  const debugData = result?.explanation?.debug ?? null;
  const aggregatedOutputPolyline = debugData
    ? buildAggregatedOutputPolyline(debugData.aggregatedOutput)
    : "";
  const leadGap =
    result?.best && runnerUp ? Number(Math.max(result.score - runnerUp.score, 0).toFixed(2)) : 0;
  const localizedDebugSummary = useMemo(() => {
    if (!result?.explanation || !result.best) {
      return result?.explanation?.summary ?? "";
    }

    const bestCandidate =
      result.candidates.find((candidate) => candidate.word === result.best) ?? result.candidates[0];

    if (!bestCandidate) {
      return result.explanation.summary;
    }

    return buildExplanationSummary({
      language: websiteLanguage,
      input: result.input,
      candidate: result.best,
      score: result.score,
      outputLabel: uiText.outputLabels[result.explanation.dominantOutput],
      features: bestCandidate.features,
    });
  }, [result, uiText.outputLabels, websiteLanguage]);
  const membershipGroups = debugData
    ? [
        {
          key: "editDistance",
          title: uiText.graphInputEditLabel,
          estimate: debugData.crispInputs.editDistanceRatio,
          rows: EDIT_DISTANCE_MEMBERSHIP_ORDER.map((label) => ({
            key: label,
            label: uiText.membershipLabels.editDistance[label],
            value: debugData.fuzzifiedInputs.editDistance[label],
          })),
        },
        {
          key: "keyboardProximity",
          title: uiText.graphInputKeyboardLabel,
          estimate: debugData.crispInputs.keyboardProximityScore,
          rows: KEYBOARD_MEMBERSHIP_ORDER.map((label) => ({
            key: label,
            label: uiText.membershipLabels.keyboardProximity[label],
            value: debugData.fuzzifiedInputs.keyboardProximity[label],
          })),
        },
        {
          key: "lengthDiff",
          title: uiText.graphInputLengthLabel,
          estimate: debugData.crispInputs.lengthDiffRatio,
          rows: LENGTH_MEMBERSHIP_ORDER.map((label) => ({
            key: label,
            label: uiText.membershipLabels.lengthDiff[label],
            value: debugData.fuzzifiedInputs.lengthDiff[label],
          })),
        },
      ]
    : [];
  const scoreMixItems = debugData
    ? [
        {
          key: "fuzzy",
          label: uiText.scoreMixFuzzyLabel,
          value: debugData.fuzzyScore,
          tone: "bg-indigo-300",
        },
        {
          key: "heuristic",
          label: uiText.scoreMixHeuristicLabel,
          value: debugData.heuristicScore,
          tone: "bg-amber-300",
        },
        {
          key: "final",
          label: uiText.scoreMixFinalLabel,
          value: result?.score ?? 0,
          tone: "bg-emerald-300",
        },
      ]
    : [];

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

  useEffect(() => {
    document.documentElement.lang = websiteLanguage;
    document.documentElement.dir = websiteLanguage === "ar" ? "rtl" : "ltr";
  }, [websiteLanguage]);

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
          uiLang: websiteLanguage,
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
    <main
      className={`mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12 ${
        isRtlUi ? "text-right" : ""
      }`}
      dir={isRtlUi ? "rtl" : "ltr"}
      lang={websiteLanguage}
    >
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
                  className={`rounded-xl border border-white/35 bg-slate-900/60 px-3 py-2 font-mono text-slate-100 placeholder:text-slate-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                    isRtlWord ? "text-right" : ""
                  }`}
                  placeholder={uiText.wordPlaceholder}
                  dir={isRtlWord ? "rtl" : "ltr"}
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
                    <option value="ar">{uiText.options.websiteArabic}</option>
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
                    <option value="ar">{uiText.options.dictionaryArabic}</option>
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
                        <p
                          className="mt-1 font-mono text-xl text-slate-100"
                          dir={isRtlWord ? "rtl" : "ltr"}
                        >
                          {result.best}
                        </p>
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
                        <span dir={isRtlWord ? "rtl" : "ltr"}>{runnerUp?.word ?? "-"}</span>
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
                            <span
                              className="font-mono text-sm text-slate-100"
                              dir={isRtlWord ? "rtl" : "ltr"}
                            >
                              {isRtlWord
                                ? `${candidate.word} • ${index + 1}`
                                : `${index + 1}. ${candidate.word}`}
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
                    <div className="mt-3 space-y-3 text-xs text-slate-200">
                      <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                        <span className="text-slate-400">{uiText.debugSummaryLabel}: </span>
                        {localizedDebugSummary}
                      </p>

                      <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                        <span className="text-slate-400">{uiText.debugDominantOutputLabel}: </span>
                        {uiText.outputLabels[result.explanation.dominantOutput]}
                      </p>

                      <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                        <p className="mb-2 font-semibold text-slate-100">
                          {uiText.debugTopRulesLabel}
                        </p>
                        <ul className="space-y-1.5">
                          {result.explanation.topRules.map((rule) => (
                            <li
                              key={`${rule.id}-${rule.output}`}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-slate-300">
                                {rule.id} ({uiText.outputLabels[rule.output]})
                              </span>
                              <span className="font-mono text-slate-200">
                                {uiText.debugRuleStrengthLabel}: {rule.strength.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                          <span className="text-slate-400">{uiText.debugFuzzyScoreLabel}: </span>
                          <span className="font-mono">
                            {result.explanation.debug.fuzzyScore.toFixed(2)}
                          </span>
                        </p>
                        <p className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                          <span className="text-slate-400">
                            {uiText.debugHeuristicScoreLabel}:{" "}
                          </span>
                          <span className="font-mono">
                            {result.explanation.debug.heuristicScore.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {debugData ? (
        <section className="mt-8 rounded-3xl border border-white/25 bg-slate-950/45 p-5 backdrop-blur md:p-8">
          <h2 className="text-sm uppercase tracking-[0.25em] text-slate-300">
            {uiText.fuzzyGraphsTitle}
          </h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                {uiText.inputMembershipGraphTitle}
              </h3>
              <div className="mt-3 space-y-4 text-xs">
                {membershipGroups.map((group) => (
                  <div key={group.key} className="rounded-lg border border-white/10 p-2.5">
                    <div className="mb-2 flex items-center justify-between text-slate-200">
                      <span>{group.title}</span>
                      <span className="font-mono">{group.estimate.toFixed(3)}</span>
                    </div>
                    <div className="space-y-1.5">
                      {group.rows.map((row) => (
                        <div
                          key={`${group.key}-${row.key}`}
                          className="grid items-center gap-2 [grid-template-columns:minmax(86px,112px)_minmax(0,1fr)_44px]"
                        >
                          <span className="truncate text-slate-400" title={row.label}>
                            {row.label}
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-cyan-300"
                              style={{ width: `${Math.min(100, Math.max(0, row.value * 100))}%` }}
                            />
                          </div>
                          <span className="font-mono text-right text-slate-300">
                            {row.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                {uiText.ruleStrengthGraphTitle}
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                {debugData.activations.slice(0, 8).map((rule) => (
                  <div
                    key={`${rule.id}-${rule.output}`}
                    className="grid items-center gap-2 [grid-template-columns:minmax(120px,180px)_minmax(0,1fr)_44px]"
                  >
                    <span
                      className="truncate text-slate-300"
                      title={`${rule.id} (${uiText.outputLabels[rule.output]})`}
                    >
                      {rule.id} ({uiText.outputLabels[rule.output]})
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-300"
                        style={{ width: `${Math.min(100, Math.max(0, rule.strength * 100))}%` }}
                      />
                    </div>
                    <span className="font-mono text-right text-slate-200">
                      {rule.strength.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                {uiText.outputAggregationGraphTitle}
              </h3>
              <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/35 p-2">
                <svg className="h-32 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line
                    x1="0"
                    y1="100"
                    x2="100"
                    y2="100"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="0.7"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="100"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="0.7"
                  />
                  <polyline
                    points={aggregatedOutputPolyline}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {OUTPUT_ORDER.map((label) => (
                  <div
                    key={label}
                    className="grid items-center gap-2 [grid-template-columns:minmax(96px,132px)_minmax(0,1fr)_44px]"
                  >
                    <span className="truncate text-slate-300" title={uiText.outputLabels[label]}>
                      {uiText.outputLabels[label]}
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, debugData.aggregatedOutput[label] * 100))}%`,
                          backgroundColor: GRAPH_OUTPUT_COLORS[label],
                        }}
                      />
                    </div>
                    <span className="font-mono text-right text-slate-200">
                      {debugData.aggregatedOutput[label].toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/15 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-slate-100">{uiText.scoreMixGraphTitle}</h3>
              <div className="mt-3 space-y-3 text-xs">
                {scoreMixItems.map((item) => (
                  <div
                    key={item.key}
                    className="grid items-center gap-2 [grid-template-columns:minmax(96px,132px)_minmax(0,1fr)_52px]"
                  >
                    <span className="truncate text-slate-300" title={item.label}>
                      {item.label}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${item.tone}`}
                        style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                      />
                    </div>
                    <span className="font-mono text-right text-slate-200">
                      {item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
