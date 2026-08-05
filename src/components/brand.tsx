import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP } from "@/lib/app-config";

export function Brand({
  className,
  compacto = false,
}: {
  className?: string;
  compacto?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Leaf className="size-[19px]" />
      </span>
      {!compacto && (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-bold tracking-tight">{APP.nome}</span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Programa {APP.ano}
          </span>
        </span>
      )}
    </div>
  );
}
