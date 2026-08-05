import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Leaf, TestTube2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BarraFiltros, VazioResultado } from "@/components/catalogo";
import { Badge } from "@/components/ui/badge";
import { buscaEm, programa, unicos } from "@/data/programa";

export const Route = createFileRoute("/_authenticated/foliar")({
  head: () => ({
    meta: [
      { title: "Linha Foliar | AgroBase" },
      {
        name: "description",
        content:
          "Itens da linha foliar por classe nutricional e fornecedor, além das recomendações de produtos por nutriente.",
      },
      { property: "og:title", content: "Linha Foliar | AgroBase" },
      {
        property: "og:description",
        content: "Fertilizantes foliares e recomendações por nutriente — Programa de Uso 2026.",
      },
    ],
  }),
  component: PaginaFoliar,
});

function PaginaFoliar() {
  const [termo, setTermo] = useState("");
  const [classe, setClasse] = useState("todos");
  const [fornecedor, setFornecedor] = useState("todos");

  const classes = useMemo(() => unicos(programa.foliar.map((i) => i.classe)), []);
  const fornecedores = useMemo(() => unicos(programa.foliar.map((i) => i.fornecedor)), []);

  const lista = useMemo(
    () =>
      programa.foliar.filter(
        (i) =>
          (classe === "todos" || i.classe === classe) &&
          (fornecedor === "todos" || i.fornecedor === fornecedor) &&
          buscaEm(termo, [i.descricao, i.codigo, i.fornecedor, i.classe]),
      ),
    [termo, classe, fornecedor],
  );

  return (
    <AppShell
      titulo="Linha Foliar"
      descricao="Itens por classe nutricional e recomendações por nutriente"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <Leaf className="size-4 text-primary" /> Produtos indicados por nutriente
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {programa.nutrientes.map((n) => (
              <div key={n.nutriente} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-display text-sm font-semibold text-primary">{n.nutriente}</p>
                <ul className="mt-2 space-y-1">
                  {n.produtos.map((p) => (
                    <li key={p} className="text-sm leading-snug text-muted-foreground">
                      • {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <BarraFiltros
          termo={termo}
          onTermo={setTermo}
          placeholder="Buscar item foliar por descrição, código ou fornecedor…"
          total={programa.foliar.length}
          exibidos={lista.length}
          filtros={[
            {
              id: "classe",
              rotulo: "Classe nutricional",
              opcoes: classes,
              valor: classe,
              onChange: setClasse,
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
          <div className="grid gap-3 sm:grid-cols-2">
            {lista.map((i) => (
              <article key={i.id} className="panel p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <TestTube2 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm leading-snug font-semibold">
                      {i.descricao}
                    </p>
                    {i.fornecedor && (
                      <p className="mt-1 text-xs text-muted-foreground">{i.fornecedor}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {i.classe && <Badge variant="secondary">{i.classe}</Badge>}
                      {i.codigo && <Badge variant="outline">Cód. {i.codigo}</Badge>}
                      {i.status && <Badge variant="outline">{i.status}</Badge>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
