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
import { buscaEm, programa, unicos, type ProdutoMilhoSoja } from "@/data/programa";
import { FlaticonCornSoy } from "@/components/flaticon-icons";

export const Route = createFileRoute("/_authenticated/milho-soja")({
  head: () => ({
    meta: [
      { title: "Catálogo Milho e Soja | AgroBase" },
      {
        name: "description",
        content:
          "Defensivos, fertilizantes e bioestimulantes para milho e soja com dosagem, composição, instruções de aplicação e carência.",
      },
      { property: "og:title", content: "Catálogo Milho e Soja | AgroBase" },
      {
        property: "og:description",
        content: "Produtos para milho e soja do Programa de Manejo Técnico.",
      },

    ],
  }),
  component: PaginaMilhoSoja,
});

function PaginaMilhoSoja() {
  const [termo, setTermo] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [fornecedor, setFornecedor] = useState("todos");
  const [cultura, setCultura] = useState("todos");

  const grupos = useMemo(() => unicos(programa.milhoSoja.map((p) => p.grupo)), []);
  const fornecedores = useMemo(() => unicos(programa.milhoSoja.map((p) => p.fornecedor)), []);
  const culturas = useMemo(() => unicos(programa.milhoSoja.map((p) => p.cultura)), []);

  const lista = useMemo(
    () =>
      programa.milhoSoja.filter(
        (p) =>
          (grupo === "todos" || p.grupo === grupo) &&
          (fornecedor === "todos" || p.fornecedor === fornecedor) &&
          (cultura === "todos" || p.cultura === cultura) &&
          buscaEm(termo, [p.produto, p.fornecedor, p.grupo, p.cultura, p.funcao, p.composicao]),
      ),
    [termo, grupo, fornecedor, cultura],
  );

  return (
    <AppShell
      titulo="Catálogo - Milho e Soja"
      descricao="Dosagem, composição, instruções de aplicação e carência"
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <BarraFiltros
          termo={termo}
          onTermo={setTermo}
          placeholder="Buscar por produto, fornecedor, composição ou função…"
          total={programa.milhoSoja.length}
          exibidos={lista.length}
          filtros={[
            { id: "grupo", rotulo: "Grupo", opcoes: grupos, valor: grupo, onChange: setGrupo },
            {
              id: "cultura",
              rotulo: "Cultura",
              opcoes: culturas,
              valor: cultura,
              onChange: setCultura,
            },
            {
              id: "fornecedor",
              rotulo: "Fornecedor",
              opcoes: fornecedores,
              valor: fornecedor,
              onChange: setFornecedor,
            },
          ]}
        />

        {lista.length === 0 ? (
          <VazioResultado />
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

function Ficha({ produto: p }: { produto: ProdutoMilhoSoja }) {
  return (
    <AccordionItem value={p.id} className="panel border-none px-4">
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FlaticonCornSoy size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold">{p.produto}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[p.grupo, p.cultura, p.fornecedor].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 pb-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {p.dosagem && <Campo rotulo="Dosagem">{p.dosagem}</Campo>}
          {p.composicao && <Campo rotulo="Composição">{p.composicao}</Campo>}
        </div>
        {p.funcao && <Campo rotulo="Função">{p.funcao}</Campo>}
        {p.instrucoes && <Campo rotulo="Instruções de aplicação">{p.instrucoes}</Campo>}
        <div className="flex flex-wrap gap-2">
          {p.grupo && <Badge variant="secondary">{p.grupo}</Badge>}
          {p.cultura && <Badge variant="outline">{p.cultura}</Badge>}
          <Carencia dias={p.carencia} />
        </div>

        <AcoesFichaProduto
          dados={{
            titulo: p.produto,
            cultura: p.cultura || "Milho / Soja",
            ingrediente: p.composicao,
            fornecedor: p.fornecedor,
            grupo: p.grupo,
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

