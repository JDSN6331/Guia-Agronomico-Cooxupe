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
  placeholder = "Buscar por produto, ingrediente ativo, fornecedor ou função (alvo)...",
  filtros,
  total,
  exibidos,
}: {
  termo: string;
  onTermo: (v: string) => void;
  placeholder?: string;
  filtros: Filtro[];
  total: number;
  exibidos: number;
}) {
  const [aberto, setAberto] = useState(false);
  const ativos = filtros.filter((f) => f.valor !== "todos").length;

  return (
    <div className="sticky top-0 z-20 rounded-2xl p-3 sm:p-4 transition-all duration-200 backdrop-blur-xl border border-[#1b4e33]/80 bg-[#0a1e14]/95 text-emerald-50 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-bold text-gold border border-gold/25">
            <SlidersHorizontal className="size-3" /> Busca & Filtros
          </span>
          <p className="text-xs text-emerald-100/70 hidden sm:inline">
            Exibindo <strong className="text-gold font-bold">{exibidos}</strong> de {total} registros
          </p>
        </div>
        <p className="text-[11px] text-emerald-100/70 sm:hidden">
          <strong className="text-gold font-bold">{exibidos}</strong>/{total}
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gold/70" />
          <Input
            value={termo}
            onChange={(e) => onTermo(e.target.value)}
            placeholder={placeholder}
            className="pl-9 bg-[#06140d]/90 border-[#1b4e33]/60 text-white placeholder:text-emerald-200/50 focus-visible:ring-gold focus-visible:border-gold h-10 text-xs sm:text-sm rounded-xl"
            maxLength={120}
          />
          {termo && (
            <button
              onClick={() => onTermo("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-emerald-200/70 hover:bg-gold/20 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {filtros.length > 0 && (
          <Button
            variant={aberto ? "default" : "outline"}
            onClick={() => setAberto((v) => !v)}
            className="shrink-0 h-10 rounded-xl bg-[#0d2a1b] border-[#1b4e33] text-gold hover:bg-gold hover:text-[#06140d] font-bold text-xs sm:text-sm transition-all"
          >
            <SlidersHorizontal className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Filtros</span>
            {ativos > 0 && (
              <span className="ml-1.5 rounded-full bg-gold text-[#06140d] font-black px-1.5 text-[10px]">
                {ativos}
              </span>
            )}
          </Button>
        )}
      </div>

      {aberto && filtros.length > 0 && (
        <div className="mt-3 grid gap-3 border-t border-[#1b4e33]/40 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {filtros.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wide uppercase text-gold/80">{f.rotulo}</label>
              <Select value={f.valor} onValueChange={f.onChange}>
                <SelectTrigger className="w-full bg-[#06140d]/90 border-[#1b4e33]/60 text-white h-9 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 bg-[#081a11] border-[#1b4e33] text-white">
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
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {rotulo}
      </span>
      <div className="mt-0.5 text-sm font-medium">{children}</div>
    </div>
  );
}

export function Carencia({ dias }: { dias?: string | number }) {
  if (!dias) return null;
  const texto = String(dias).toLowerCase().includes("dias") ? String(dias) : `${dias} dias`;
  return (
    <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold text-xs font-semibold">
      Carência: {texto}
    </Badge>
  );
}

export function VazioResultado({ onLimpar }: { onLimpar?: () => void }) {
  return (
    <div className="panel p-8 text-center space-y-3">
      <p className="font-display text-base font-semibold text-foreground">Nenhum produto encontrado</p>
      <p className="text-xs text-muted-foreground">Tente buscar por outro termo ou limpar os filtros ativos.</p>
      {onLimpar && (
        <Button size="sm" variant="outline" onClick={onLimpar} className="text-xs">
          Limpar busca e filtros
        </Button>
      )}
    </div>
  );
}

export function AcoesFichaProduto({ p }: { p: DadosFichaProduto }) {
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
      <Button size="sm" variant="outline" onClick={() => copiarRecomendacao(p)} className="text-xs">
        Copiar Ficha
      </Button>
      <Button size="sm" variant="outline" onClick={() => compartilharWhatsApp(p)} className="text-xs">
        WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={() => imprimirFichaProduto(p)} className="text-xs">
        Imprimir / PDF
      </Button>
    </div>
  );
}

export function FichaCompleta({
  p,
  children,
}: {
  p: DadosFichaProduto;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4 pt-2">
      {p.carencia && <Carencia dias={p.carencia} />}

      {p.ingrediente && <Campo rotulo="Ingrediente Ativo">{p.ingrediente}</Campo>}
      {p.fornecedor && <Campo rotulo="Fornecedor">{p.fornecedor}</Campo>}
      {p.grupo && <Campo rotulo="Grupo">{p.grupo}</Campo>}
      {p.familia && <Campo rotulo="Família">{p.familia}</Campo>}

      {p.dosagens && Object.keys(p.dosagens).length > 0 ? (
        <div className="space-y-2 rounded-xl border border-border/80 bg-accent/30 p-3.5">
          <span className="text-xs uppercase tracking-wider text-gold font-bold">
            Dosagem por Estágio
          </span>
          <div className="grid gap-2 text-xs sm:grid-cols-2 pt-1">
            {Object.entries(p.dosagens).map(([estagio, val]) => (
              <div key={estagio} className="rounded-lg bg-background p-2 border border-border/60">
                <span className="font-semibold text-foreground">{estagio}:</span>{" "}
                <span className="font-bold text-gold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      ) : p.dosagemUnica ? (
        <Campo rotulo="Dosagem">{p.dosagemUnica}</Campo>
      ) : null}

      {p.funcao && <Campo rotulo="Função Agronômica">{p.funcao}</Campo>}
      {p.instrucoes && <Campo rotulo="Instruções de Aplicação">{p.instrucoes}</Campo>}

      {children}

      <AcoesFichaProduto p={p} />
    </div>
  );
}
