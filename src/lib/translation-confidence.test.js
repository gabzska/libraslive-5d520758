import { describe, expect, test } from "bun:test";
import { assessTranslation, translationLabel } from "./translation-confidence";

describe("transparent translation confidence", () => {
  test("a fluent sentence cannot hide uncertain recognition", () => {
    expect(assessTranslation(0.4, 0.99)).toEqual({ confidence: 0.4, needsReview: true, corrected: false });
  });
  test("personal corrections do not manufacture 100 percent accuracy", () => {
    expect(assessTranslation(0.6, 0.9, true)).toEqual({ confidence: 0.6, needsReview: false, corrected: true });
    expect(translationLabel(0.6, true)).toBe("Correção pessoal");
  });
  test("invalid estimates remain uncertain", () => {
    expect(assessTranslation(NaN, 0.95).needsReview).toBe(true);
  });
});