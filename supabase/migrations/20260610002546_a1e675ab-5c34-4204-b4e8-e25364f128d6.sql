CREATE TABLE public.aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  titulo text NOT NULL,
  disciplina text,
  nivel text,
  autor_nome text,
  texto_pt text NOT NULL,
  descricao text,
  publica boolean NOT NULL DEFAULT true,
  visualizacoes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.aulas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aulas públicas são visíveis a todos"
  ON public.aulas FOR SELECT
  USING (publica = true);

CREATE POLICY "Qualquer um pode criar aulas públicas (MVP sem auth)"
  ON public.aulas FOR INSERT
  TO anon, authenticated
  WITH CHECK (publica = true);

CREATE INDEX idx_aulas_created_at ON public.aulas(created_at DESC);
CREATE INDEX idx_aulas_disciplina ON public.aulas(disciplina);

CREATE TRIGGER tg_aulas_updated_at
  BEFORE UPDATE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();