import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AcoesFichaProduto, BarraFiltros, Campo, Carencia, VazioResultado } from "@/components/catalogo";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buscaEm, programa, unicos, type ProdutoCafe } from "@/data/programa";
import { FlaticonCoffee } from "@/components/flaticon-icons";

export const Route = createFileRoute("/_authenticated/cafe")({
  head: () => ({
    meta: [
      { title: "Café | AgroBase" },
      {
        name: "description",
        content:
          "Produtos para café com ingrediente ativo, fornecedor, dosagem por estágio (viveiro, plantio, formação, produção), instruções e carência.",
      },
      { property: "og:title", content: "Café | AgroBase" },
      {
        property: "og:description",
        content: "Dosagens por estágio da lavoura de café - Programa de Manejo Técnico.",
      },
    ],
  }),
  component: PaginaCafe,
});

const ESTAGIOS = [
  "Viveiro",
  "Plantio",
  "1 ano / Recepa",
  "Em Produção",
  "Esqueletado / Decotado",
] as const;

function PaginaCafe() {
  const [termo, setTermo] = useState("");
  const [familia, setFamilia] = useState("todos");
  const [fornecedor, setFornecedor] = useState("todos");
  const [estagio, setEstagio] = useState("todos");

  const familias = useMemo(() => unicos(programa.cafe.map((p) => p.familia)), []);
  const fornecedores = useMemo(() => unicos(programa.cafe.map((p) => p.fornecedor)), []);

  const lista = useMemo(
    () =>
      programa.cafe.filter(
        (p) =>
          (familia === "todos" || p.familia === familia) &&
          (fornecedor === "todos" || p.fornecedor === fornecedor) &&
          (estagio === "todos" || (Boolean(p.dosagens[estagio]) && p.dosagens[estagio] !== "NA")) &&
          buscaEm(termo, [p.produto, p.ingrediente, p.fornecedor, p.grupo, p.familia, p.funcao]),
      ),
    [termo, familia, fornecedor, estagio],
  );

  return (
    <AppShell
      titulo="Café"
      descricao="Dosagens por estágio da lavoura, instruções e intervalo de segurança"
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <BarraFiltros
          termo={termo}
          onTermo={setTermo}
          placeholder="Buscar por produto, ingrediente ativo, fornecedor ou função (alvo)..."
          total={programa.cafe.length}
          exibidos={lista.length}
          filtros={[
            { id: "familia", rotulo: "Família", opcoes: familias, valor: familia, onChange: setFamilia },
            {
              id: "fornecedor",
              rotulo: "Fornecedor",
              opcoes: fornecedores,
              valor: fornecedor,
              onChange: setFornecedor,
            },
            {
              id: "estagio",
              rotulo: "Estágio com dosagem",
              opcoes: [...ESTAGIOS],
              valor: estagio,
              onChange: setEstagio,
            },
          ]}
        />

        {lista.length === 0 ? (
          <VazioResultado onLimpar={() => { setTermo(""); setFamilia("todos"); setFornecedor("todos"); setEstagio("todos"); }} />
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {lista.map((p) => (
              <Ficha key={p.id} produto={p} />
            ))}
          </Accordion>
        )}
      </div>
    </AppShell>
  );
}

function Ficha({ produto: p }: { produto: ProdutoCafe }) {
  const legenda = [p.familia, p.fornecedor].filter(Boolean).join(" · ");

  return (
    <AccordionItem value={p.id} className="panel border-none px-3.5 sm:px-4">
      <AccordionTrigger className="py-3.5 sm:py-4 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3 text-left pr-1">
          <span className="mt-0.5 grid size-8 sm:size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FlaticonCoffee size={18} className="sm:size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm sm:text-[15px] font-semibold text-foreground break-words leading-snug">{p.produto}</p>
            <p className="mt-0.5 text-xs text-muted-foreground break-words line-clamp-2 leading-tight">
              {legenda}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 sm:space-y-5 pb-5">
        {p.ingrediente && <Campo rotulo="Ingrediente ativo">{p.ingrediente}</Campo>}
        {p.familia && <Campo rotulo="Família">{p.familia}</Campo>}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dosagem por estágio
          </p>
          <div className="mt-2 grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {ESTAGIOS.map((e) => {
              const val = p.dosagens[e];
              const ehNa = !val || val === "NA" || val === "N/A" || val === "-";
              return (
                <div
                  key={e}
                  className={
                    ehNa
                      ? "rounded-lg border border-border/40 bg-muted/20 px-3 py-2 opacity-60"
                      : "rounded-lg border border-border bg-muted/40 px-3 py-2 shadow-xs"
                  }
                >
                  <p className="text-xs text-muted-foreground">{e}</p>
                  <p
                    className={
                      ehNa
                        ? "font-display text-xs font-semibold text-muted-foreground/80 pt-0.5"
                        : "font-display text-sm font-semibold text-gold break-words leading-snug pt-0.5"
                    }
                  >
                    {ehNa ? "NA (Não se aplica)" : val}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {p.funcao && <Campo rotulo="Função">{p.funcao}</Campo>}
        {p.instrucoes && <Campo rotulo="Instruções de aplicação">{p.instrucoes}</Campo>}

        <div className="flex flex-wrap gap-2">
          {p.grupo && <Badge variant="secondary" className="max-w-full break-words whitespace-normal text-left">{p.grupo}</Badge>}
          {p.familia && <Badge variant="outline" className="border-blue-500/30 text-blue-400 max-w-full break-words whitespace-normal text-left">{p.familia}</Badge>}
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
