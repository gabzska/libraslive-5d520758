
ALTER TABLE public.sinais
  ADD COLUMN IF NOT EXISTS significado text,
  ADD COLUMN IF NOT EXISTS contexto_uso text,
  ADD COLUMN IF NOT EXISTS exemplos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS variacoes_regionais jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS categoria_gramatical text,
  ADD COLUMN IF NOT EXISTS fonte text;

CREATE INDEX IF NOT EXISTS sinais_cat_gram_idx ON public.sinais (categoria_gramatical);

CREATE TABLE IF NOT EXISTS public.correcoes_traducao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direcao text NOT NULL CHECK (direcao IN ('pt_libras','libras_pt')),
  entrada text NOT NULL,
  entrada_norm text NOT NULL,
  saida_original text,
  saida_corrigida text NOT NULL,
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  votos int NOT NULL DEFAULT 1,
  aplicada boolean NOT NULL DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.correcoes_traducao TO authenticated;
GRANT SELECT, INSERT ON public.correcoes_traducao TO anon;
GRANT ALL ON public.correcoes_traducao TO service_role;

ALTER TABLE public.correcoes_traducao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "correcoes leitura publica" ON public.correcoes_traducao
  FOR SELECT USING (true);
CREATE POLICY "correcoes insert publico" ON public.correcoes_traducao
  FOR INSERT WITH CHECK (true);
CREATE POLICY "correcoes update publico" ON public.correcoes_traducao
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS correcoes_entrada_norm_idx ON public.correcoes_traducao (direcao, entrada_norm);
CREATE INDEX IF NOT EXISTS correcoes_votos_idx ON public.correcoes_traducao (votos DESC);

CREATE TRIGGER correcoes_traducao_updated_at
  BEFORE UPDATE ON public.correcoes_traducao
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
