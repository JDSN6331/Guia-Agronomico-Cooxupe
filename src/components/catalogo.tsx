import { type ReactNode, useMemo, useState } from "react";
import { Copy, Download, FileSpreadsheet, Printer, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { separarTermos } from "@/data/programa";
import {
  copiarResultados,
  exportarResultadosExcel,
  imprimirResultados,
  type ItemExportavel,
} from "@/lib/export-resultados";
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
  termos,
  onTermos,
  contagens,
  acoes,
}: {
  termo: string;
  onTermo: (v: string) => void;
  placeholder?: string;
  filtros: Filtro[];
  total: number;
  exibidos: number;
  /** Termos já confirmados (chips). Informe junto com `onTermos` para ativar a busca múltipla. */
  termos?: string[];
  onTermos?: (v: string[]) => void;
  /** Quantos itens cada termo encontrou (exibido no chip). */
  contagens?: Record<string, number> | undefined;
  /** Ações exibidas no topo da barra (ex.: exportar resultados). */
  acoes?: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const ativos = filtros.filter((f) => f.valor !== "todos").length;
  const multi = Boolean(onTermos);
  const chips = termos ?? [];

  /** Transforma o texto digitado/colado em chips (sem repetir termos já existentes). */
  function confirmar(texto: string) {
    if (!onTermos) return;
    const novos = separarTermos(texto);
    if (novos.length > 0) onTermos(separarTermos([...chips, ...novos].join(";")));
    onTermo("");
  }

  function aoDigitar(valor: string) {
    // ";" , "|" ou ", " ao final fecham o termo atual
    if (multi && /(;|\||,\s)$/.test(valor)) confirmar(valor);
    else onTermo(valor);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!multi) return;
    if (e.key === "Enter") {
      e.preventDefault();
      confirmar(termo);
    } else if (e.key === "Backspace" && termo === "" && chips.length > 0) {
      onTermos?.(chips.slice(0, -1));
    }
  }

  function aoColar(e: React.ClipboardEvent<HTMLInputElement>) {
    if (!multi) return;
    const colado = e.clipboardData.getData("text");
    if (separarTermos(colado).length > 1 || /[\n;|]/.test(colado)) {
      e.preventDefault();
      confirmar(termo + colado);
    }
  }

  function limparTudo() {
    onTermo("");
    onTermos?.([]);
  }

  return (
    <div className="sticky top-0 z-20 rounded-2xl p-3 sm:p-4 transition-all duration-200 backdrop-blur-xl border bg-card/95 border-border/90 text-card-foreground shadow-sm dark:bg-[#071d12]/95 dark:border-[#194b30] dark:text-emerald-50 dark:shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-[#1c5c36] text-white shadow-xs dark:bg-gold/15 dark:text-gold dark:border dark:border-gold/25">
            <SlidersHorizontal className="size-3" /> Busca & Filtros
          </span>
          <p className="text-xs text-muted-foreground dark:text-emerald-100/70 hidden sm:inline font-medium">
            Exibindo <strong className="text-[#1c5c36] dark:text-gold font-bold">{exibidos}</strong> de {total} registros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-muted-foreground dark:text-emerald-100/70 sm:hidden">
            <strong className="text-[#1c5c36] dark:text-gold font-bold">{exibidos}</strong>/{total}
          </p>
          {acoes}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground dark:text-gold/70" />
          <Input
            value={termo}
            onChange={(e) => aoDigitar(e.target.value)}
            onKeyDown={aoTeclar}
            onPaste={aoColar}
            placeholder={placeholder}
            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#1c5c36] dark:bg-[#05150d]/90 dark:border-[#194b30]/60 dark:text-white dark:placeholder:text-emerald-200/50 dark:focus-visible:ring-gold h-10 text-xs sm:text-sm rounded-xl shadow-inner"
            maxLength={multi ? 2000 : 120}
          />
          {(termo || chips.length > 0) && (
            <button
              onClick={limparTudo}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent dark:text-emerald-200/70 dark:hover:bg-gold/20 dark:hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {filtros.length > 0 && (
          <Button
            variant={aberto ? "default" : "outline"}
            onClick={() => setAberto((v) => !v)}
            className="shrink-0 h-10 rounded-xl bg-background border-border text-[#1c5c36] hover:bg-[#1c5c36] hover:text-white dark:bg-[#0d2a1b] dark:border-[#194b30] dark:text-gold dark:hover:bg-gold dark:hover:text-[#06140d] font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <SlidersHorizontal className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Filtros</span>
            {ativos > 0 && (
              <span className="ml-1.5 rounded-full bg-[#1c5c36] text-white dark:bg-gold dark:text-[#06140d] font-black px-1.5 text-[10px]">
                {ativos}
              </span>
            )}
          </Button>
        )}
      </div>

      {multi && (
        <div className="mt-2 px-1">
          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((t) => {
                const qtd = contagens?.[t];
                const semResultado = qtd === 0;
                return (
                  <span
                    key={t}
                    title={semResultado ? "Nenhum item encontrado para este termo" : undefined}
                    className={
                      semResultado
                        ? "inline-flex max-w-full items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 py-0.5 pl-2.5 pr-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300"
                        : "inline-flex max-w-full items-center gap-1 rounded-full border border-[#1c5c36]/30 bg-[#1c5c36]/10 py-0.5 pl-2.5 pr-1 text-[11px] font-semibold text-[#1c5c36] dark:border-gold/40 dark:bg-gold/10 dark:text-gold"
                    }
                  >
                    <span className="truncate">{t}</span>
                    {qtd !== undefined && (
                      <span className="rounded-full bg-background/70 px-1.5 text-[10px] font-black dark:bg-black/30">
                        {qtd}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onTermos?.(chips.filter((c) => c !== t))}
                      aria-label={`Remover termo ${t}`}
                      className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={limparTudo}
                className="ml-1 text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:underline dark:text-emerald-100/70"
              >
                Limpar termos
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground dark:text-emerald-100/60">
              Pesquise vários itens de uma vez: digite um termo e pressione <strong>Enter</strong> (ou{" "}
              <strong>;</strong>) para adicionar outro — ou cole uma lista.
            </p>
          )}
        </div>
      )}

      {aberto && filtros.length > 0 && (
        <div className="mt-3 grid gap-3 border-t border-border dark:border-[#194b30]/40 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {filtros.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wide uppercase text-[#1c5c36] dark:text-gold/80">{f.rotulo}</label>
              <Select value={f.valor} onValueChange={f.onChange}>
                <SelectTrigger className="w-full bg-background border-border text-foreground dark:bg-[#05150d]/90 dark:border-[#194b30]/60 dark:text-white h-9 text-xs rounded-lg shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 bg-popover border-border text-popover-foreground dark:bg-[#081a11] dark:border-[#194b30] dark:text-white">
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

/**
 * Menu para exportar de uma vez todos os resultados exibidos (Excel, PDF/impressão ou texto).
 */
export function ExportarResultados({
  itens,
  termos,
  rotulo,
}: {
  itens: ItemExportavel[];
  termos: string[];
  rotulo: string;
}) {
  const ctx = { termos, rotulo };
  const vazio = itens.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={vazio}
          className="h-7 rounded-lg border-[#1c5c36]/40 px-2.5 text-[11px] font-bold text-[#1c5c36] hover:bg-[#1c5c36] hover:text-white dark:border-gold/40 dark:bg-transparent dark:text-gold dark:hover:bg-gold dark:hover:text-[#06140d]"
        >
          <Download className="mr-1.5 size-3.5" />
          Exportar ({itens.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">
          Exportar {itens.length} {itens.length === 1 ? "resultado" : "resultados"} de uma vez
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => exportarResultadosExcel(itens, ctx)}>
          <FileSpreadsheet className="size-4" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => imprimirResultados(itens, ctx)}>
          <Printer className="size-4" /> Imprimir / salvar em PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copiarResultados(itens, ctx)}>
          <Copy className="size-4" /> Copiar como texto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function useFiltro(inicial = "todos") {
  const [valor, setValor] = useState(inicial);
  return { valor, setValor };
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  const formatado = typeof children === "string" ? children.replace(/\.{2,}/g, " ").trim() : children;

  return (
    <div className="min-w-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {rotulo}
      </span>
      <div className="mt-0.5 text-sm font-medium break-words [overflow-wrap:anywhere]">{formatado}</div>
    </div>
  );
}

export function Carencia({ dias }: { dias?: string | number | undefined }) {
  if (!dias) return null;
  const textoLimpo = String(dias).replace(/\.{2,}/g, " ").trim();
  const texto = textoLimpo.toLowerCase().includes("dias") ? textoLimpo : `${textoLimpo} dias`;
  return (
    <Badge variant="outline" className="border-gold/50 bg-gold/10 text-gold text-xs font-semibold max-w-full break-words whitespace-normal text-left">
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
    <div className="space-y-4 pt-2 min-w-0">
      <div className="flex flex-wrap gap-2">
        {p.grupo && <Badge variant="secondary" className="max-w-full break-words whitespace-normal text-left">{p.grupo}</Badge>}
        {p.familia && <Badge variant="outline" className="border-blue-500/30 text-blue-400 max-w-full break-words whitespace-normal text-left">{p.familia}</Badge>}
        {p.cultura && <Badge variant="outline" className="max-w-full break-words whitespace-normal text-left">{p.cultura}</Badge>}
        {p.carencia && <Carencia dias={p.carencia} />}
      </div>

      {p.cultura && <Campo rotulo="Cultura">{p.cultura}</Campo>}
      {p.ingrediente && <Campo rotulo="Ingrediente Ativo / Composição">{p.ingrediente}</Campo>}
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
              <div key={estagio} className="rounded-lg bg-background p-2.5 border border-border/60">
                <span className="text-muted-foreground block text-[11px]">{estagio}:</span>{" "}
                <span className="font-bold text-gold text-xs">{val}</span>
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
