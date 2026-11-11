/** Scores are estimates, never certified recognition accuracy. */
export function assessTranslation(recognition: number, language: number, corrected = false) {
  const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const confidence = Math.min(clamp(recognition), clamp(language));
  return { confidence, needsReview: !corrected && confidence < 0.8, corrected };
}

export function translationLabel(confidence: number, corrected = false) {
  if (corrected) return "Correção pessoal";
  return confidence < 0.8 ? "Tradução incerta · revise" : "Tradução sugerida";
}