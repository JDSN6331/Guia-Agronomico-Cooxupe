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
      { title: "Catálogo Café | AgroBase" },
      {
        name: "description",
        content:
          "Produtos para café com ingrediente ativo, fornecedor, dosagem por estágio (viveiro, plantio, formação, produção), instruções e carência.",
      },
      { property: "og:title", content: "Catálogo Café | AgroBase" },
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
  const [grupo, setGrupo] = useState("todos");
  const [fornecedor, setFornecedor] = useState("todos");
  const [estagio, setEstagio] = useState("todos");

  const grupos = useMemo(() => unicos(programa.cafe.map((p) => p.grupo)), []);
  const fornecedores = useMemo(() => unicos(programa.cafe.map((p) => p.fornecedor)), []);

  const lista = useMemo(
    () =>
      programa.cafe.filter(
        (p) =>
          (grupo === "todos" || p.grupo === grupo) &&
          (fornecedor === "todos" || p.fornecedor === fornecedor) &&
          (estagio === "todos" || Boolean(p.dosagens[estagio])) &&
          buscaEm(termo, [p.produto, p.ingrediente, p.fornecedor, p.grupo, p.funcao]),
      ),
    [termo, grupo, fornecedor, estagio],
  );

  return (
    <AppShell
      titulo="Catálogo - Café"
      descricao="Dosagens por estágio da lavoura, instruções e intervalo de segurança"
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <BarraFiltros
          termo={termo}
          onTermo={setTermo}
          placeholder="Buscar por produto, ingrediente ativo, fornecedor ou função…"
          total={programa.cafe.length}
          exibidos={lista.length}
          filtros={[
            { id: "grupo", rotulo: "Grupo", opcoes: grupos, valor: grupo, onChange: setGrupo },
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

function Ficha({ produto: p }: { produto: ProdutoCafe }) {
  const dosagens = ESTAGIOS.filter((e) => p.dosagens[e]);

  return (
    <AccordionItem value={p.id} className="panel border-none px-4">
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <FlaticonCoffee size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold">{p.produto}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[p.grupo, p.fornecedor].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 pb-5">
        {p.ingrediente && <Campo rotulo="Ingrediente ativo">{p.ingrediente}</Campo>}

        {dosagens.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dosagem por estágio
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dosagens.map((e) => (
                <div key={e} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{e}</p>
                  <p className="font-display text-sm font-semibold">
                    {p.dosagens[e]}
                    {p.unidadeFormacao ? ` ${p.unidadeFormacao}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.funcao && <Campo rotulo="Função">{p.funcao}</Campo>}
        {p.instrucoes && <Campo rotulo="Instruções de aplicação">{p.instrucoes}</Campo>}

        <div className="flex flex-wrap gap-2">
          {p.grupo && <Badge variant="secondary">{p.grupo}</Badge>}
          <Carencia dias={p.carencia} />
        </div>

        <AcoesFichaProduto
          dados={{
            titulo: p.produto,
            cultura: "Café",
            ingrediente: p.ingrediente,
            fornecedor: p.fornecedor,
            grupo: p.grupo,
            dosagens: p.dosagens,
            unidadeFormacao: p.unidadeFormacao,
            funcao: p.funcao,
            instrucoes: p.instrucoes,
            carencia: p.carencia,
          }}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

