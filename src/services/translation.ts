/**
 * Core Translation Engine
 * Responsável por orquestrar a tradução bidirecional Libras ↔ Português.
 * Hoje delega para os hooks de câmera/voz e para a fn de IA contextual.
 */
import { reconstructSentence } from "@/lib/libras.functions";
import { translateToVLibras } from "@/lib/vlibras";

export const TranslationEngine = {
  /** Libras (glosas reconhecidas pela câmera) → frase em PT-BR natural. */
  signsToPortuguese: (glosses: string[], context?: string[]) =>
    reconstructSentence({ data: { glosses, context } }),

  /** PT-BR → Libras (avatar VLibras). */
  portugueseToSigns: (text: string) => translateToVLibras(text),
};
