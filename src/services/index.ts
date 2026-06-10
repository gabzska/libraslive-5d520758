/**
 * Camada de serviços do LibrasLive.
 *
 * Cada módulo é encapsulado num serviço com fronteira clara, permitindo
 * que sejam evoluídos ou substituídos sem impactar a UI. A implementação
 * inicial reusa o que já existe (Supabase + server fns), mas a interface
 * pública (este arquivo) é estável e serve como contrato do ecossistema.
 */

export * as TranslationEngine from "./translation";
export * as SignalLibrary from "./signal-library";
export * as LearningService from "./learning";
export * as EducationService from "./education";
export * as HealthService from "./health";
