
-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ CATEGORIAS ============
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  icone text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias publicas" ON public.categorias FOR SELECT USING (true);

-- ============ SINAIS ============
CREATE TABLE public.sinais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra text NOT NULL,
  slug text UNIQUE NOT NULL,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao text,
  video_url text,
  animacao_url text,
  sinonimos text[] NOT NULL DEFAULT '{}',
  relacionados text[] NOT NULL DEFAULT '{}',
  confianca numeric NOT NULL DEFAULT 1,
  origem text NOT NULL DEFAULT 'manual',
  aprovado boolean NOT NULL DEFAULT true,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sinais_palavra_trgm ON public.sinais USING gin (palavra gin_trgm_ops);
CREATE INDEX sinais_categoria_idx ON public.sinais (categoria_id);
GRANT SELECT ON public.sinais TO anon, authenticated;
GRANT INSERT ON public.sinais TO authenticated;
GRANT ALL ON public.sinais TO service_role;
ALTER TABLE public.sinais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sinais aprovados publicos" ON public.sinais FOR SELECT USING (aprovado = true);

-- ============ FRASES HOSPITAL ============
CREATE TABLE public.frases_hospital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  prioridade int NOT NULL DEFAULT 0,
  texto_pt text NOT NULL,
  gloss text,
  icone text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.frases_hospital TO anon, authenticated;
GRANT ALL ON public.frases_hospital TO service_role;
ALTER TABLE public.frases_hospital ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frases publicas" ON public.frases_hospital FOR SELECT USING (true);

