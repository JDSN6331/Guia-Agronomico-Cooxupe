import { type ReactNode, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  compartilharWhatsApp,
  copiarRecomendacao,
  imprimirFichaProduto,
  type DadosFichaProduto,
} from "@/lib/share-utils";


export type Filtro = {
  id: string;
  rotulo: string;
  opcoes: string[];
  valor: string;
  onChange: (v: string) => void;
};

export function BarraFiltros({
  termo,
  onTermo,
  placeholder,
  filtros,
  total,
  exibidos,
}: {
  termo: string;
  onTermo: (v: string) => void;
  placeholder: string;
  filtros: Filtro[];
  total: number;
  exibidos: number;
}) {
  const [aberto, setAberto] = useState(false);
  const ativos = filtros.filter((f) => f.valor !== "todos").length;

  return (
    <div className="panel sticky top-[73px] z-30 p-3 sm:p-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => onTermo(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
            maxLength={120}
          />
          {termo && (
            <button
              onClick={() => onTermo("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {filtros.length > 0 && (
          <Button
            variant={aberto ? "default" : "outline"}
            onClick={() => setAberto((v) => !v)}
            className="shrink-0"
          >
            <SlidersHorizontal className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Filtros</span>
            {ativos > 0 && (
              <span className="ml-2 rounded-full bg-background/25 px-1.5 text-xs">{ativos}</span>
            )}
          </Button>
        )}
      </div>

      {aberto && filtros.length > 0 && (
        <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {filtros.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{f.rotulo}</label>
              <Select value={f.valor} onValueChange={f.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="todos">Todos</SelectItem>
                  {f.opcoes.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Exibindo <strong className="text-foreground">{exibidos}</strong> de {total} registros
      </p>
    </div>
  );
}

export function useFiltro(inicial = "todos") {
  const [valor, setValor] = useState(inicial);
  return { valor, setValor };
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function Carencia({ dias }: { dias?: string | undefined }) {
  if (!dias) return null;
  const n = Number(String(dias).replace(/[^\d]/g, ""));
  const isento = n === 0;
  return (
    <Badge variant={isento ? "secondary" : "outline"} className="font-normal">
      Carência: {isento ? "isento" : `${dias} dias`}
    </Badge>
  );
}

export function useListaFiltrada<T>(itens: T[], predicado: (item: T) => boolean, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => itens.filter(predicado), deps);
}

export function VazioResultado() {
  return (
    <div className="panel p-10 text-center">
      <p className="font-display text-base font-semibold">Nenhum resultado encontrado</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Tente outro termo de busca ou limpe os filtros aplicados.
      </p>
    </div>
  );
}

export function AcoesFichaProduto({ dados }: { dados: DadosFichaProduto }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/80 mt-4">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10 hover:bg-emerald-500/20"
        onClick={() => compartilharWhatsApp(dados)}
      >
        <span className="mr-1">💬</span> WhatsApp
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs font-medium"
        onClick={() => copiarRecomendacao(dados)}
      >
        Copiar Ficha
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => imprimirFichaProduto(dados)}
      >
        📄 Gerar PDF
      </Button>
    </div>
  );
}


