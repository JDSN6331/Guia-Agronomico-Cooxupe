import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  Coffee,
  ShieldCheck,
  Sprout,
  TestTube2,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { programa, totais, unicos } from "@/data/programa";
import { useAuth } from "@/lib/auth";
import { APP } from "@/lib/app-config";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | AgroBase" },
      {
        name: "description",
        content:
          "Painel inicial da base de conhecimento: catálogos de Café, Milho e Soja, linha foliar e calendário de manejo do Programa de Uso 2026.",
      },
      { property: "og:title", content: "Início | AgroBase" },
      {
        property: "og:description",
        content: "Painel inicial da base de conhecimento técnico do Programa de Uso 2026.",
      },
    ],
  }),
  component: Inicio,
});

const ATALHOS = [
  {
    to: "/cafe",
    icon: Coffee,
    titulo: "Café",
    texto: "Dosagens por estágio: viveiro, plantio, formação, produção e esqueletamento.",
  },
  {
    to: "/milho-soja",
    icon: Sprout,
    titulo: "Milho e Soja",
    texto: "Defensivos, fertilizantes e bioestimulantes com dosagem e instruções de uso.",
  },
  {
    to: "/foliar",
    icon: TestTube2,
    titulo: "Linha Foliar",
    texto: "Itens da linha por classe nutricional e recomendações por deficiência.",
  },
  {
    to: "/calendario",
    icon: CalendarRange,
    titulo: "Calendário de Manejo",
    texto: "Janelas fenológicas do café adulto e em formação, com produtos por categoria.",
  },
] as const;

function Inicio() {
  const { user, isAdmin } = useAuth();
  const nome = ((user?.user_metadata?.["nome_completo"] as string | undefined) ?? "").split(" ")[0];

  const grupos = unicos(programa.cafe.map((p) => p.grupo)).length;
  const fornecedores = unicos([
    ...programa.cafe.map((p) => p.fornecedor),
    ...programa.milhoSoja.map((p) => p.fornecedor),
  ]).length;

  const metricas = [
    { valor: totais.cafe, rotulo: "Produtos Café" },
    { valor: totais.milhoSoja, rotulo: "Produtos Milho e Soja" },
    { valor: totais.foliar, rotulo: "Itens linha foliar" },
    { valor: grupos, rotulo: "Grupos de manejo" },
    { valor: fornecedores, rotulo: "Fornecedores" },
    { valor: totais.janelas, rotulo: "Janelas de manejo" },
  ];

  return (
    <AppShell
      titulo={nome ? `Olá, ${nome}` : "Início"}
      descricao={`${APP.nomeCompleto} · Programa de Uso ${APP.ano}`}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="panel relative overflow-hidden p-7 sm:p-9">
          <div className="field-grid absolute inset-0 opacity-60" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <ShieldCheck className="size-3.5" /> Conteúdo oficial · {APP.equipe}
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Programa de Uso {APP.ano}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Consulte produtos por cultura, ingrediente ativo, fornecedor ou grupo. Cada ficha traz
              dosagem por estágio, instruções de aplicação, função e intervalo de segurança.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/cafe"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Abrir catálogo de Café <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/calendario"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Ver calendário de manejo
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricas.map((m) => (
            <div key={m.rotulo} className="panel p-4">
              <p className="font-display text-2xl font-bold text-primary">{m.valor}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{m.rotulo}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {ATALHOS.map((a) => (
            <Link key={a.to} to={a.to} className="panel group p-5 transition-shadow hover:shadow-lifted">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <a.icon className="size-5" />
              </span>
              <h3 className="mt-4 flex items-center gap-2 font-display text-base font-semibold">
                {a.titulo}
                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.texto}</p>
            </Link>
          ))}
        </section>

        <section className="flex gap-3 rounded-xl border border-terra/40 bg-terra/10 p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-terra" />
          <p className="text-sm leading-relaxed text-foreground/80">
            <strong className="font-semibold">Uso responsável.</strong> As recomendações são
            orientativas e não substituem a bula, o receituário agronômico nem a avaliação de campo.
            Sempre verifique o intervalo de segurança antes da colheita.
          </p>
        </section>

        {isAdmin && (
          <section className="panel p-5">
            <h3 className="font-display text-base font-semibold">Administração</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Convide novos integrantes por e-mail e defina o nível de acesso de cada um.
            </p>
            <Link
              to="/usuarios"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Gerenciar usuários <ArrowRight className="size-4" />
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
