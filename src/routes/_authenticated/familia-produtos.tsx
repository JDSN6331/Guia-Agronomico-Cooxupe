import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Package, Search, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AcoesFichaProduto, Campo, Carencia } from "@/components/catalogo";
import { FlaticonCoffee, FlaticonCornSoy } from "@/components/flaticon-icons";
import { obterProgramaAtual } from "@/lib/programa-store";
import type { ProdutoCafe, ProdutoMilhoSoja } from "@/data/programa";

export const Route = createFileRoute("/_authenticated/familia-produtos")({
  head: () => ({
    meta: [
      { title: "Família de Produtos | Guia Agronômico" },
      {
        name: "description",
        content: "Navegue pelos produtos organizados por famílias técnicas de defensivos e insumos agronômicos.",
      },
    ],
  }),
  component: PaginaFamiliasProdutos,
});

const ESTAGIOS_CAFE = [
  "Viveiro",
  "Plantio",
  "1 ano / Recepa",
  "Em Produção",
  "Esqueletado / Decotado",
] as const;

function formatarResumoFam(qtdCafe: number, qtdMilho: number) {
  const partes: string[] = [];
  if (qtdCafe > 0) {
    partes.push(`${qtdCafe} ${qtdCafe === 1 ? "produto de Café" : "produtos de Café"}`);
  }
  if (qtdMilho > 0) {
    partes.push(`${qtdMilho} ${qtdMilho === 1 ? "produto de Milho/Soja" : "produtos de Milho/Soja"}`);
  }
  return partes.join(" · ");
}

