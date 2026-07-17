CREATE TABLE public.inscricoes_novidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  interesse TEXT,
  origem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX inscricoes_novidades_email_key ON public.inscricoes_novidades (lower(email));

GRANT INSERT ON public.inscricoes_novidades TO anon, authenticated;
GRANT ALL ON public.inscricoes_novidades TO service_role;

ALTER TABLE public.inscricoes_novidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode se inscrever"
  ON public.inscricoes_novidades
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(nome)) BETWEEN 1 AND 120
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(email) <= 200
    AND (interesse IS NULL OR interesse IN ('acompanhar','testar','parceiro','investir'))
  );