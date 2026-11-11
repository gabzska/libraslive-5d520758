import { useEffect, useState } from "react";
import { isVLibrasReady } from "@/lib/vlibras";

/** Reports browser-observed state only; it does not claim AI or service health. */
export function usePlatformStatus() {
  const [status, setStatus] = useState({ online: null as boolean | null, avatarReady: false });
  useEffect(() => {
    const refresh = () => setStatus({ online: navigator.onLine, avatarReady: isVLibrasReady() });
    refresh();
    const timer = window.setInterval(refresh, 1500);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);
  return status;
}