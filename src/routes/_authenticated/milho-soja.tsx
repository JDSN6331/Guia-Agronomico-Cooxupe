import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  AcoesFichaProduto,
  BarraFiltros,
  Campo,
  Carencia,
  ExportarResultados,
  VazioResultado,
} from "@/components/catalogo";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  buscaEm,
  buscaMultipla,
  programa,
  termosEfetivos,
  termosQueCasam,
  unicos,
  type ProdutoMilhoSoja,
} from "@/data/programa";
import type { ItemExportavel } from "@/lib/export-resultados";
import { FlaticonCornSoy } from "@/components/flaticon-icons";

export const Route = createFileRoute("/_authenticated/milho-soja")({
  head: () => ({
    meta: [
      { title: "Milho e Soja | AgroBase" },
      {
        name: "description",
        content:
          "Defensivos, fertilizantes e bioestimulantes para milho e soja com dosagem, composição, instruções de aplicação e carência.",
      },
      { property: "og:title", content: "Milho e Soja | AgroBase" },
      {
        property: "og:description",
        content: "Produtos para milho e soja do Programa de Manejo Técnico.",
      },
    ],
  }),
  component: PaginaMilhoSoja,
});

const camposBusca = (p: ProdutoMilhoSoja) => [
  p.produto,
  p.fornecedor,
  p.grupo,
  p.familia,
  p.cultura,
  p.funcao,
  p.composicao,
];

function PaginaMilhoSoja() {
  const [termo, setTermo] = useState("");
  const [termos, setTermos] = useState<string[]>([]);
  const [familia, setFamilia] = useState("todos");
  const [fornecedor, setFornecedor] = useState("todos");
  const [cultura, setCultura] = useState("todos");

  const familias = useMemo(() => unicos(programa.milhoSoja.map((p) => p.familia)), []);
  const fornecedores = useMemo(() => unicos(programa.milhoSoja.map((p) => p.fornecedor)), []);
  const culturas = useMemo(() => unicos(programa.milhoSoja.map((p) => p.cultura)), []);

  // Termos confirmados (chips) + o que ainda está sendo digitado
  const termosBusca = useMemo(() => termosEfetivos(termos, termo), [termos, termo]);

  // Itens que passam pelos filtros (sem considerar a busca por texto)
  const baseFiltrada = useMemo(
    () =>
      programa.milhoSoja.filter(
        (p) =>
          (familia === "todos" || p.familia === familia) &&
          (fornecedor === "todos" || p.fornecedor === fornecedor) &&
          (cultura === "todos" || p.cultura === cultura),
      ),
    [familia, fornecedor, cultura],
  );

  // Encontra o produto se QUALQUER um dos termos casar
  const lista = useMemo(
    () => baseFiltrada.filter((p) => buscaMultipla(termosBusca, camposBusca(p))),
    [baseFiltrada, termosBusca],
  );

  // Quantos itens cada termo encontrou (alerta quando algum não encontra nada)
  const contagens = useMemo(
    () =>
      Object.fromEntries(
        termosBusca.map((t) => [t, baseFiltrada.filter((p) => buscaEm(t, camposBusca(p))).length]),
      ) as Record<string, number>,
    [baseFiltrada, termosBusca],
  );

  // Todos os resultados prontos para exportar de uma vez
  const itensExportacao = useMemo<ItemExportavel[]>(
    () =>
      lista.map((p) => ({
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
        encontradoPor: termosQueCasam(termosBusca, camposBusca(p)),
      })),
    [lista, termosBusca],
  );

  return (
    <AppShell
      titulo="Milho e Soja"
      descricao="Dosagem, composição, instruções de aplicação e carência"
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <BarraFiltros
          termo={termo}
          onTermo={setTermo}
          termos={termos}
          onTermos={setTermos}
          contagens={contagens}
          acoes={<ExportarResultados itens={itensExportacao} termos={termosBusca} rotulo="Milho e Soja" />}
          placeholder="Buscar por produto, ingrediente ativo, fornecedor ou função (alvo)..."
          total={programa.milhoSoja.length}
          exibidos={lista.length}
          filtros={[
            { id: "familia", rotulo: "Família", opcoes: familias, valor: familia, onChange: setFamilia },
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
          <VazioResultado
            onLimpar={() => {
              setTermo("");
              setTermos([]);
              setFamilia("todos");
              setFornecedor("todos");
              setCultura("todos");
            }}
          />
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
  const legenda = [p.familia, p.fornecedor].filter(Boolean).join(" · ");

  return (
    <AccordionItem value={p.id} className="panel border-none px-3.5 sm:px-4">
      <AccordionTrigger className="py-3.5 sm:py-4 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3 text-left pr-1">
          <span className="mt-0.5 grid size-8 sm:size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FlaticonCornSoy size={18} className="sm:size-5" />
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
        <div className="grid gap-4 sm:grid-cols-2">
          {p.dosagem && <Campo rotulo="Dosagem">{p.dosagem}</Campo>}
          {p.composicao && <Campo rotulo="Composição">{p.composicao}</Campo>}
          {p.familia && <Campo rotulo="Família">{p.familia}</Campo>}
        </div>
        {p.funcao && <Campo rotulo="Função">{p.funcao}</Campo>}
        {p.instrucoes && <Campo rotulo="Instruções de aplicação">{p.instrucoes}</Campo>}
        <div className="flex flex-wrap gap-2">
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
