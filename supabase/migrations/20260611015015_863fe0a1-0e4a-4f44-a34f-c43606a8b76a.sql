CREATE TABLE public.ranking_publico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apelido text NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  nivel integer NOT NULL DEFAULT 1,
  streak_atual integer NOT NULL DEFAULT 0,
  streak_recorde integer NOT NULL DEFAULT 0,
  medalhas integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT apelido_formato CHECK (apelido ~ '^[A-Za-z0-9_-]{3,20}$')
);

GRANT SELECT, INSERT, UPDATE ON public.ranking_publico TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ranking_publico TO authenticated;
GRANT ALL ON public.ranking_publico TO service_role;

ALTER TABLE public.ranking_publico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking publico leitura" ON public.ranking_publico
  FOR SELECT USING (true);
CREATE POLICY "ranking publico insert" ON public.ranking_publico
  FOR INSERT WITH CHECK (true);
CREATE POLICY "ranking publico update" ON public.ranking_publico
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE TRIGGER ranking_publico_updated_at
  BEFORE UPDATE ON public.ranking_publico
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX ranking_publico_xp_idx ON public.ranking_publico (xp DESC, updated_at DESC);