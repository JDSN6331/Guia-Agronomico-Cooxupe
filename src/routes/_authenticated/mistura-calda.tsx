import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FlaticonFoliar, FlaticonTankMix } from "@/components/flaticon-icons";
import { AlertTriangle, CheckCircle2, Droplets, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mistura-calda")({
  head: () => ({
    meta: [
      { title: "Mistura de Calda | AgroBase" },
      {
        name: "description",
        content:
          "Ordem correta de adição de produtos no pulverizador para evitar incompatibilidade física, empelotamento e entupimento de pontas.",
      },
    ],
  }),
  component: PaginaMisturaCalda,
});

const ETAPAS_MISTURA = [
  {
    passo: 1,
    sigla: "H2O + AD",
    categoria: "Água & Condicionadores",
    descricao: "Abastecer o tanque até 50% da capacidade com água limpa e ligar a agitação constante.",
    exemplos: "Redutores de pH, Sequestrantes de Cátions, Antiespumantes",
    cor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  },
  {
    passo: 2,
    sigla: "WP",
    categoria: "Pós Molháveis",
    descricao: "Fazer uma pré-diluição prévia em balde com água antes de despejar no tanque.",
    exemplos: "Fungicidas em pó (Ex: Manconzeb, Cobre em pó)",
    cor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  },
  {
    passo: 3,
    sigla: "WG / WDG",
    categoria: "Grânulos Dispersíveis em Água",
    descricao: "Adicionar diretamente no filtro de boca ou pré-diluído sob agitação forte.",
    exemplos: "Grânulos secos dispersíveis (Ex: Azoxistrobina WG)",
    cor: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
  },
  {
    passo: 4,
    sigla: "SC",
    categoria: "Suspensão Concentrada",
    descricao: "Produtos à base de água com sólidos suspensos. Agitar a embalagem antes de usar.",
    exemplos: "Fungicidas e inseticidas em suspensão aquosa",
    cor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  },
  {
    passo: 5,
    sigla: "EC",
    categoria: "Emulsão Concentrada",
    descricao: "Formulações oleosas/solventes orgânicos. Formam emulsão leitosa ao contato com a água.",
    exemplos: "Inseticidas e concentrados emulsionáveis",
    cor: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
  },
  {
    passo: 6,
    sigla: "SL / FOL",
    categoria: "Solução Concentrada & Fertilizante Foliar",
    descricao: "Líquidos solúveis e fertilizantes foliares (Sais solúveis, quelatos e aminoácidos).",
    exemplos: "Foliar Nitrogênio, Boro, Zinco, Aminoácidos",
    cor: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900",
  },
  {
    passo: 7,
    sigla: "OIL / ADJ",
    categoria: "Óleos & Adjuvantes Finais",
    descricao: "Completar o volume do tanque até 100% e adicionar óleos minerais/vegetais e espalhantes.",
    exemplos: "Óleo Mineral, Óleo Vegetal, Espalhante Siliconado",
    cor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900",
  },
];

function PaginaMisturaCalda() {
  return (
    <AppShell
      titulo="Mistura de Calda"
      descricao="Sequência recomendada de adição de produtos no tanque para evitar incompatibilidade química e entupimentos"
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Banner informativo */}
        <section className="panel relative overflow-hidden p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <FlaticonTankMix size={24} />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">Ordem de Adição no Tanque</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A adição fora de sequência é a causa de 80% das coalhadas e entupimentos de pontas
                  de pulverização em campo.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
              <Droplets className="size-4 text-primary" /> Agitação contínua ativa
            </div>
          </div>
        </section>

        {/* Linha do tempo de etapas */}
        <section className="space-y-4">
          <h3 className="font-display text-base font-semibold">Passo a Passo da Mistura</h3>
          <div className="space-y-3">
            {ETAPAS_MISTURA.map((e) => (
              <article key={e.passo} className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
                    {e.passo}º
                  </span>
                  <div>
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold">
                      {e.sigla}
                    </span>
                    <p className="font-display text-sm font-semibold">{e.categoria}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm text-foreground/90">{e.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Exemplos:</strong> {e.exemplos}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Recomendações e Teste da Garrafa */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="panel space-y-3 p-6 border-terra/30 bg-terra/5">
            <div className="flex items-center gap-2 text-terra">
              <AlertTriangle className="size-5" />
              <h4 className="font-display text-base font-bold">Cuidados Críticos</h4>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5">•</span> Nunca misture produtos puros sem água no tanque.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5">•</span> Mantenha o agitador do pulverizador ligado durante todo o processo.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-0.5">•</span> Atenção especial a fertilizantes com Cálcio (Ca) misturados com Sulfatos ou Fosfatos (risco de precipitação).
              </li>
            </ul>
          </div>

          <div className="panel space-y-3 p-6">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-5" />
              <h4 className="font-display text-base font-bold">Teste da Garrafa (Pré-mistura)</h4>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Em caso de dúvida sobre a compatibilidade de produtos inéditos, coloque 1 litro de água
              em uma garrafa transparente e adicione as doses proporcionais dos produtos na sequência
              acima. Agite por 30 segundos e aguarde 15 minutos: se houver formação de pasta, flocos
              ou separação de fases, a mistura não é recomendada.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
