import { cn } from "@/lib/utils";
import { APP } from "@/lib/app-config";

export function Brand({
  className,
  compacto = false,
  tamanhoLogo = 36,
}: {
  className?: string;
  compacto?: boolean;
  tamanhoLogo?: number;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Guia Agronômico Cooxupé"
          style={{ width: tamanhoLogo, height: tamanhoLogo }}
          className="object-contain drop-shadow-sm transition-transform hover:scale-105"
        />
      </div>
      {!compacto && (
        <div className="flex flex-col justify-center gap-1 leading-none">
          <span className="block font-display text-[15px] font-bold tracking-tight text-foreground">
            {APP.nome}
          </span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mt-0.5">
            Cooxupé
          </span>
        </div>
      )}
    </div>
  );
}
