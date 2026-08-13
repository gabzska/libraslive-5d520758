import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  ShieldAlert,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeader, EmptyState } from "@/components/PageShell";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type ManagedUser,
} from "@/lib/users.functions";
import {
  APP_ROLES,
  ROLE_LABEL,
  ROLE_DESCRIPTION,
  createUserInput,
  senhaSchema,
  type AppRole,
} from "@/lib/users.schema";
import { initials } from "@/lib/avatar";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Gerenciar usuários — LibrasLive AI" },
      {
        name: "description",
        content:
          "Crie, edite e remova usuários da plataforma LibrasLive AI, definindo perfis e permissões de acesso.",
      },
      { property: "og:title", content: "Gerenciar usuários — LibrasLive AI" },
      {
        property: "og:description",
        content: "Painel de administração de contas e permissões do LibrasLive AI.",
      },
    ],
  }),
  component: UsuariosPage,
});

type FormState = {
  id?: string;
  nomeCompleto: string;
  email: string;
  password: string;
  confirma: string;
  role: AppRole;
};

const emptyForm: FormState = {
  nomeCompleto: "",
  email: "",
  password: "",
  confirma: "",
  role: "usuario",
};

function UsuariosPage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const update = useServerFn(updateUser);
  const remove = useServerFn(deleteUser);

  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fetchUsers({}),
    retry: false,
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (u) =>
        u.nome_completo.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [data, busca]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["usuarios"] });

  const saveMutation = useMutation({
    mutationFn: async (state: FormState) => {
      if (state.id) {
        return update({
          data: {
            id: state.id,
            nomeCompleto: state.nomeCompleto.trim(),
            role: state.role,
            ...(state.password ? { password: state.password } : {}),
          },
        });
      }
      return create({
        data: {
          nomeCompleto: state.nomeCompleto.trim(),
          email: state.email.trim(),
          password: state.password,
          role: state.role,
        },
      });
    },
    onSuccess: (_r, state) => {
      toast.success(state.id ? "Usuário atualizado." : "Usuário criado com sucesso.");
      setForm(null);
      void refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Usuário excluído.");
      setConfirmDelete(null);
      void refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao excluir."),
  });

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Crie contas, defina permissões e mantenha sua equipe organizada."
        actions={
          <button
            onClick={() => setForm({ ...emptyForm })}
            className="inline-flex h-11 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-105 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" /> Novo usuário
          </button>
        }
      />

      {error ? (
        <EmptyState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="Acesso restrito"
          description="Somente administradores podem gerenciar usuários."
        />
      ) : (
        <>
          <div className="relative mb-5 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              aria-label="Buscar usuários"
              className="h-11 w-full rounded-xl border bg-card pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border bg-card/60" />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title={busca ? "Nenhum resultado" : "Nenhum usuário ainda"}
              description={
                busca
                  ? "Tente buscar por outro nome ou e-mail."
                  : "Crie o primeiro usuário para começar."
              }
              action={
                !busca && (
                  <button
                    onClick={() => setForm({ ...emptyForm })}
                    className="inline-flex h-10 items-center gap-2 rounded-xl gradient-primary px-4 text-sm font-semibold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" /> Novo usuário
                  </button>
                )
              }
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((u) => (
                <li
                  key={u.id}
                  className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                    {initials(u.nome_completo || u.email || "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {u.nome_completo || "Sem nome"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <span className="mt-1.5 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                      {ROLE_LABEL[u.role]}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                    <button
                      onClick={() =>
                        setForm({
                          id: u.id,
                          nomeCompleto: u.nome_completo,
                          email: u.email ?? "",
                          password: "",
                          confirma: "",
                          role: u.role,
                        })
                      }
                      aria-label={`Editar ${u.nome_completo}`}
                      className="grid h-9 w-9 place-items-center rounded-lg border bg-background transition hover:bg-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      aria-label={`Excluir ${u.nome_completo}`}
                      className="grid h-9 w-9 place-items-center rounded-lg border bg-background text-destructive transition hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {form && (
        <UserFormModal
          state={form}
          onChange={setForm}
          onClose={() => setForm(null)}
          onSubmit={() => saveMutation.mutate(form)}
          saving={saveMutation.isPending}
        />
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} titulo="Excluir usuário">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir{" "}
            <strong className="text-foreground">{confirmDelete.nome_completo}</strong>? Essa ação
            não pode ser desfeita.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="h-10 rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

function Modal({
  children,
  titulo,
  onClose,
}: {
  children: React.ReactNode;
  titulo: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="page-in w-full max-w-lg rounded-2xl border bg-card p-6 shadow-glow"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg border bg-background transition hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UserFormModal({
  state,
  onChange,
  onClose,
  onSubmit,
  saving,
}: {
  state: FormState;
  onChange: (s: FormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const editando = !!state.id;

  const errors: Record<string, string | undefined> = {};
  if (state.nomeCompleto.trim().length < 3) errors["nomeCompleto"] = "Informe o nome completo";
  if (!editando) {
    const parsed = createUserInput.safeParse({
      nomeCompleto: state.nomeCompleto.trim(),
      email: state.email.trim(),
      password: state.password,
      role: state.role,
    });
    if (!parsed.success) {
      for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    }
    if (state.confirma !== state.password) errors["confirma"] = "As senhas não coincidem";
  } else if (state.password) {
    const parsed = senhaSchema.safeParse(state.password);
    if (!parsed.success) errors["password"] = parsed.error.issues[0]?.message;
    if (state.confirma !== state.password) errors["confirma"] = "As senhas não coincidem";
  }
  const invalid = Object.keys(errors).length > 0;
  const err = (k: string) => (touched[k] ? errors[k] : undefined);

  return (
    <Modal titulo={editando ? "Editar usuário" : "Novo usuário"} onClose={onClose}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched({ nomeCompleto: true, email: true, password: true, confirma: true });
          if (!invalid && !saving) onSubmit();
        }}
      >
        <Input
          id="nomeCompleto"
          label="Nome completo"
          value={state.nomeCompleto}
          onChange={(v) => onChange({ ...state, nomeCompleto: v })}
          onBlur={() => setTouched((t) => ({ ...t, nomeCompleto: true }))}
          error={err("nomeCompleto")}
          placeholder="Maria Silva"
        />
        <Input
          id="email"
          label="E-mail"
          type="email"
          value={state.email}
          disabled={editando}
          onChange={(v) => onChange({ ...state, email: v })}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={err("email")}
          placeholder="voce@email.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="password"
            label={editando ? "Nova senha (opcional)" : "Senha"}
            type="password"
            value={state.password}
            onChange={(v) => onChange({ ...state, password: v })}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={err("password")}
            placeholder="Mínimo de 8 caracteres"
          />
          <Input
            id="confirma"
            label="Confirmar senha"
            type="password"
            value={state.confirma}
            onChange={(v) => onChange({ ...state, confirma: v })}
            onBlur={() => setTouched((t) => ({ ...t, confirma: true }))}
            error={err("confirma")}
            placeholder="Repita a senha"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Perfil de acesso</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {APP_ROLES.map((r) => {
              const ativo = state.role === r;
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => onChange({ ...state, role: r })}
                  aria-pressed={ativo}
                  className={`rounded-xl border p-3 text-left text-sm transition ${
                    ativo
                      ? "border-primary bg-primary/10 text-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  <span className="flex items-center justify-between font-medium">
                    {ROLE_LABEL[r]}
                    {ativo && <Check className="h-4 w-4" />}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                    {ROLE_DESCRIPTION[r]}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Salvar" : "Criar usuário"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Input({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-erro` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40 disabled:bg-muted/50 disabled:text-muted-foreground ${
          error ? "border-destructive focus:ring-destructive/30" : ""
        }`}
      />
      {error && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
