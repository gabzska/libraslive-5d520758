
ALTER TABLE public.sinais ADD COLUMN IF NOT EXISTS imagem_url text;

WITH cat AS (SELECT id FROM public.categorias WHERE slug = 'alfabeto' LIMIT 1)
INSERT INTO public.sinais (palavra, slug, categoria_id, descricao, origem, aprovado, confianca)
SELECT letra, 'letra-' || lower(letra), (SELECT id FROM cat), descricao, 'seed_alfabeto', true, 1
FROM (VALUES
  ('A','Mão fechada, polegar ao lado dos dedos.'),
  ('B','Mão aberta, dedos juntos e estendidos, polegar dobrado sobre a palma.'),
  ('C','Mão em forma de C, dedos curvados.'),
  ('D','Indicador estendido para cima; demais dedos tocam o polegar formando um O.'),
  ('E','Dedos dobrados tocando o polegar; punho fechado parcialmente.'),
  ('F','Indicador e polegar formam um círculo; outros três dedos estendidos.'),
  ('G','Indicador e polegar estendidos paralelos, lateralmente.'),
  ('H','Indicador e médio estendidos juntos, lateralmente.'),
  ('I','Mindinho estendido para cima; demais dedos fechados.'),
  ('J','Mindinho estendido desenhando um J no ar.'),
  ('K','Indicador para cima, médio para o lado, polegar entre eles.'),
  ('L','Polegar e indicador estendidos formando um L.'),
  ('M','Três dedos (indicador, médio, anelar) sobre o polegar.'),
  ('N','Dois dedos (indicador, médio) sobre o polegar.'),
  ('O','Todos os dedos curvados tocando o polegar — forma de O.'),
  ('P','Como o K, porém apontando para baixo.'),
  ('Q','Como o G, porém apontando para baixo.'),
  ('R','Indicador e médio cruzados, estendidos.'),
  ('S','Punho fechado, polegar sobre os dedos.'),
  ('T','Punho fechado, polegar entre indicador e médio.'),
  ('U','Indicador e médio estendidos juntos, para cima.'),
  ('V','Indicador e médio estendidos formando V.'),
  ('W','Indicador, médio e anelar estendidos.'),
  ('X','Indicador dobrado em gancho; demais fechados.'),
  ('Y','Polegar e mindinho estendidos (hang-loose).'),
  ('Z','Indicador desenha um Z no ar.')
) AS t(letra, descricao)
ON CONFLICT (slug) DO NOTHING;
