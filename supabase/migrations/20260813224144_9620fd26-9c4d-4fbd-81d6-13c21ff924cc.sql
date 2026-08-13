-- 1. Move has_role out of the exposed API schema
CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- repoint existing policies
DROP POLICY IF EXISTS "admin remove perfis" ON public.profiles;
DROP POLICY IF EXISTS "editar proprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "perfil proprio visivel" ON public.profiles;
DROP POLICY IF EXISTS "ver proprias permissoes" ON public.user_roles;

CREATE POLICY "admin remove perfis" ON public.profiles FOR DELETE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'));
CREATE POLICY "editar proprio perfil" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR app_private.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR app_private.has_role(auth.uid(), 'admin'));
CREATE POLICY "perfil proprio visivel" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR app_private.has_role(auth.uid(), 'admin'));
CREATE POLICY "ver proprias permissoes" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR app_private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "avatars upload proprio" ON storage.objects;
DROP POLICY IF EXISTS "avatars update proprio" ON storage.objects;
DROP POLICY IF EXISTS "avatars delete proprio" ON storage.objects;
CREATE POLICY "avatars upload proprio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR app_private.has_role(auth.uid(), 'admin')));
CREATE POLICY "avatars update proprio" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR app_private.has_role(auth.uid(), 'admin')));
CREATE POLICY "avatars delete proprio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR app_private.has_role(auth.uid(), 'admin')));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2. sinais: only admins/moderators can update
DROP POLICY IF EXISTS "sinais_update_public" ON public.sinais;
CREATE POLICY "sinais update staff" ON public.sinais FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin') OR app_private.has_role(auth.uid(), 'moderador'))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin') OR app_private.has_role(auth.uid(), 'moderador'));

-- 3. aulas: require auth and bind author
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS criado_por uuid DEFAULT auth.uid();
DROP POLICY IF EXISTS "Qualquer um pode criar aulas públicas (MVP sem auth)" ON public.aulas;
CREATE POLICY "aulas insert autenticado" ON public.aulas FOR INSERT TO authenticated
  WITH CHECK (publica = true AND criado_por = auth.uid());
CREATE POLICY "aulas autor visualiza" ON public.aulas FOR SELECT TO authenticated
  USING (criado_por = auth.uid());
CREATE POLICY "aulas autor edita" ON public.aulas FOR UPDATE TO authenticated
  USING (criado_por = auth.uid()) WITH CHECK (criado_por = auth.uid());

-- 4. ranking_publico: tie rows to the authenticated user
ALTER TABLE public.ranking_publico ADD COLUMN IF NOT EXISTS user_id uuid;
DELETE FROM public.ranking_publico WHERE user_id IS NULL;
ALTER TABLE public.ranking_publico ALTER COLUMN user_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ranking_publico_user_id_key ON public.ranking_publico(user_id);
DROP POLICY IF EXISTS "ranking publico insert" ON public.ranking_publico;
DROP POLICY IF EXISTS "ranking publico update" ON public.ranking_publico;
CREATE POLICY "ranking insert dono" ON public.ranking_publico FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ranking update dono" ON public.ranking_publico FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. correcoes_traducao: no public updates (server-side only)
DROP POLICY IF EXISTS "correcoes update publico" ON public.correcoes_traducao;
REVOKE UPDATE ON public.correcoes_traducao FROM anon, authenticated;
GRANT ALL ON public.correcoes_traducao TO service_role;

-- 6. storage: sinais-midia writes restricted to staff
DROP POLICY IF EXISTS "sinais_midia_insert" ON storage.objects;
DROP POLICY IF EXISTS "sinais_midia_update" ON storage.objects;
DROP POLICY IF EXISTS "sinais_midia_delete" ON storage.objects;
CREATE POLICY "sinais_midia_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sinais-midia' AND (app_private.has_role(auth.uid(), 'admin') OR app_private.has_role(auth.uid(), 'moderador')));
CREATE POLICY "sinais_midia_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'sinais-midia' AND (app_private.has_role(auth.uid(), 'admin') OR app_private.has_role(auth.uid(), 'moderador')))
  WITH CHECK (bucket_id = 'sinais-midia' AND (app_private.has_role(auth.uid(), 'admin') OR app_private.has_role(auth.uid(), 'moderador')));
CREATE POLICY "sinais_midia_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sinais-midia' AND (app_private.has_role(auth.uid(), 'admin') OR app_private.has_role(auth.uid(), 'moderador')));