/**
 * Runtime singleton do VLibras.
 *
 * A integração oficial foi pensada como widget flutuante e inicializa boa parte
 * do DOM no `window.onload`. Em uma SPA/SSR isso quebra ao navegar, porque o
 * HTML mutado pelo script entra em conflito com a hidratação e o painel pode ser
 * removido junto com a rota. Aqui o widget é criado fora da árvore do React,
 * mantido em um "parking" global e apenas reparentado para o painel visível.
 */

declare global {
  interface Window {
    VLibras?: { Widget?: new (...args: any[]) => unknown; Plugin?: unknown };
    plugin?: {
      translate?: (text: string) => void;
      player?: { translate?: (text: string) => void; player?: { Module?: { resumeMainLoop?: () => void } } };
    };
    __vlibrasRuntime?: {
      promise?: Promise<void>;
      widgetCreated?: boolean;
      loadDispatched?: boolean;
    };
  }
}

const ROOT_PATH = "https://vlibras.gov.br/app";
const SCRIPT_SRC = `${ROOT_PATH}/vlibras-plugin.js`;
const PARKING_ID = "vlibras-global-parking";

function runtime() {
  if (typeof window === "undefined") return null;
  window.__vlibrasRuntime ??= {};
  return window.__vlibrasRuntime;
}

function waitFor(check: () => boolean, timeout = 12000, step = 120): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (check()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error("VLibras não inicializou a tempo"));
      window.setTimeout(tick, step);
    };
    tick();
  });
}

function getParking(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let parking = document.getElementById(PARKING_ID);
  if (!parking) {
    parking = document.createElement("div");
    parking.id = PARKING_ID;
    parking.setAttribute("aria-hidden", "true");
    document.body.appendChild(parking);
  }
  return parking;
}

function getRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>("[data-libraslive-vlibras='root']")
    ?? document.querySelector<HTMLElement>("[vw]");
}

function ensureRootElement(): HTMLElement | null {
  const parking = getParking();
  if (!parking) return null;

  let root = getRoot();
  if (!root) {
    root = document.createElement("div");
    root.setAttribute("vw", "");
    root.className = "enabled libraslive-vlibras-root";
    root.innerHTML = `<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>`;
  }

  root.setAttribute("data-libraslive-vlibras", "root");
  if (!root.parentElement) parking.appendChild(root);
  return root;
}

function loadScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-vlibras]");
  if (existing) {
    return window.VLibras?.Widget
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error("Falha ao carregar VLibras")), { once: true });
        });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-vlibras", "1");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar VLibras"));
    document.body.appendChild(script);
  });
}

function createOfficialWidget() {
  const rt = runtime();
  if (!rt || rt.widgetCreated || !window.VLibras?.Widget) return;

  new window.VLibras.Widget(ROOT_PATH);
  rt.widgetCreated = true;

  // O script oficial registra a montagem no window.onload. Como este componente
  // roda após a hidratação, acionamos essa etapa uma única vez manualmente.
  if (!rt.loadDispatched) {
    rt.loadDispatched = true;
    window.setTimeout(() => {
      try {
        if (typeof window.onload === "function") {
          window.onload(new Event("load") as Event & { target: Window });
        } else {
          window.dispatchEvent(new Event("load"));
        }
      } catch (error) {
        console.warn("VLibras load dispatch failed", error);
      }
    }, 0);
  }
}

function getTranslateFn(): ((text: string) => void) | null {
  if (typeof window === "undefined") return null;
  const plugin = window.plugin;
  if (typeof plugin?.translate === "function") return plugin.translate.bind(plugin);
  if (typeof plugin?.player?.translate === "function") return plugin.player.translate.bind(plugin.player);
  return null;
}

function keepPanelOpen() {
  if (typeof document === "undefined") return;
  const root = getRoot();
  const wrapper = root?.querySelector<HTMLElement>("[vw-plugin-wrapper]");
  wrapper?.classList.add("active", "vp-rounded");
  root?.classList.add("enabled");
  try {
    window.plugin?.player?.player?.Module?.resumeMainLoop?.();
  } catch { /* ignore */ }
}

export async function ensureVLibrasWidget(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const rt = runtime();
  if (!rt) return;
  if (rt.promise) return rt.promise;

  rt.promise = (async () => {
    ensureRootElement();
    await loadScript();
    await waitFor(() => !!window.VLibras?.Widget, 8000);
    createOfficialWidget();
    await waitFor(() => !!document.querySelector("[vw-access-button]"), 8000);

    // Primeiro clique programático: carrega o módulo pesado do player oficial.
    if (!getTranslateFn()) {
      document.querySelector<HTMLElement>("[vw-access-button]")?.click();
    }

    await waitFor(() => !!getTranslateFn(), 15000, 250);
    keepPanelOpen();
  })().catch((error) => {
    rt.promise = undefined;
    throw error;
  });

  return rt.promise;
}

export function isVLibrasReady(): boolean {
  return !!getTranslateFn();
}

export function attachVLibrasTo(host: HTMLElement): Promise<void> {
  return ensureVLibrasWidget().then(() => {
    const root = ensureRootElement();
    if (!root) return;
    root.classList.add("libraslive-vlibras-embedded");
    root.classList.remove("libraslive-vlibras-parked");
    host.appendChild(root);
    keepPanelOpen();
  });
}

export function parkVLibras() {
  const root = getRoot();
  const parking = getParking();
  if (!root || !parking) return;
  root.classList.remove("libraslive-vlibras-embedded");
  root.classList.add("libraslive-vlibras-parked");
  parking.appendChild(root);
}

export function openVLibras() {
  void ensureVLibrasWidget().then(keepPanelOpen).catch(() => undefined);
}

export function closeVLibras() {
  // Mantemos a instância viva. "Fechar" aqui apenas estaciona fora da UI.
  parkVLibras();
}

/** Envia texto diretamente ao avatar oficial. Reintenta até o player ficar pronto. */
export function translateToVLibras(text: string) {
  if (!text || typeof window === "undefined") return;
  const clean = text.trim();
  if (!clean) return;

  void ensureVLibrasWidget()
    .then(() => {
      keepPanelOpen();
      const translate = getTranslateFn();
      if (!translate) throw new Error("API de tradução do VLibras indisponível");
      translate(clean);
    })
    .catch((error) => console.warn("VLibras translate failed", error));
}

/** Mostra o painel e imediatamente sinaliza o texto. */
export function signOnVLibras(text: string) {
  openVLibras();
  translateToVLibras(text);
}