function PaginaFamiliasProdutos() {
  const programa = useMemo(() => obterProgramaAtual(), []);
  const [termo, setTermo] = useState("");

  // Agrupamento de produtos por família
  const familiasMapeadas = useMemo(() => {
    const mapa = new Map<string, { nome: string; cafe: ProdutoCafe[]; milhoSoja: ProdutoMilhoSoja[] }>();

    // Processar produtos de Café
    for (const p of (programa.cafe || []) as ProdutoCafe[]) {
      const fam = p.familia || "Outras Famílias / Sem Classificação";
      if (!mapa.has(fam)) {
        mapa.set(fam, { nome: fam, cafe: [], milhoSoja: [] });
      }
      mapa.get(fam)!.cafe.push(p);
    }

    // Processar produtos de Milho & Soja
    for (const p of (programa.milhoSoja || []) as ProdutoMilhoSoja[]) {
      const fam = p.familia || "Outras Famílias / Sem Classificação";
      if (!mapa.has(fam)) {
        mapa.set(fam, { nome: fam, cafe: [], milhoSoja: [] });
      }
      mapa.get(fam)!.milhoSoja.push(p);
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [programa]);

  // Filtragem por busca
  const familiasFiltradas = useMemo(() => {
    const q = termo.trim().toLowerCase();
    if (!q) return familiasMapeadas;

    return familiasMapeadas
      .map((f) => {
        const nomeBate = f.nome.toLowerCase().includes(q);
        const cafeFiltrado = f.cafe.filter(
          (p) =>
            p.produto?.toLowerCase().includes(q) ||
            p.ingrediente?.toLowerCase().includes(q) ||
            p.fornecedor?.toLowerCase().includes(q) ||
            p.funcao?.toLowerCase().includes(q),
        );
        const milhoFiltrado = f.milhoSoja.filter(
          (p) =>
            p.produto?.toLowerCase().includes(q) ||
            p.fornecedor?.toLowerCase().includes(q) ||
            p.funcao?.toLowerCase().includes(q),
        );

        if (nomeBate || cafeFiltrado.length > 0 || milhoFiltrado.length > 0) {
          return {
            nome: f.nome,
            cafe: nomeBate ? f.cafe : cafeFiltrado,
            milhoSoja: nomeBate ? f.milhoSoja : milhoFiltrado,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof familiasMapeadas;
  }, [familiasMapeadas, termo]);

  const totalProdutos = familiasMapeadas.reduce((acc, f) => acc + f.cafe.length + f.milhoSoja.length, 0);

  return (
    <AppShell
      titulo="Família de Produtos"
      descricao="Navegação técnica por agrupamento de famílias e categorias de insumos"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Painel de Busca e Resumo */}
        <div className="panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold">
                <Layers size={22} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {familiasMapeadas.length} Famílias de Produtos Mapeadas
                </h2>
                <p className="text-xs text-muted-foreground">
                  Catálogo completo com {totalProdutos} insumos categorizados por família técnica
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar família ou produto..."
                className="pl-9 h-10 text-xs sm:text-sm rounded-xl"
              />
              {termo && (
                <button
                  onClick={() => setTermo("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Famílias (Accordion Expandível) */}
        {familiasFiltradas.length === 0 ? (
          <div className="panel p-8 text-center space-y-2">
            <p className="font-semibold text-foreground">Nenhuma família ou produto encontrado</p>
            <p className="text-xs text-muted-foreground">Tente buscar por outros termos de pesquisa.</p>
            <Button size="sm" variant="outline" onClick={() => setTermo("")} className="mt-2 text-xs">
              Limpar busca
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {familiasFiltradas.map((fam) => {
              const qtdTotal = fam.cafe.length + fam.milhoSoja.length;

              return (
                <AccordionItem
                  key={fam.nome}
                  value={fam.nome}
                  className="panel px-2.5 sm:px-4 py-1 border border-border/80 rounded-2xl overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full min-w-0 pr-2 sm:pr-3 text-left gap-2 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Package className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-xs sm:text-sm font-bold text-foreground truncate leading-snug">
                            {fam.nome}
                          </h3>
                          <p className="text-[11px] text-muted-foreground truncate leading-snug mt-0.5">
                            {formatarResumoFam(fam.cafe.length, fam.milhoSoja.length)}
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-gold/50 text-gold bg-gold/10 text-[10px] sm:text-xs font-bold shrink-0">
                        {qtdTotal} {qtdTotal === 1 ? "produto" : "produtos"}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 pb-4 space-y-4">
                    {/* Seção Café */}
                    {fam.cafe.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                          Culturas de Café ({fam.cafe.length})
                        </h4>
                        <Accordion type="multiple" className="space-y-2">
                          {fam.cafe.map((p) => (
                            <FichaItemCafe key={`cafe-${p.id}`} produto={p} />
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {/* Seção Milho & Soja */}
                    {fam.milhoSoja.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold border-b border-border/60 pb-1">
                          Milho & Soja ({fam.milhoSoja.length})
                        </h4>
                        <Accordion type="multiple" className="space-y-2">
                          {fam.milhoSoja.map((p) => (
                            <FichaItemMilhoSoja key={`milho-${p.id}`} produto={p} />
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AppShell>
  );
}

function FichaItemCafe({ produto: p }: { produto: ProdutoCafe }) {
  const dosagens = ESTAGIOS_CAFE.filter((e) => p.dosagens[e]);
  const legenda = [p.ingrediente || p.grupo, p.fornecedor]
    .filter(Boolean)
    .map((s) => String(s).replace(/\.{2,}/g, " ").trim())
    .join(" · ");

  return (
    <AccordionItem value={`cafe-${p.id}`} className="panel border border-border/60 px-2.5 sm:px-4 rounded-xl bg-card overflow-hidden">
      <AccordionTrigger className="py-3 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3 text-left pr-1">
          <span className="mt-0.5 grid size-8 sm:size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FlaticonCoffee size={18} className="sm:size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xs sm:text-[15px] font-semibold text-foreground">{p.produto}</p>
            <p className="mt-0.5 truncate text-[11px] sm:text-xs text-muted-foreground">
              {legenda}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 sm:space-y-5 pb-4 sm:pb-5">
        {p.ingrediente && <Campo rotulo="Ingrediente ativo">{p.ingrediente}</Campo>}
        {p.familia && <Campo rotulo="Família">{p.familia}</Campo>}

        {dosagens.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dosagem por estágio
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dosagens.map((e) => (
                <div key={e} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{e}</p>
                  <p className="font-display text-sm font-semibold text-gold break-words">
                    {p.dosagens[e]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.funcao && <Campo rotulo="Função">{p.funcao}</Campo>}
        {p.instrucoes && <Campo rotulo="Instruções de aplicação">{p.instrucoes}</Campo>}

        <div className="flex flex-wrap gap-2 min-w-0">
          {p.grupo && <Badge variant="secondary" className="max-w-full break-words whitespace-normal text-left">{p.grupo}</Badge>}
          {p.familia && <Badge variant="outline" className="border-blue-500/30 text-blue-400 max-w-full break-words whitespace-normal text-left">{p.familia}</Badge>}
          <Badge variant="outline" className="max-w-full break-words whitespace-normal text-left">Café</Badge>
          <Carencia dias={p.carencia} />
        </div>

        <AcoesFichaProduto
          p={{
            titulo: p.produto,
            cultura: "Café",
            ingrediente: p.ingrediente,
            fornecedor: p.fornecedor,
            grupo: p.grupo,
            familia: p.familia,
            dosagens: p.dosagens,
            funcao: p.funcao,
            instrucoes: p.instrucoes,
            carencia: p.carencia,
          }}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

function FichaItemMilhoSoja({ produto: p }: { produto: ProdutoMilhoSoja }) {
  const legenda = [p.composicao || p.grupo, p.cultura, p.fornecedor]
    .filter(Boolean)
    .map((s) => String(s).replace(/\.{2,}/g, " ").trim())
    .join(" · ");

  return (
    <AccordionItem value={`milho-${p.id}`} className="panel border border-border/60 px-2.5 sm:px-4 rounded-xl bg-card overflow-hidden">
      <AccordionTrigger className="py-3 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3 text-left pr-1">
          <span className="mt-0.5 grid size-8 sm:size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FlaticonCornSoy size={18} className="sm:size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xs sm:text-[15px] font-semibold text-foreground">{p.produto}</p>
            <p className="mt-0.5 truncate text-[11px] sm:text-xs text-muted-foreground">
              {legenda}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 sm:space-y-5 pb-4 sm:pb-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {p.dosagem && <Campo rotulo="Dosagem">{p.dosagem}</Campo>}
          {p.composicao && <Campo rotulo="Composição">{p.composicao}</Campo>}
          {p.familia && <Campo rotulo="Família">{p.familia}</Campo>}
        </div>
        {p.funcao && <Campo rotulo="Função">{p.funcao}</Campo>}
        {p.instrucoes && <Campo rotulo="Instruções de aplicação">{p.instrucoes}</Campo>}
        <div className="flex flex-wrap gap-2 min-w-0">
          {p.grupo && <Badge variant="secondary" className="max-w-full break-words whitespace-normal text-left">{p.grupo}</Badge>}
          {p.familia && <Badge variant="outline" className="border-blue-500/30 text-blue-400 max-w-full break-words whitespace-normal text-left">{p.familia}</Badge>}
          {p.cultura && <Badge variant="outline" className="max-w-full break-words whitespace-normal text-left">{p.cultura}</Badge>}
          <Carencia dias={p.carencia} />
        </div>

        <AcoesFichaProduto
          p={{
            titulo: p.produto,
            cultura: p.cultura || "Milho / Soja",
            ingrediente: p.composicao,
            fornecedor: p.fornecedor,
            grupo: p.grupo,
            familia: p.familia,
            dosagemUnica: p.dosagem,
            funcao: p.funcao,
            instrucoes: p.instrucoes,
            carencia: p.carencia,
          }}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
