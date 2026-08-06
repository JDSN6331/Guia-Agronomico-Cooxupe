import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Info, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buscaEm, programa, type JanelaCalendario } from "@/data/programa";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário de Manejo | AgroBase" },
      {
        name: "description",
        content:
          "Janelas fenológicas do café adulto e em formação com os produtos recomendados por categoria em cada etapa do manejo.",
      },
      { property: "og:title", content: "Calendário de Manejo | AgroBase" },
      {
        property: "og:description",
        content: "Janelas de manejo do café e produtos por categoria - Programa de Manejo Técnico.",
      },

    ],
  }),
  component: PaginaCalendario,
});

function PaginaCalendario() {
  const [termo, setTermo] = useState("");

  return (
    <AppShell
      titulo="Calendário de Manejo"
      descricao="Janelas fenológicas e produtos recomendados por categoria"
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por janela, categoria ou produto…"
            className="pl-9"
            maxLength={120}
          />
        </div>

        <Tabs defaultValue="adulto">
          <TabsList className="w-full">
            <TabsTrigger value="adulto" className="flex-1">
              Café em produção
            </TabsTrigger>
            <TabsTrigger value="formacao" className="flex-1">
              Café em formação
            </TabsTrigger>
          </TabsList>
          <TabsContent value="adulto" className="mt-4">
            <Linha janelas={programa.calendarioAdulto} termo={termo} />
          </TabsContent>
          <TabsContent value="formacao" className="mt-4">
            <Linha janelas={programa.calendarioFormacao} termo={termo} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Linha({ janelas, termo }: { janelas: JanelaCalendario[]; termo: string }) {
  const filtradas = useMemo(
    () =>
      janelas
        .map((j) => ({
          ...j,
          categorias: j.categorias.filter(
            (c) =>
              buscaEm(termo, [j.janela, j.descricao, c.categoria]) ||
              c.produtos.some((p) => buscaEm(termo, [p])),
          ),
        }))
        .filter((j) => j.categorias.length > 0),
    [janelas, termo],
  );

  if (filtradas.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <p className="font-display text-base font-semibold">Nada encontrado nesta linha</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ajuste o termo de busca para ver as janelas de manejo.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5 sm:pl-7">
      {filtradas.map((j) => (
        <li key={j.id} className="relative">
          <span className="absolute -left-[27px] grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground sm:-left-[35px]">
            <CalendarRange className="size-3" />
          </span>
          <article className="panel p-5">
            <h3 className="font-display text-base font-bold text-primary">{j.janela}</h3>
            {j.nota && j.nota !== j.janela && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" />
                {j.nota}
              </p>
            )}
            <div className="mt-4 space-y-3">
              {j.categorias.map((c) => (
                <div key={c.categoria} className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm font-semibold leading-snug">{c.categoria}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.produtos.map((p) => (
                      <Badge key={p} variant="outline" className="font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
