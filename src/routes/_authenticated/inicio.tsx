import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { programa, totais, unicos } from "@/data/programa";
import { useAuth } from "@/lib/auth";
import { APP } from "@/lib/app-config";
import {
  FlaticonCoffee,
  FlaticonCornSoy,
  FlaticonFoliar,
  FlaticonCalendar,
  FlaticonCalculator,
  FlaticonTankMix,
} from "@/components/flaticon-icons";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Guia Agronômico Cooxupé" },
      {
        name: "description",
        content:
          "Painel inicial da base de conhecimento: catálogos de Café, Milho e Soja, linha foliar, calculadora de dosagem e calendário de manejo do Guia Agronômico Cooxupé.",
      },
      { property: "og:title", content: "Início | Guia Agronômico Cooxupé" },
      {
        property: "og:description",
        content: "Painel inicial da base de conhecimento técnico Cooxupé.",
      },
    ],
  }),
  component: Inicio,
});

const ATALHOS = [
  {
    to: "/cafe",
    icon: FlaticonCoffee,
    titulo: "Café",
    texto: "Dosagens por estágio: viveiro, plantio, formação, produção e esqueletamento.",
  },
  {
    to: "/milho-soja",
    icon: FlaticonCornSoy,
    titulo: "Milho e Soja",
    texto: "Defensivos, fertilizantes e bioestimulantes com dosagem e instruções de uso.",
  },
  {
    to: "/foliar",
    icon: FlaticonFoliar,
    titulo: "Linha Foliar",
    texto: "Itens da linha por classe nutricional e recomendações por deficiência.",
  },
  {
    to: "/calendario",
    icon: FlaticonCalendar,
    titulo: "Calendário de Manejo",
    texto: "Janelas fenológicas do café adulto e em formação, com produtos por categoria.",
  },
  {
    to: "/calculadora",
    icon: FlaticonCalculator,
    titulo: "Calculadora de Dosagem",
    texto: "Cálculo instantâneo de produto comercial, calda total e reabastecimentos.",
  },
  {
    to: "/mistura-calda",
    icon: FlaticonTankMix,
    titulo: "Mistura de Calda",
    texto: "Guia passo a passo da ordem de adição de produtos e prevenção de coalhadas.",
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
      descricao={APP.nomeCompleto}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Banner Principal — verde profundo com acento dourado */}
        <section className="panel banner-campo relative overflow-hidden border-transparent p-7 sm:p-9 text-primary-foreground">
          <div className="field-grid absolute inset-0 opacity-20" />
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--color-gold), transparent 70%)" }}
          />
          <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                <ShieldCheck className="size-3.5" /> Conteúdo oficial · {APP.equipe}
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
                Programa de Manejo Agronômico
              </h2>
              <span className="gold-rule mt-3 block h-px w-28 rounded-full" />
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
                Consulte produtos por cultura, ingrediente ativo, fornecedor ou grupo. Cada ficha traz
                dosagem por estágio, instruções de aplicação, função e intervalo de segurança.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/cafe"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-sm transition-all hover:brightness-105"
                >
                  Abrir catálogo de Café <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/calculadora"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/20"
                >
                  Calculadora de Dosagem
                </Link>
              </div>
            </div>

            <img
              src="/logo.png"
              alt="Guia Agronômico Cooxupé"
              className="size-28 shrink-0 object-contain drop-shadow-xl sm:size-40"
            />
          </div>
        </section>



        {/* Métricas com destaque dourado */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricas.map((m) => (
            <div
              key={m.rotulo}
              className="panel relative overflow-hidden p-4 transition-colors hover:border-gold/40"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gold/70" />
              <p className="font-display text-3xl font-bold text-gold">{m.valor}</p>
              <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">{m.rotulo}</p>
            </div>
          ))}
        </section>

        {/* Atalhos Rápidos */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ATALHOS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="panel group p-5 transition-all hover:border-gold/40 hover:shadow-lifted"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-gold/15 group-hover:text-gold">
                <a.icon size={22} />
              </span>
              <h3 className="mt-4 flex items-center gap-2 font-display text-base font-semibold">
                {a.titulo}
                <ArrowRight className="size-4 -translate-x-1 text-gold opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
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
          <section className="panel p-5 border-amber-500/20">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-[#c59b27]" />
              Administração
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Convide novos integrantes por e-mail e defina o nível de acesso de cada um.
            </p>
            <Link
              to="/usuarios"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Gerenciar usuários <ArrowRight className="size-4 text-[#c59b27]" />
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
