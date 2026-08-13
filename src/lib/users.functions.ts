import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createUserInput,
  updateUserInput,
  deleteUserInput,
  type AppRole,
} from "./users.schema";

export type ManagedUser = {
  id: string;
  nome_completo: string;
  email: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Não foi possível validar sua permissão.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

/** Retorna o perfil + papel do usuário autenticado. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nome_completo, email, avatar_url, created_at")
      .eq("id", userId)
      .maybeSingle();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const role = (roles?.[0]?.role ?? "usuario") as AppRole;
    const email = (claims as { email?: string }).email ?? null;

    if (!profile) {
      await supabase.from("profiles").insert({
        id: userId,
        nome_completo: email?.split("@")[0] ?? "",
        email,
      });
    }

    return {
      id: userId,
      role,
      isAdmin: role === "admin",
      profile: profile ?? {
        id: userId,
        nome_completo: email?.split("@")[0] ?? "",
        email,
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
    };
  });

/** Primeiro usuário da plataforma pode assumir o papel de administrador. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error("Falha ao verificar administradores.");
    if ((count ?? 0) > 0) throw new Error("Já existe um administrador nesta plataforma.");

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertError) throw new Error("Não foi possível conceder o acesso de administrador.");
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nome_completo, email, avatar_url, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Não foi possível carregar os usuários.");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role as AppRole]));

    return (profiles ?? []).map((p) => ({
      ...p,
      role: roleByUser.get(p.id) ?? ("usuario" as AppRole),
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createUserInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome_completo: data.nomeCompleto },
    });
    if (error || !created.user) {
      throw new Error(
        error?.message?.includes("already")
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar o usuário.",
      );
    }

    const userId = created.user.id;
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      nome_completo: data.nomeCompleto,
      email: data.email,
      avatar_url: data.avatarUrl ?? null,
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });

    return { id: userId };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateUserInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        nome_completo: data.nomeCompleto,
        ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error("Não foi possível salvar as alterações.");

    if (data.password) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.password,
      });
      if (pwError) throw new Error("Não foi possível atualizar a senha.");
    }

    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role });
    }

    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteUserInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("Você não pode excluir a própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error("Não foi possível excluir o usuário.");
    return { ok: true };
  });