-- ============ HISTORICO TRADUCAO ============
CREATE TABLE public.historico_traducao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  direcao text NOT NULL,
  entrada text NOT NULL,
  saida text,
  confianca numeric,
  contexto jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX historico_user_idx ON public.historico_traducao (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.historico_traducao TO anon, authenticated;
GRANT ALL ON public.historico_traducao TO service_role;
ALTER TABLE public.historico_traducao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico insert publico" ON public.historico_traducao
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "historico select dono" ON public.historico_traducao
  FOR SELECT USING (user_id IS NOT NULL AND user_id = auth.uid());

-- ============ FEEDBACKS ============
CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sinal_id uuid REFERENCES public.sinais(id) ON DELETE SET NULL,
  traducao_id uuid REFERENCES public.historico_traducao(id) ON DELETE SET NULL,
  user_id uuid,
  tipo text NOT NULL,
  mensagem text,
  payload jsonb,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedbacks TO anon, authenticated;
GRANT ALL ON public.feedbacks TO service_role;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback insert publico" ON public.feedbacks
  FOR INSERT WITH CHECK (true);

-- ============ CONTRIBUICOES SINAIS ============
CREATE TABLE public.contribuicoes_sinais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  palavra text NOT NULL,
  descricao text,
  video_url text,
  categoria_sugerida text,
  status text NOT NULL DEFAULT 'pendente',
  revisor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contribuicoes_sinais TO anon, authenticated;
GRANT ALL ON public.contribuicoes_sinais TO service_role;
ALTER TABLE public.contribuicoes_sinais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrib insert publico" ON public.contribuicoes_sinais
  FOR INSERT WITH CHECK (true);

-- ============ PROGRESSO EDUCACAO ============
CREATE TABLE public.progresso_educacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  modulo text NOT NULL,
  acertos int NOT NULL DEFAULT 0,
  erros int NOT NULL DEFAULT 0,
  tempo_seg int NOT NULL DEFAULT 0,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX progresso_user_idx ON public.progresso_educacao (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.progresso_educacao TO authenticated;
GRANT ALL ON public.progresso_educacao TO service_role;
ALTER TABLE public.progresso_educacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progresso dono select" ON public.progresso_educacao
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "progresso dono insert" ON public.progresso_educacao
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============ SEED CATEGORIAS ============
INSERT INTO public.categorias (slug, nome, icone, ordem) VALUES
  ('saudacoes','Saudações','Hand',1),
  ('pronomes','Pronomes','User',2),
  ('familia','Família','Users',3),
  ('alimentacao','Alimentação','UtensilsCrossed',4),
  ('saude','Saúde','HeartPulse',5),
  ('educacao','Educação','GraduationCap',6),
  ('tempo','Tempo','Clock',7),
  ('numeros','Números','Hash',8),
  ('alfabeto','Alfabeto','TypeOutline',9),
  ('emergencia','Emergência','Siren',10),
  ('hospital','Hospital','Stethoscope',11),
  ('sentimentos','Sentimentos','Smile',12),
  ('cotidiano','Cotidiano','Coffee',13);

-- ============ SEED SINAIS (subset) ============
INSERT INTO public.sinais (palavra, slug, categoria_id, descricao, sinonimos)
SELECT v.palavra, v.slug, c.id, v.descricao, v.sinonimos
FROM (VALUES
  ('Olá','ola','saudacoes','Cumprimento informal',ARRAY['oi','e aí']),
  ('Bom dia','bom-dia','saudacoes','Saudação matinal',ARRAY[]::text[]),
  ('Boa tarde','boa-tarde','saudacoes','Saudação vespertina',ARRAY[]::text[]),
  ('Boa noite','boa-noite','saudacoes','Saudação noturna',ARRAY[]::text[]),
  ('Tchau','tchau','saudacoes','Despedida',ARRAY['até logo']),
  ('Obrigado','obrigado','saudacoes','Agradecimento',ARRAY['obrigada','valeu']),
  ('Por favor','por-favor','saudacoes','Pedido cortês',ARRAY[]::text[]),
  ('Desculpe','desculpe','saudacoes','Pedido de desculpas',ARRAY['desculpa','perdão']),
  ('Sim','sim','saudacoes','Afirmação',ARRAY[]::text[]),
  ('Não','nao','saudacoes','Negação',ARRAY[]::text[]),
  ('Eu','eu','pronomes','Primeira pessoa',ARRAY[]::text[]),
  ('Você','voce','pronomes','Segunda pessoa',ARRAY['tu']),
  ('Ele','ele','pronomes','Terceira pessoa',ARRAY[]::text[]),
  ('Ela','ela','pronomes','Terceira pessoa fem.',ARRAY[]::text[]),
  ('Nós','nos','pronomes','Primeira pessoa pl.',ARRAY['a gente']),
  ('Eles','eles','pronomes','Terceira pessoa pl.',ARRAY[]::text[]),
  ('Mãe','mae','familia','Genitora',ARRAY['mamãe']),
  ('Pai','pai','familia','Genitor',ARRAY['papai']),
  ('Filho','filho','familia','Descendente',ARRAY[]::text[]),
  ('Filha','filha','familia','Descendente fem.',ARRAY[]::text[]),
  ('Irmão','irmao','familia','Irmão',ARRAY[]::text[]),
  ('Irmã','irma','familia','Irmã',ARRAY[]::text[]),
  ('Família','familia','familia','Núcleo familiar',ARRAY[]::text[]),
  ('Amigo','amigo','familia','Amizade',ARRAY['amiga']),
  ('Água','agua','alimentacao','Líquido',ARRAY[]::text[]),
  ('Comida','comida','alimentacao','Alimento',ARRAY['comer']),
  ('Pão','pao','alimentacao','Alimento básico',ARRAY[]::text[]),
  ('Café','cafe','alimentacao','Bebida',ARRAY[]::text[]),
  ('Leite','leite','alimentacao','Bebida',ARRAY[]::text[]),
  ('Fruta','fruta','alimentacao','Alimento natural',ARRAY[]::text[]),
  ('Beber','beber','alimentacao','Ingerir líquido',ARRAY[]::text[]),
  ('Comer','comer','alimentacao','Ingerir alimento',ARRAY[]::text[]),
  ('Dor','dor','saude','Sensação dolorosa',ARRAY[]::text[]),
  ('Febre','febre','saude','Temperatura alta',ARRAY[]::text[]),
  ('Cabeça','cabeca','saude','Parte do corpo',ARRAY[]::text[]),
  ('Barriga','barriga','saude','Abdômen',ARRAY['estômago']),
  ('Médico','medico','saude','Profissional',ARRAY['doutor']),
  ('Hospital','hospital','saude','Estabelecimento',ARRAY[]::text[]),
  ('Remédio','remedio','saude','Medicamento',ARRAY[]::text[]),
  ('Doente','doente','saude','Estado de saúde',ARRAY['enfermo']),
  ('Bem','bem','saude','Bom estado',ARRAY[]::text[]),
  ('Mal','mal','saude','Estado ruim',ARRAY[]::text[]),
  ('Escola','escola','educacao','Instituição',ARRAY[]::text[]),
  ('Professor','professor','educacao','Docente',ARRAY['professora']),
  ('Aluno','aluno','educacao','Estudante',ARRAY['aluna']),
  ('Estudar','estudar','educacao','Aprender',ARRAY[]::text[]),
  ('Aprender','aprender','educacao','Adquirir conhecimento',ARRAY[]::text[]),
  ('Livro','livro','educacao','Material de leitura',ARRAY[]::text[]),
  ('Faculdade','faculdade','educacao','Ensino superior',ARRAY['universidade']),
  ('Medicina','medicina','educacao','Curso superior',ARRAY[]::text[]),
  ('Hoje','hoje','tempo','Dia atual',ARRAY[]::text[]),
  ('Ontem','ontem','tempo','Dia anterior',ARRAY[]::text[]),
  ('Amanhã','amanha','tempo','Dia seguinte',ARRAY[]::text[]),
  ('Agora','agora','tempo','Momento atual',ARRAY[]::text[]),
  ('Depois','depois','tempo','Posterior',ARRAY[]::text[]),
  ('Futuro','futuro','tempo','Tempo vindouro',ARRAY[]::text[]),
  ('Passado','passado','tempo','Tempo anterior',ARRAY[]::text[]),
  ('Casa','casa','cotidiano','Lar',ARRAY[]::text[]),
  ('Trabalho','trabalho','cotidiano','Labor',ARRAY['trabalhar']),
  ('Carro','carro','cotidiano','Veículo',ARRAY[]::text[]),
  ('Ônibus','onibus','cotidiano','Transporte',ARRAY[]::text[]),
  ('Dinheiro','dinheiro','cotidiano','Moeda',ARRAY[]::text[]),
  ('Comprar','comprar','cotidiano','Adquirir',ARRAY[]::text[]),
  ('Telefone','telefone','cotidiano','Aparelho',ARRAY['celular']),
  ('Internet','internet','cotidiano','Rede',ARRAY[]::text[]),
  ('Feliz','feliz','sentimentos','Alegria',ARRAY['alegre']),
  ('Triste','triste','sentimentos','Tristeza',ARRAY[]::text[]),
  ('Amor','amor','sentimentos','Afeto',ARRAY['amar']),
  ('Medo','medo','sentimentos','Receio',ARRAY[]::text[]),
  ('Raiva','raiva','sentimentos','Ira',ARRAY['bravo']),
  ('Saudade','saudade','sentimentos','Falta',ARRAY[]::text[]),
  ('Paz','paz','sentimentos','Tranquilidade',ARRAY[]::text[]),
  ('Gostar','gostar','sentimentos','Apreciar',ARRAY[]::text[]),
  ('Falar','falar','cotidiano','Comunicar',ARRAY['conversar']),
  ('Pensar','pensar','cotidiano','Refletir',ARRAY[]::text[]),
  ('Saber','saber','cotidiano','Conhecer',ARRAY[]::text[]),
  ('Querer','querer','cotidiano','Desejar',ARRAY[]::text[]),
  ('Ajudar','ajudar','cotidiano','Auxiliar',ARRAY['ajuda']),
  ('Esperar','esperar','cotidiano','Aguardar',ARRAY[]::text[]),
  ('Nome','nome','cotidiano','Identificação',ARRAY[]::text[]),
  ('Chamar','chamar','cotidiano','Denominar',ARRAY['me chamo'])
) AS v(palavra, slug, cat_slug, descricao, sinonimos)
JOIN public.categorias c ON c.slug = v.cat_slug;

-- ============ SEED FRASES HOSPITAL ============
INSERT INTO public.frases_hospital (categoria, prioridade, texto_pt, gloss, icone, ordem) VALUES
  ('emergencia',10,'Você precisa de ajuda urgente?','VOCE PRECISAR AJUDA URGENTE','Siren',1),
  ('emergencia',10,'Está sentindo muita dor?','VOCE SENTIR DOR FORTE','HeartPulse',2),
  ('emergencia',10,'Vou chamar o médico agora.','EU CHAMAR MEDICO AGORA','UserPlus',3),
  ('emergencia',10,'Respire fundo, vou te ajudar.','RESPIRAR FUNDO EU AJUDAR','Wind',4),
  ('emergencia',9,'Está consciente?','VOCE CONSCIENTE','Eye',5),
  ('sintoma',5,'Onde está doendo?','ONDE DOER','MapPin',1),
  ('sintoma',5,'Há quanto tempo sente isso?','TEMPO QUANTO SENTIR','Clock',2),
  ('sintoma',5,'Tem febre?','FEBRE TER','Thermometer',3),
  ('sintoma',5,'Tem náusea ou vontade de vomitar?','NAUSEA VOMITAR','Soup',4),
  ('sintoma',5,'Está tomando algum remédio?','REMEDIO TOMAR','Pill',5),
  ('sintoma',5,'Tem alergia a algum medicamento?','ALERGIA REMEDIO','AlertTriangle',6),
  ('admissao',3,'Bem-vindo. Qual é o seu nome?','BEM-VINDO NOME VOCE','UserCheck',1),
  ('admissao',3,'Pode me mostrar seu documento?','DOCUMENTO MOSTRAR','IdCard',2),
  ('admissao',3,'Você tem convênio?','CONVENIO TER','FileText',3),
  ('admissao',3,'Aguarde, vou chamar a enfermeira.','AGUARDAR EU CHAMAR ENFERMEIRA','User',4),
  ('exame',2,'Vou medir sua pressão.','EU MEDIR PRESSAO','Activity',1),
  ('exame',2,'Vou coletar sangue.','EU COLETAR SANGUE','Droplet',2),
  ('exame',2,'Precisamos fazer um raio-X.','RAIO-X FAZER','Scan',3),
  ('exame',2,'Fique em jejum por 8 horas.','JEJUM 8 HORAS','Hourglass',4),
  ('exame',2,'Beba bastante água antes do exame.','AGUA BEBER ANTES EXAME','Droplets',5),
  ('alta',1,'Você está liberado.','VOCE LIBERADO','CheckCircle',1),
  ('alta',1,'Tome o remédio de 8 em 8 horas.','REMEDIO TOMAR 8 EM 8 HORAS','Pill',2),
  ('alta',1,'Volte em uma semana para reavaliação.','VOLTAR SEMANA REAVALIACAO','CalendarCheck',3),
  ('alta',1,'Descanse e beba bastante água.','DESCANSAR AGUA BEBER','Bed',4),
  ('alta',1,'Qualquer dúvida, retorne ao hospital.','DUVIDA VOLTAR HOSPITAL','Phone',5);

-- trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER sinais_updated_at BEFORE UPDATE ON public.sinais
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
