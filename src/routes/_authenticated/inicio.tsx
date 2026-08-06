import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Layers, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { programa, totais, unicos } from "@/data/programa";
import { useAuth } from "@/lib/auth";
import { APP } from "@/lib/app-config";
import {
  FlaticonCoffee,
  FlaticonCornSoy,
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
          "Painel inicial da base de conhecimento: catálogos de Café, Milho e Soja, famílias de produtos, calculadora de dosagem e calendário de manejo do Guia Agronômico Cooxupé.",
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
    to: "/familia-produtos",
    icon: Layers,
    titulo: "Família de Produtos",
    texto: "Produtos categorizados por famílias técnicas de defensivos e insumos agronômicos.",
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
  const nome = (user?.nomeCompleto || user?.email || "").split(" ")[0];

  const grupos = unicos(programa.cafe.map((p) => p.grupo)).length;
  const fornecedores = unicos([
    ...programa.cafe.map((p) => p.fornecedor),
    ...programa.milhoSoja.map((p) => p.fornecedor),
  ]).length;

  const familias = unicos([
    ...programa.cafe.map((p) => (p as any).familia),
    ...programa.milhoSoja.map((p) => (p as any).familia),
  ].filter(Boolean)).length;

  const metricas = [
    { valor: totais.cafe, rotulo: "Produtos Café" },
    { valor: totais.milhoSoja, rotulo: "Produtos Milho e Soja" },
    { valor: familias || 14, rotulo: "Famílias de Produtos" },
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
        {/* Banner Principal — Verde Profundo Elegante com Alta Legibilidade em Todos os Temas */}
        <section
          className="relative overflow-hidden rounded-3xl p-7 sm:p-10 shadow-2xl transition-all"
          style={{
            background: "linear-gradient(135deg, #071e11 0%, #123d24 55%, #0a2516 100%)",
            border: "1px solid rgba(212, 176, 84, 0.4)",
            boxShadow: "0 20px 50px rgba(7, 30, 17, 0.35)",
          }}
        >
          <div className="field-grid absolute inset-0 opacity-15 pointer-events-none" />
          <div
            className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #d4b054, transparent 70%)" }}
          />

          <div className="relative z-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3.5xl">
                Programa de Manejo Agronômico
              </h2>
              <span
                className="mt-3.5 block h-0.5 w-32 rounded-full"
                style={{ background: "linear-gradient(90deg, #d4b054 0%, transparent 100%)" }}
              />
              <p className="mt-4 text-sm sm:text-[14.5px] leading-relaxed text-emerald-100/90 font-medium">
                Consulte produtos por cultura, ingrediente ativo, fornecedor ou grupo. Cada ficha traz
                dosagem por estágio, instruções de aplicação, função e intervalo de segurança.
              </p>

              <div className="mt-4 rounded-xl border border-[#d4b054]/40 bg-[#d4b054]/15 p-3.5 text-xs sm:text-sm text-[#d4b054] font-medium leading-relaxed">
                <p className="font-bold text-white">Base de Conhecimento Técnico Cooxupé</p>
                <p className="mt-0.5 opacity-90 text-emerald-100">
                  Consulte sempre a bula oficial e o receituário agronômico antes da aplicação.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/cafe"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d4b054] px-5 py-2.5 text-sm font-bold text-[#071e11] shadow-lg transition-all hover:bg-[#e2bd5d] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Abrir catálogo de Café <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/familia-produtos"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50"
                >
                  Família de Produtos
                </Link>
              </div>
            </div>

            <img
              src="/logo.png"
              alt="Guia Agronômico Cooxupé"
              className="size-32 shrink-0 object-contain drop-shadow-2xl sm:size-44"
            />
          </div>
        </section>

        {/* Métricas com destaque dourado */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricas.map((m) => (
            <div
              key={m.rotulo}
              className="panel relative overflow-hidden p-4 transition-all hover:border-gold/50 hover:shadow-lifted"
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
              className="panel group p-5 transition-all hover:border-gold/50 hover:shadow-lifted"
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
          <section className="panel border-gold/25 p-5">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-gold" />
              Gestão do Sistema
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Convide novos integrantes, gerencie usuários e faça atualizações ou exportação da base de dados.
            </p>
            <Link
              to="/usuarios"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            >
              Acessar Gestão do Sistema <ArrowRight className="size-4 text-gold" />
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
