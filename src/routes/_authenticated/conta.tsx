import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, Camera, ShieldCheck, LogOut, Users, Save } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeader } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, claimFirstAdmin } from "@/lib/users.functions";
import { getAvatarUrl, uploadAvatar, initials } from "@/lib/avatar";
import { ROLE_LABEL, type AppRole } from "@/lib/users.schema";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — LibrasLive AI" },
      {
        name: "description",
        content: "Gerencie seu perfil, foto e preferências de acesso na plataforma LibrasLive AI.",
      },
      { property: "og:title", content: "Minha conta — LibrasLive AI" },
      { property: "og:description", content: "Perfil e preferências da sua conta LibrasLive AI." },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const claimAdmin = useServerFn(claimFirstAdmin);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["minha-conta"],
    queryFn: () => fetchAccount({}),
  });

  const [nome, setNome] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!data) return;
    setNome(data.profile.nome_completo ?? "");
    setAvatarPath(data.profile.avatar_url ?? null);
  }, [data]);

  useEffect(() => {
    void getAvatarUrl(avatarPath).then(setAvatarSrc);
  }, [avatarPath]);

  const nomeErro =
    nome.trim().length > 0 && nome.trim().length < 3 ? "Mínimo de 3 caracteres" : undefined;

  async function handleUpload(file: File) {
    if (!data) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadAvatar(data.id, file);
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", data.id);
      setAvatarPath(path);
      toast.success("Foto atualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!data || nomeErro) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome_completo: nome.trim() })
      .eq("id", data.id);
    setSaving(false);
    if (error) toast.error("Não foi possível salvar.");
    else {
      toast.success("Perfil atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["minha-conta"] });
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Conta"
        title="Minha conta"
        description="Atualize suas informações pessoais e gerencie o acesso à plataforma."
        actions={
          <button
            onClick={handleSignOut}
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition hover:bg-accent active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        }
      />

      {isLoading ? (
        <div className="grid h-52 place-items-center rounded-2xl border bg-card/60">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`Foto de perfil de ${nome || "usuário"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(nome || data?.profile.email || "")
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  aria-label="Alterar foto de perfil"
                  className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow transition hover:brightness-110 active:scale-95"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="mt-4 font-semibold">{nome || "Sem nome"}</p>
              <p className="text-sm text-muted-foreground">{data?.profile.email}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ROLE_LABEL[(data?.role ?? "usuario") as AppRole]}
              </span>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold">Dados pessoais</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="nome" className="text-sm font-medium">
                    Nome completo
                  </label>
                  <input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    aria-invalid={!!nomeErro}
                    className={`h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 ${
                      nomeErro ? "border-destructive" : ""
                    }`}
                  />
                  {nomeErro && <p className="text-xs text-destructive">{nomeErro}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <input
                    id="email"
                    value={data?.profile.email ?? ""}
                    readOnly
                    className="h-11 w-full rounded-xl border bg-muted/50 px-3 text-sm text-muted-foreground"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !!nomeErro}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar alterações
              </button>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold">Administração</h2>
              {data?.isAdmin ? (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Você pode criar, editar e remover usuários da plataforma.
                  </p>
                  <Link
                    to="/usuarios"
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border bg-background px-5 text-sm font-medium transition hover:bg-accent active:scale-[0.99]"
                  >
                    <Users className="h-4 w-4" /> Gerenciar usuários
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se esta é a primeira conta da plataforma, você pode assumir o papel de
                    administrador.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await claimAdmin({});
                        toast.success("Você agora é administrador.");
                        void queryClient.invalidateQueries({ queryKey: ["minha-conta"] });
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Não foi possível concluir.",
                        );
                      }
                    }}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border bg-background px-5 text-sm font-medium transition hover:bg-accent active:scale-[0.99]"
                  >
                    <ShieldCheck className="h-4 w-4" /> Tornar-me administrador
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
