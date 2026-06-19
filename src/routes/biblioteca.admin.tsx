import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Upload, Image as ImageIcon, Video, Link as LinkIcon, Save, Check, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/AppNav";
import { SignVideo } from "@/components/SignVideo";
import { supabase } from "@/integrations/supabase/client";
import { listSinais, type Sinal } from "@/services/signal-library";

export const Route = createFileRoute("/biblioteca.admin")({
  head: () => ({
    meta: [
      { title: "Editar Biblioteca — LibrasLive" },
      { name: "description", content: "Painel para anexar vídeos e imagens aos sinais da biblioteca de Libras." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBiblioteca,
});

const BUCKET = "sinais-midia";
// 1 ano em segundos — Signed URL longa o suficiente para uso público
const SIGNED_URL_TTL = 60 * 60 * 24 * 365;

async function uploadToStorage(file: File, slug: string, kind: "video" | "image"): Promise<string> {
  const ext = (file.name.split(".").pop() || (kind === "video" ? "mp4" : "jpg")).toLowerCase();
  const path = `${kind}s/${slug}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) throw error;
  return data.signedUrl;
}

function AdminBiblioteca() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Sinal | null>(null);

  const { data: sinais, isLoading } = useQuery({
    queryKey: ["admin-sinais", q],
    queryFn: () => listSinais({ q: q || undefined, limit: 500 }),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-sinais"] });
    qc.invalidateQueries({ queryKey: ["sinais"] });
    qc.invalidateQueries({ queryKey: ["alfabeto"] });
  };

  return (
    <main className="min-h-dvh">
      <AppNav />
      <div className="mx-auto grid max-w-6xl gap-5 px-5 pt-8 pb-16 md:grid-cols-[320px_1fr]">
        <aside>
          <Link to="/biblioteca" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar à Biblioteca
          </Link>
          <h1 className="mt-3 font-display text-2xl font-bold">Editar mídia</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Anexe vídeos e imagens aos sinais. As mudanças aparecem instantaneamente em todo o app.
          </p>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar sinal…"
              className="w-full rounded-full border bg-card/70 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <ul className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto rounded-2xl border bg-card/60 p-1">
            {isLoading && <li className="p-3 text-xs text-muted-foreground">Carregando…</li>}
            {(sinais ?? []).map((s) => {
              const sel = selected?.id === s.id;
              const hasMedia = !!(s.video_url || s.imagem_url);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      sel ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    <span className="font-medium">{s.palavra}</span>
                    {hasMedia && <Check className={`h-4 w-4 ${sel ? "text-primary-foreground" : "text-primary"}`} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section>
          {!selected ? (
            <div className="grid h-full place-items-center rounded-3xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              Selecione um sinal à esquerda para anexar vídeo, imagem ou descrição.
            </div>
          ) : (
            <Editor sinal={selected} onSaved={(updated) => { setSelected(updated); refresh(); }} />
          )}
        </section>
      </div>
    </main>
  );
}

function Editor({ sinal, onSaved }: { sinal: Sinal; onSaved: (s: Sinal) => void }) {
  const [videoUrl, setVideoUrl] = useState(sinal.video_url ?? "");
  const [imagemUrl, setImagemUrl] = useState(sinal.imagem_url ?? "");
  const [descricao, setDescricao] = useState(sinal.descricao ?? "");
  const [uploadingV, setUploadingV] = useState(false);
  const [uploadingI, setUploadingI] = useState(false);
  const [saving, setSaving] = useState(false);

  const onUploadVideo = async (file: File) => {
    setUploadingV(true);
    try {
      const url = await uploadToStorage(file, sinal.slug, "video");
      setVideoUrl(url);
      toast.success("Vídeo enviado", { description: "Clique em Salvar para aplicar." });
    } catch (e: any) {
      toast.error("Falha no upload do vídeo", { description: e?.message });
    } finally { setUploadingV(false); }
  };

  const onUploadImage = async (file: File) => {
    setUploadingI(true);
    try {
      const url = await uploadToStorage(file, sinal.slug, "image");
      setImagemUrl(url);
      toast.success("Imagem enviada", { description: "Clique em Salvar para aplicar." });
    } catch (e: any) {
      toast.error("Falha no upload da imagem", { description: e?.message });
    } finally { setUploadingI(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("sinais")
        .update({
          video_url: videoUrl.trim() || null,
          imagem_url: imagemUrl.trim() || null,
          descricao: descricao.trim() || null,
        })
        .eq("id", sinal.id)
        .select("id,palavra,slug,categoria_id,descricao,video_url,imagem_url,animacao_url,sinonimos,relacionados,confianca,origem,aprovado")
        .single();
      if (error) throw error;
      toast.success("Salvo");
      onSaved(data as Sinal);
    } catch (e: any) {
      toast.error("Não foi possível salvar", { description: e?.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary">Editando</p>
          <h2 className="font-display text-2xl font-bold">{sinal.palavra}</h2>
          <p className="text-xs text-muted-foreground">slug: {sinal.slug}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <SignVideo
          palavra={sinal.palavra}
          videoUrl={videoUrl || null}
          imagemUrl={imagemUrl || null}
          descricao={descricao || null}
        />

        <div className="space-y-4 rounded-3xl border bg-card/70 p-5">
          <Field
            icon={<Video className="h-4 w-4 text-primary" />}
            label="Vídeo do sinal"
            hint="Faça upload (MP4/WebM) ou cole uma URL pública."
          >
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs hover:bg-accent">
                {uploadingV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Enviar arquivo
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploadingV}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadVideo(f); e.currentTarget.value = ""; }}
                />
              </label>
              {videoUrl && (
                <button onClick={() => setVideoUrl("")} className="rounded-full border bg-card px-3 py-2 text-xs hover:bg-accent">
                  Remover
                </button>
              )}
            </div>
            <UrlInput value={videoUrl} onChange={setVideoUrl} placeholder="https://… .mp4" />
          </Field>

          <Field
            icon={<ImageIcon className="h-4 w-4 text-primary" />}
            label="Imagem do sinal"
            hint="Foto ou ilustração da configuração de mão (JPG/PNG/WebP)."
          >
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs hover:bg-accent">
                {uploadingI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Enviar imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingI}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadImage(f); e.currentTarget.value = ""; }}
                />
              </label>
              {imagemUrl && (
                <button onClick={() => setImagemUrl("")} className="rounded-full border bg-card px-3 py-2 text-xs hover:bg-accent">
                  Remover
                </button>
              )}
            </div>
            <UrlInput value={imagemUrl} onChange={setImagemUrl} placeholder="https://… .jpg" />
          </Field>

          <Field
            icon={<LinkIcon className="h-4 w-4 text-primary" />}
            label="Descrição do movimento"
            hint="Texto curto descrevendo a configuração e o movimento da mão."
          >
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function UrlInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-full border bg-background/60 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
    />
  );
}
