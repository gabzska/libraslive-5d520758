
-- Move pg_trgm to dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Tighten permissive INSERT policies (require minimum payload + user_id match if provided)
DROP POLICY IF EXISTS "feedback insert publico" ON public.feedbacks;
CREATE POLICY "feedback insert validado" ON public.feedbacks
  FOR INSERT WITH CHECK (
    tipo IN ('correcao','sugestao','erro')
    AND (mensagem IS NOT NULL AND length(mensagem) BETWEEN 1 AND 2000)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "contrib insert publico" ON public.contribuicoes_sinais;
CREATE POLICY "contrib insert validado" ON public.contribuicoes_sinais
  FOR INSERT WITH CHECK (
    length(palavra) BETWEEN 1 AND 120
    AND (descricao IS NULL OR length(descricao) <= 2000)
    AND (user_id IS NULL OR user_id = auth.uid())
  );
