import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LibrasLive AI — Tradução de voz para Libras em tempo real" },
      { name: "description", content: "Converta fala em português para Libras em tempo real com avatar VLibras. Acessibilidade para escolas, hospitais e órgãos públicos." },
      { name: "author", content: "LibrasLive AI" },
      { property: "og:title", content: "LibrasLive AI — Tradução de voz para Libras em tempo real" },
      { property: "og:description", content: "Converta fala em português para Libras em tempo real com avatar VLibras. Acessibilidade para escolas, hospitais e órgãos públicos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "LibrasLive AI — Tradução de voz para Libras em tempo real" },
      { name: "twitter:description", content: "Converta fala em português para Libras em tempo real com avatar VLibras. Acessibilidade para escolas, hospitais e órgãos públicos." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7bad89da-f0dc-4bbc-823a-61e8e94ac396/id-preview-60f90dd9--e1524291-abab-4cde-839e-5102d91de25f.lovable.app-1780528318987.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7bad89da-f0dc-4bbc-823a-61e8e94ac396/id-preview-60f90dd9--e1524291-abab-4cde-839e-5102d91de25f.lovable.app-1780528318987.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <div
          dangerouslySetInnerHTML={{
            __html: `<div vw class="enabled"><div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div></div>`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function init(){if(window.__vlibrasInited)return true;if(window.VLibras&&window.VLibras.Widget){try{new window.VLibras.Widget('https://vlibras.gov.br/app');window.__vlibrasInited=true;return true;}catch(e){console.warn('VLibras init error',e);}}return false;}function load(){if(document.querySelector('script[data-vlibras]'))return;var s=document.createElement('script');s.src='https://vlibras.gov.br/app/vlibras-plugin.js';s.async=true;s.setAttribute('data-vlibras','1');s.onload=function(){init();};document.body.appendChild(s);}load();var i=setInterval(function(){if(init())clearInterval(i);},500);setTimeout(function(){clearInterval(i);},20000);})();`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
