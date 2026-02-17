import type {
  CandidateExplanation,
  CandidateFeatures,
  CorrectnessLabel,
  UiLanguage,
} from "./config";
import type { InferenceResult } from "./inference";

const asPercent = (value: number): string => `${Math.round(value * 100)}%`;

const localizedOutputLabels: Record<UiLanguage, Record<CorrectnessLabel, string>> = {
  en: {
    low: "low",
    medium: "medium",
    high: "high",
    veryHigh: "very high",
  },
  tr: {
    low: "düşük",
    medium: "orta",
    high: "yüksek",
    veryHigh: "çok yüksek",
  },
  ar: {
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",
    veryHigh: "مرتفع جدًا",
  },
};

export const explainCandidate = (
  input: string,
  candidate: string,
  features: CandidateFeatures,
  inference: InferenceResult,
  uiLang: UiLanguage = "en",
): CandidateExplanation => {
  const topRules = inference.debug.activations.slice(0, 3);
  const outputLabel = localizedOutputLabels[uiLang][inference.dominantOutput];
  let summary = "";

  if (uiLang === "tr") {
    summary = [
      `"${candidate}" adayı, "${outputLabel}" bulanık çıktısı ile ${inference.score.toFixed(1)} puan aldı.`,
      `Düzenleme mesafesi: ${features.editDistance}, klavye yakınlığı: ${asPercent(features.keyboardProximityScore)}.`,
      `"${input}" girdisi için önek benzerliği: ${asPercent(features.prefixSimilarity)}.`,
    ].join(" ");
  } else if (uiLang === "ar") {
    summary = [
      `المرشح "${candidate}" حصل على ${inference.score.toFixed(1)} اعتمادًا على المخرج الضبابي "${outputLabel}".`,
      `مسافة التحرير: ${features.editDistance}، تقارب لوحة المفاتيح: ${asPercent(features.keyboardProximityScore)}.`,
      `تشابه البادئة لكلمة "${input}": ${asPercent(features.prefixSimilarity)}.`,
    ].join(" ");
  } else {
    summary = [
      `"${candidate}" scored ${inference.score.toFixed(1)} based on fuzzy output "${outputLabel}".`,
      `Edit distance: ${features.editDistance}, keyboard proximity: ${asPercent(features.keyboardProximityScore)}.`,
      `Prefix similarity: ${asPercent(features.prefixSimilarity)} for input "${input}".`,
    ].join(" ");
  }

  return {
    summary,
    dominantOutput: inference.dominantOutput,
    topRules,
    debug: inference.debug,
  };
};
