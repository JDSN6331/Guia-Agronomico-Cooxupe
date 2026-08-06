import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function updateStatus() {
      setIsOffline(!navigator.onLine);
    }

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white shadow-inner dark:bg-amber-700">
      <WifiOff className="size-3.5 shrink-0 animate-pulse" />
      <span>Modo Offline ativado — Você está consultando a base de conhecimento salva em cache.</span>
    </div>
  );
}
