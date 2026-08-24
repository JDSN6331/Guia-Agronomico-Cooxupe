import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calculator,
  Check,
  Copy,
  Gauge,
  HelpCircle,
  Info,
  RotateCcw,
  Share2,
  Tractor,
  Wheat,
  Wind,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copiarTexto } from "@/lib/share-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calculadora-vazao")({
  head: () => ({
    meta: [
      { title: "Calculadora de Vazão | AgroBase" },
      {
        name: "description",
        content:
          "Calcule e calibre a vazão por bico (L/min), velocidade do trator e volume de calda para turboatomizadores, barras e aplicadores de herbicida.",
      },
      { property: "og:title", content: "Calculadora de Vazão | AgroBase" },
      {
        property: "og:description",
        content:
          "Ferramenta técnica de calibração de pulverizadores agrícolas para Café, Milho e Soja.",
      },
    ],
  }),
  component: PaginaCalculadoraVazao,
});

type TipoEquipamento = "turbo" | "barra" | "herbicida";

export function PaginaCalculadoraVazao() {
  const [tipo, setTipo] = useState<TipoEquipamento>("turbo");
  const [copiado, setCopiado] = useState(false);

  // --- 1. Turboatomizador ---
  const [turboEspacamento, setTurboEspacamento] = useState("3.5"); // metros entrelinha
  const [turboVolumeHa, setTurboVolumeHa] = useState("400"); // L/ha
  const [turboDistancia, setTurboDistancia] = useState("50"); // metros
  const [turboTempo, setTurboTempo] = useState("45"); // segundos
  const [turboBicos, setTurboBicos] = useState("20"); // número de bicos

  // --- 2. Pulverizador de Barra ---
  const [barraEspacamento, setBarraEspacamento] = useState("50"); // cm entre bicos
  const [barraVolumeHa, setBarraVolumeHa] = useState("150"); // L/ha
  const [barraDistancia, setBarraDistancia] = useState("50"); // metros
  const [barraTempo, setBarraTempo] = useState("30"); // segundos
  const [barraTotalBicos, setBarraTotalBicos] = useState("36"); // total bicos na barra (opcional para vazão total)

  // --- 3. Aplicador de Herbicida ---
  const [herbFaixa, setHerbFaixa] = useState("1.5"); // metros faixa
  const [herbVolumeHa, setHerbVolumeHa] = useState("200"); // L/ha
  const [herbDistancia, setHerbDistancia] = useState("50"); // metros
  const [herbTempo, setHerbTempo] = useState("36"); // segundos
  const [herbBicos, setHerbBicos] = useState("2"); // número de bicos na barra lateral

  // --- Cálculos Turboatomizador ---
  const calcTurbo = useMemo(() => {
    const esp = parseFloat(turboEspacamento.replace(",", ".")) || 0;
    const vol = parseFloat(turboVolumeHa.replace(",", ".")) || 0;
    const dist = parseFloat(turboDistancia.replace(",", ".")) || 0;
    const tempo = parseFloat(turboTempo.replace(",", ".")) || 0;
    const bicos = parseFloat(turboBicos.replace(",", ".")) || 1;

    // Velocidade = (distância / tempo) * 3.6
    const velKmH = tempo > 0 ? (dist / tempo) * 3.6 : 0;
    const velMS = tempo > 0 ? dist / tempo : 0;

    // Vazão Total do Turbo (L/min) = (VolumeHa * Espaçamento * Velocidade) / 600
    const vazaoTotal = (vol * esp * velKmH) / 600;

    // Vazão por Bico (L/min) = Vazão Total / N° de bicos
    const vazaoBico = bicos > 0 ? vazaoTotal / bicos : 0;

    // Rendimento operacional (ha/h) = (Espaçamento * Velocidade) / 10
    const rendimentoHaH = (esp * velKmH) / 10;
    const tempoMinPorHa = rendimentoHaH > 0 ? 60 / rendimentoHaH : 0;

    return {
      velKmH,
      velMS,
      vazaoBico,
      vazaoBicoMlMin: vazaoBico * 1000,
      vazaoTotal,
      rendimentoHaH,
      tempoMinPorHa,
    };
  }, [turboEspacamento, turboVolumeHa, turboDistancia, turboTempo, turboBicos]);

  // --- Cálculos Pulverizador de Barra ---
  const calcBarra = useMemo(() => {
    const espCm = parseFloat(barraEspacamento.replace(",", ".")) || 0;
    const vol = parseFloat(barraVolumeHa.replace(",", ".")) || 0;
    const dist = parseFloat(barraDistancia.replace(",", ".")) || 0;
    const tempo = parseFloat(barraTempo.replace(",", ".")) || 0;
    const totalBicos = parseFloat(barraTotalBicos.replace(",", ".")) || 0;

    // Velocidade = (distância / tempo) * 3.6
    const velKmH = tempo > 0 ? (dist / tempo) * 3.6 : 0;
    const velMS = tempo > 0 ? dist / tempo : 0;

    // Vazão por bico (L/min) = (VolumeHa * Espaçamento_cm * Velocidade) / 60000
    const vazaoBico = (vol * espCm * velKmH) / 60000;

    // Largura total da barra em metros = (totalBicos * espCm) / 100
    const larguraBarraM = (totalBicos * espCm) / 100;
    const vazaoTotal = totalBicos > 0 ? vazaoBico * totalBicos : 0;

    // Rendimento operacional (ha/h) = (LarguraBarra * Velocidade) / 10
    const rendimentoHaH = larguraBarraM > 0 ? (larguraBarraM * velKmH) / 10 : 0;
    const tempoMinPorHa = rendimentoHaH > 0 ? 60 / rendimentoHaH : 0;

    return {
      velKmH,
      velMS,
      vazaoBico,
      vazaoBicoMlMin: vazaoBico * 1000,
      larguraBarraM,
      vazaoTotal,
      rendimentoHaH,
      tempoMinPorHa,
    };
  }, [barraEspacamento, barraVolumeHa, barraDistancia, barraTempo, barraTotalBicos]);

  // --- Cálculos Aplicador de Herbicida ---
  const calcHerb = useMemo(() => {
    const faixa = parseFloat(herbFaixa.replace(",", ".")) || 0;
    const vol = parseFloat(herbVolumeHa.replace(",", ".")) || 0;
    const dist = parseFloat(herbDistancia.replace(",", ".")) || 0;
    const tempo = parseFloat(herbTempo.replace(",", ".")) || 0;
    const bicos = parseFloat(herbBicos.replace(",", ".")) || 1;

    // Velocidade = (distância / tempo) * 3.6
    const velKmH = tempo > 0 ? (dist / tempo) * 3.6 : 0;
    const velMS = tempo > 0 ? dist / tempo : 0;

    // Vazão do aplicador (L/min) = (VolumeHa * Faixa * Velocidade) / 600
    const vazaoTotal = (vol * faixa * velKmH) / 600;
    const vazaoBico = bicos > 0 ? vazaoTotal / bicos : vazaoTotal;

    const rendimentoHaH = (faixa * velKmH) / 10;
    const tempoMinPorHa = rendimentoHaH > 0 ? 60 / rendimentoHaH : 0;

    return {
      velKmH,
      velMS,
      vazaoBico,
      vazaoBicoMlMin: vazaoBico * 1000,
      vazaoTotal,
      rendimentoHaH,
      tempoMinPorHa,
    };
  }, [herbFaixa, herbVolumeHa, herbDistancia, herbTempo, herbBicos]);

  // Texto para compartilhamento / cópia
  async function copiarRelatorio() {
    let texto = "";
    if (tipo === "turbo") {
      texto = `🚜 *CALIBRAÇÃO DE TURBOATOMIZADOR - AGROBASE*\n\n` +
        `• *Entrelinha:* ${turboEspacamento} m\n` +
        `• *Volume pretendido:* ${turboVolumeHa} L/ha\n` +
        `• *Distância percorrida:* ${turboDistancia} m em ${turboTempo} s\n` +
        `• *Velocidade do trator:* ${calcTurbo.velKmH.toFixed(2)} km/h\n` +
        `• *N° de bicos:* ${turboBicos}\n\n` +
        `💧 *RESULTADO DA VAZÃO:*\n` +
        `👉 *Vazão por bico:* ${calcTurbo.vazaoBico.toFixed(3)} L/min (${calcTurbo.vazaoBicoMlMin.toFixed(0)} mL/min)\n` +
        `👉 *Vazão total do atomizador:* ${calcTurbo.vazaoTotal.toFixed(2)} L/min\n` +
        `👉 *Rendimento operacional:* ${calcTurbo.rendimentoHaH.toFixed(2)} ha/h (~${calcTurbo.tempoMinPorHa.toFixed(0)} min/ha)`;
    } else if (tipo === "barra") {
      texto = `🌾 *CALIBRAÇÃO DE PULVERIZADOR DE BARRA - AGROBASE*\n\n` +
        `• *Espaçamento entre bicos:* ${barraEspacamento} cm\n` +
        `• *Volume pretendido:* ${barraVolumeHa} L/ha\n` +
        `• *Distância percorrida:* ${barraDistancia} m em ${barraTempo} s\n` +
        `• *Velocidade do trator:* ${calcBarra.velKmH.toFixed(2)} km/h\n` +
        (barraTotalBicos ? `• *Total de bicos na barra:* ${barraTotalBicos}\n` : "") +
        `\n💧 *RESULTADO DA VAZÃO:*\n` +
        `👉 *Vazão por bico:* ${calcBarra.vazaoBico.toFixed(3)} L/min (${calcBarra.vazaoBicoMlMin.toFixed(0)} mL/min)\n` +
        (calcBarra.vazaoTotal > 0 ? `👉 *Vazão total da barra:* ${calcBarra.vazaoTotal.toFixed(2)} L/min\n` : "") +
        (calcBarra.rendimentoHaH > 0 ? `👉 *Rendimento operacional:* ${calcBarra.rendimentoHaH.toFixed(2)} ha/h\n` : "");
    } else {
      texto = `🌿 *CALIBRAÇÃO DE APLICADOR DE HERBICIDA - AGROBASE*\n\n` +
        `• *Faixa de aplicação:* ${herbFaixa} m\n` +
        `• *Volume pretendido:* ${herbVolumeHa} L/ha\n` +
        `• *Distância percorrida:* ${herbDistancia} m em ${herbTempo} s\n` +
        `• *Velocidade do trator:* ${calcHerb.velKmH.toFixed(2)} km/h\n` +
        `• *N° de bicos:* ${herbBicos}\n\n` +
        `💧 *RESULTADO DA VAZÃO:*\n` +
        `👉 *Vazão por bico:* ${calcHerb.vazaoBico.toFixed(3)} L/min (${calcHerb.vazaoBicoMlMin.toFixed(0)} mL/min)\n` +
        `👉 *Vazão total:* ${calcHerb.vazaoTotal.toFixed(2)} L/min`;
    }

    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(true);
      toast.success("Relatório de calibração copiado com sucesso!");
      setTimeout(() => setCopiado(false), 3000);
    } else {
      toast.error("Não foi possível copiar o relatório.");
    }
  }

  return (
    <AppShell
      titulo="Calculadora de Vazão"
      descricao="Calibração técnica de bicos, velocidade de trabalho e vazão de calda para pulverizadores"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Seletor de Tipo de Equipamento */}
        <Tabs
          value={tipo}
          onValueChange={(v) => setTipo(v as TipoEquipamento)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-12 bg-muted/60 p-1 rounded-2xl border border-border">
            <TabsTrigger
              value="turbo"
              className="rounded-xl text-[11px] sm:text-sm font-bold gap-1 sm:gap-2 data-[state=active]:bg-[#1c5c36] data-[state=active]:text-white dark:data-[state=active]:bg-gold dark:data-[state=active]:text-[#071e11] transition-all px-1 sm:px-3"
            >
              <Wind className="size-3.5 sm:size-4 shrink-0" />
              <span className="sm:hidden">Turbo</span>
              <span className="hidden sm:inline">Turboatomizador</span>
            </TabsTrigger>
            <TabsTrigger
              value="barra"
              className="rounded-xl text-[11px] sm:text-sm font-bold gap-1 sm:gap-2 data-[state=active]:bg-[#1c5c36] data-[state=active]:text-white dark:data-[state=active]:bg-gold dark:data-[state=active]:text-[#071e11] transition-all px-1 sm:px-3"
            >
              <Wheat className="size-3.5 sm:size-4 shrink-0" />
              <span>Barra</span>
            </TabsTrigger>
            <TabsTrigger
              value="herbicida"
              className="rounded-xl text-[11px] sm:text-sm font-bold gap-1 sm:gap-2 data-[state=active]:bg-[#1c5c36] data-[state=active]:text-white dark:data-[state=active]:bg-gold dark:data-[state=active]:text-[#071e11] transition-all px-1 sm:px-3"
            >
              <Tractor className="size-3.5 sm:size-4 shrink-0" />
              <span className="sm:hidden">Herbicida</span>
              <span className="hidden sm:inline">Aplicador Herbicida</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* 1. ABA TURBOATAMIZADOR */}
          {/* ============================================================ */}
          <TabsContent value="turbo" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Coluna 1: Entradas de Parâmetros */}
              <div className="panel p-6 space-y-5 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-gold/15 text-gold">
                      <Wind className="size-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-base font-bold text-foreground">
                        Turboatomizador (Café e Fruticultura)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Preencha os dados da lavoura e do trator para obter a vazão necessária por bico
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTurboEspacamento("3.5");
                      setTurboVolumeHa("400");
                      setTurboDistancia("50");
                      setTurboTempo("45");
                      setTurboBicos("20");
                      toast.info("Valores padrão restaurados.");
                    }}
                    className="text-xs text-muted-foreground gap-1 hover:text-foreground h-8"
                  >
                    <RotateCcw className="size-3" /> Padrão
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="turbo-esp" className="text-xs font-semibold flex items-center justify-between">
                      <span>Espaçamento da Entrelinha</span>
                      <span className="text-[10px] text-muted-foreground font-normal">metros (m)</span>
                    </Label>
                    <Input
                      id="turbo-esp"
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={turboEspacamento}
                      onChange={(e) => setTurboEspacamento(e.target.value)}
                      placeholder="Ex: 3.5"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Distância entre ruas do cafeeiro (ex: 3.5m a 4.0m)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="turbo-vol" className="text-xs font-semibold flex items-center justify-between">
                      <span>Volume de Calda Desejado</span>
                      <span className="text-[10px] text-muted-foreground font-normal">L/ha</span>
                    </Label>
                    <Input
                      id="turbo-vol"
                      type="number"
                      step="10"
                      min="50"
                      value={turboVolumeHa}
                      onChange={(e) => setTurboVolumeHa(e.target.value)}
                      placeholder="Ex: 400"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Volume por hectare recomendado pelo agrônomo
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="turbo-dist" className="text-xs font-semibold flex items-center justify-between">
                      <span>Distância de Teste no Campo</span>
                      <span className="text-[10px] text-muted-foreground font-normal">metros (m)</span>
                    </Label>
                    <Input
                      id="turbo-dist"
                      type="number"
                      step="5"
                      min="10"
                      value={turboDistancia}
                      onChange={(e) => setTurboDistancia(e.target.value)}
                      placeholder="Ex: 50"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Distância marcada na lavoura (padrão: 50 metros)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="turbo-tempo" className="text-xs font-semibold flex items-center justify-between">
                      <span>Tempo do Trator no Trecho</span>
                      <span className="text-[10px] text-muted-foreground font-normal">segundos (s)</span>
                    </Label>
                    <Input
                      id="turbo-tempo"
                      type="number"
                      step="0.5"
                      min="1"
                      value={turboTempo}
                      onChange={(e) => setTurboTempo(e.target.value)}
                      placeholder="Ex: 45"
                      className="font-mono text-sm font-bold text-gold"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Tempo cronometrado para percorrer a distância
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="turbo-bicos" className="text-xs font-semibold flex items-center justify-between">
                      <span>Número Total de Bicos Ativos</span>
                      <span className="text-[10px] text-muted-foreground font-normal">quantidade</span>
                    </Label>
                    <Input
                      id="turbo-bicos"
                      type="number"
                      step="1"
                      min="1"
                      value={turboBicos}
                      onChange={(e) => setTurboBicos(e.target.value)}
                      placeholder="Ex: 20"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Soma dos bicos abertos dos dois lados do arco do turboatomizador (ex: 10 + 10 = 20 bicos)
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-primary flex items-center gap-1.5">
                    <Info className="size-3.5" /> Dica de Calibração no Campo
                  </p>
                  <p>
                    Meça a vazão real coletando a água de cada bico em um copo graduado durante <strong>1 minuto</strong> com o trator na rotação de trabalho (ex: 540 RPM na TDP).
                  </p>
                </div>
              </div>

              {/* Coluna 2: Painel de Resultados */}
              <div className="space-y-4 lg:col-span-5">
                <div className="panel p-6 space-y-5 bg-gradient-to-br from-card to-secondary/30 border-gold/40 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="size-5 text-gold" />
                      <h3 className="font-display text-base font-bold text-foreground">
                        Resultado da Calibração
                      </h3>
                    </div>
                    <Badge variant="outline" className="border-gold/50 text-gold bg-gold/10 font-mono text-xs">
                      {calcTurbo.velKmH.toFixed(2)} km/h
                    </Badge>
                  </div>

                  {/* Card de Destaque da Vazão por Bico */}
                  <div className="rounded-2xl border border-gold/50 bg-[#071e11] p-5 text-center text-white space-y-1 shadow-inner">
                    <span className="text-[11px] uppercase tracking-wider text-gold font-bold">
                      Vazão Necessária por Bico
                    </span>
                    <p className="font-display text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
                      {calcTurbo.vazaoBico.toFixed(3)}{" "}
                      <span className="text-sm font-normal text-emerald-100">L/min</span>
                    </p>
                    <p className="text-xs text-emerald-100/80 font-mono pt-1">
                      ou <strong>{calcTurbo.vazaoBicoMlMin.toFixed(0)} mL/min</strong> em cada ponta
                    </p>
                  </div>

                  {/* Métricas Secundárias */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Velocidade do Trator
                      </span>
                      <p className="font-display text-lg font-bold text-foreground mt-0.5">
                        {calcTurbo.velKmH.toFixed(2)} <span className="text-xs font-normal">km/h</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {calcTurbo.velMS.toFixed(2)} m/s
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Vazão Total da Bomba
                      </span>
                      <p className="font-display text-lg font-bold text-primary mt-0.5">
                        {calcTurbo.vazaoTotal.toFixed(2)} <span className="text-xs font-normal">L/min</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        todos os {turboBicos} bicos
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Rendimento Operacional
                      </span>
                      <p className="font-display text-lg font-bold text-gold mt-0.5">
                        {calcTurbo.rendimentoHaH.toFixed(2)} <span className="text-xs font-normal">ha/h</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        capacidade de campo
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Tempo Médio por Hectare
                      </span>
                      <p className="font-display text-lg font-bold text-foreground mt-0.5">
                        {calcTurbo.tempoMinPorHa.toFixed(0)} <span className="text-xs font-normal">min/ha</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        tempo efetivo de pulverização
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 border-t border-border flex gap-2">
                    <Button
                      onClick={copiarRelatorio}
                      className="flex-1 bg-gold text-[#071e11] hover:bg-[#e2bd5d] font-bold text-xs gap-1.5 h-10 rounded-xl"
                    >
                      {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiado ? "Copiado!" : "Copiar Relatório Técnico"}
                    </Button>
                  </div>
                </div>

                {/* Fórmula Agronômica Explicada */}
                <div className="panel p-4 text-xs space-y-2 bg-card/60">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <HelpCircle className="size-3.5 text-gold" /> Fórmula Utilizada (Turboatomizador)
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground bg-muted/60 p-2 rounded-lg leading-relaxed">
                    Vazão por bico (L/min) = [Volume (L/ha) × Espaçamento (m) × Velocidade (km/h)] ÷ [600 × N° Bicos]
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* 2. ABA PULVERIZADOR DE BARRA */}
          {/* ============================================================ */}
          <TabsContent value="barra" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Coluna 1: Entradas */}
              <div className="panel p-6 space-y-5 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-gold/15 text-gold">
                      <Wheat className="size-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-base font-bold text-foreground">
                        Pulverizador de Barra (Milho, Soja e Cereais)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Calibração de bicos espaçados em barra para grandes culturas
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBarraEspacamento("50");
                      setBarraVolumeHa("150");
                      setBarraDistancia("50");
                      setBarraTempo("30");
                      setBarraTotalBicos("36");
                      toast.info("Valores padrão restaurados.");
                    }}
                    className="text-xs text-muted-foreground gap-1 hover:text-foreground h-8"
                  >
                    <RotateCcw className="size-3" /> Padrão
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="barra-esp" className="text-xs font-semibold flex items-center justify-between">
                      <span>Espaçamento entre Bicos na Barra</span>
                      <span className="text-[10px] text-muted-foreground font-normal">centímetros (cm)</span>
                    </Label>
                    <Input
                      id="barra-esp"
                      type="number"
                      step="5"
                      min="20"
                      value={barraEspacamento}
                      onChange={(e) => setBarraEspacamento(e.target.value)}
                      placeholder="Ex: 50"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Distância padrão entre bicos (normalmente 50 cm)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="barra-vol" className="text-xs font-semibold flex items-center justify-between">
                      <span>Volume de Calda Desejado</span>
                      <span className="text-[10px] text-muted-foreground font-normal">L/ha</span>
                    </Label>
                    <Input
                      id="barra-vol"
                      type="number"
                      step="10"
                      min="30"
                      value={barraVolumeHa}
                      onChange={(e) => setBarraVolumeHa(e.target.value)}
                      placeholder="Ex: 150"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Taxa de aplicação recomendada (ex: 100 a 200 L/ha)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="barra-dist" className="text-xs font-semibold flex items-center justify-between">
                      <span>Distância Percorrida pelo Trator</span>
                      <span className="text-[10px] text-muted-foreground font-normal">metros (m)</span>
                    </Label>
                    <Input
                      id="barra-dist"
                      type="number"
                      step="5"
                      min="10"
                      value={barraDistancia}
                      onChange={(e) => setBarraDistancia(e.target.value)}
                      placeholder="Ex: 50"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Trecho marcado na área de trabalho (ex: 50m)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="barra-tempo" className="text-xs font-semibold flex items-center justify-between">
                      <span>Tempo do Trator no Trecho</span>
                      <span className="text-[10px] text-muted-foreground font-normal">segundos (s)</span>
                    </Label>
                    <Input
                      id="barra-tempo"
                      type="number"
                      step="0.5"
                      min="1"
                      value={barraTempo}
                      onChange={(e) => setBarraTempo(e.target.value)}
                      placeholder="Ex: 30"
                      className="font-mono text-sm font-bold text-gold"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Cronometrado no terreno com o tanque abastecido
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="barra-total" className="text-xs font-semibold flex items-center justify-between">
                      <span>Total de Bicos na Barra (Opcional)</span>
                      <span className="text-[10px] text-muted-foreground font-normal">bicos</span>
                    </Label>
                    <Input
                      id="barra-total"
                      type="number"
                      step="1"
                      min="1"
                      value={barraTotalBicos}
                      onChange={(e) => setBarraTotalBicos(e.target.value)}
                      placeholder="Ex: 36 bicos (barra de 18m)"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Utilizado para calcular a largura total da barra e vazão do conjunto
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Resultados Barra */}
              <div className="space-y-4 lg:col-span-5">
                <div className="panel p-6 space-y-5 bg-gradient-to-br from-card to-secondary/30 border-gold/40 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="size-5 text-gold" />
                      <h3 className="font-display text-base font-bold text-foreground">
                        Resultado da Calibração
                      </h3>
                    </div>
                    <Badge variant="outline" className="border-gold/50 text-gold bg-gold/10 font-mono text-xs">
                      {calcBarra.velKmH.toFixed(2)} km/h
                    </Badge>
                  </div>

                  {/* Card de Destaque da Vazão por Bico */}
                  <div className="rounded-2xl border border-gold/50 bg-[#071e11] p-5 text-center text-white space-y-1 shadow-inner">
                    <span className="text-[11px] uppercase tracking-wider text-gold font-bold">
                      Vazão Nominal por Ponta / Bico
                    </span>
                    <p className="font-display text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
                      {calcBarra.vazaoBico.toFixed(3)}{" "}
                      <span className="text-sm font-normal text-emerald-100">L/min</span>
                    </p>
                    <p className="text-xs text-emerald-100/80 font-mono pt-1">
                      ou <strong>{calcBarra.vazaoBicoMlMin.toFixed(0)} mL/min</strong> em cada ponta
                    </p>
                  </div>

                  {/* Métricas Secundárias */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Velocidade do Trator
                      </span>
                      <p className="font-display text-lg font-bold text-foreground mt-0.5">
                        {calcBarra.velKmH.toFixed(2)} <span className="text-xs font-normal">km/h</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {calcBarra.velMS.toFixed(2)} m/s
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Largura da Barra
                      </span>
                      <p className="font-display text-lg font-bold text-primary mt-0.5">
                        {calcBarra.larguraBarraM > 0 ? `${calcBarra.larguraBarraM.toFixed(1)} m` : "—"}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {barraTotalBicos} bicos a {barraEspacamento}cm
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Vazão Total da Barra
                      </span>
                      <p className="font-display text-lg font-bold text-gold mt-0.5">
                        {calcBarra.vazaoTotal > 0 ? `${calcBarra.vazaoTotal.toFixed(1)} L/min` : "—"}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        fluxo total da barra
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Rendimento de Campo
                      </span>
                      <p className="font-display text-lg font-bold text-foreground mt-0.5">
                        {calcBarra.rendimentoHaH > 0 ? `${calcBarra.rendimentoHaH.toFixed(1)} ha/h` : "—"}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        capacidade de trabalho
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex gap-2">
                    <Button
                      onClick={copiarRelatorio}
                      className="flex-1 bg-gold text-[#071e11] hover:bg-[#e2bd5d] font-bold text-xs gap-1.5 h-10 rounded-xl"
                    >
                      {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiado ? "Copiado!" : "Copiar Relatório Técnico"}
                    </Button>
                  </div>
                </div>

                {/* Fórmula Agronômica Explicada */}
                <div className="panel p-4 text-xs space-y-2 bg-card/60">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <HelpCircle className="size-3.5 text-gold" /> Fórmula Utilizada (Pulverizador de Barra)
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground bg-muted/60 p-2 rounded-lg leading-relaxed">
                    Vazão por bico (L/min) = [Volume (L/ha) × Espaçamento (cm) × Velocidade (km/h)] ÷ 60.000
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* 3. ABA APLICADOR DE HERBICIDA */}
          {/* ============================================================ */}
          <TabsContent value="herbicida" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Coluna 1: Entradas */}
              <div className="panel p-6 space-y-5 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-gold/15 text-gold">
                      <Tractor className="size-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-base font-bold text-foreground">
                        Aplicador de Herbicida (Faixa Dirigida / Barra Lateral)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Calibração para aplicação em faixa ou dessecação direcionada
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHerbFaixa("1.5");
                      setHerbVolumeHa("200");
                      setHerbDistancia("50");
                      setHerbTempo("36");
                      setHerbBicos("2");
                      toast.info("Valores padrão restaurados.");
                    }}
                    className="text-xs text-muted-foreground gap-1 hover:text-foreground h-8"
                  >
                    <RotateCcw className="size-3" /> Padrão
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="herb-faixa" className="text-xs font-semibold flex items-center justify-between">
                      <span>Faixa de Aplicação do Bico</span>
                      <span className="text-[10px] text-muted-foreground font-normal">metros (m)</span>
                    </Label>
                    <Input
                      id="herb-faixa"
                      type="number"
                      step="0.1"
                      min="0.2"
                      value={herbFaixa}
                      onChange={(e) => setHerbFaixa(e.target.value)}
                      placeholder="Ex: 1.5"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Largura da faixa tratada (ex: 1.0m a 2.0m sob a saia do cafeeiro)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="herb-vol" className="text-xs font-semibold flex items-center justify-between">
                      <span>Volume de Aplicação Desejado</span>
                      <span className="text-[10px] text-muted-foreground font-normal">L/ha</span>
                    </Label>
                    <Input
                      id="herb-vol"
                      type="number"
                      step="10"
                      min="50"
                      value={herbVolumeHa}
                      onChange={(e) => setHerbVolumeHa(e.target.value)}
                      placeholder="Ex: 200"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Volume por hectare na área tratada (ex: 150 a 300 L/ha)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="herb-dist" className="text-xs font-semibold flex items-center justify-between">
                      <span>Distância Percorrida pelo Trator</span>
                      <span className="text-[10px] text-muted-foreground font-normal">metros (m)</span>
                    </Label>
                    <Input
                      id="herb-dist"
                      type="number"
                      step="5"
                      min="10"
                      value={herbDistancia}
                      onChange={(e) => setHerbDistancia(e.target.value)}
                      placeholder="Ex: 50"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Trecho marcado na linha (padrão: 50m)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="herb-tempo" className="text-xs font-semibold flex items-center justify-between">
                      <span>Tempo do Trator no Trecho</span>
                      <span className="text-[10px] text-muted-foreground font-normal">segundos (s)</span>
                    </Label>
                    <Input
                      id="herb-tempo"
                      type="number"
                      step="0.5"
                      min="1"
                      value={herbTempo}
                      onChange={(e) => setHerbTempo(e.target.value)}
                      placeholder="Ex: 36"
                      className="font-mono text-sm font-bold text-gold"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Tempo em segundos cronometrado no campo
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="herb-bicos" className="text-xs font-semibold flex items-center justify-between">
                      <span>Número de Bicos na Faixa</span>
                      <span className="text-[10px] text-muted-foreground font-normal">quantidade</span>
                    </Label>
                    <Input
                      id="herb-bicos"
                      type="number"
                      step="1"
                      min="1"
                      value={herbBicos}
                      onChange={(e) => setHerbBicos(e.target.value)}
                      placeholder="Ex: 2"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground block">
                      Quantidade de pontas que cobrem essa faixa (normalmente 1 ou 2 bicos leque/martelo)
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Resultados Herbicida */}
              <div className="space-y-4 lg:col-span-5">
                <div className="panel p-6 space-y-5 bg-gradient-to-br from-card to-secondary/30 border-gold/40 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="size-5 text-gold" />
                      <h3 className="font-display text-base font-bold text-foreground">
                        Resultado da Calibração
                      </h3>
                    </div>
                    <Badge variant="outline" className="border-gold/50 text-gold bg-gold/10 font-mono text-xs">
                      {calcHerb.velKmH.toFixed(2)} km/h
                    </Badge>
                  </div>

                  {/* Card de Destaque da Vazão por Bico */}
                  <div className="rounded-2xl border border-gold/50 bg-[#071e11] p-5 text-center text-white space-y-1 shadow-inner">
                    <span className="text-[11px] uppercase tracking-wider text-gold font-bold">
                      Vazão por Bico / Ponta
                    </span>
                    <p className="font-display text-3xl sm:text-4xl font-extrabold text-gold tracking-tight">
                      {calcHerb.vazaoBico.toFixed(3)}{" "}
                      <span className="text-sm font-normal text-emerald-100">L/min</span>
                    </p>
                    <p className="text-xs text-emerald-100/80 font-mono pt-1">
                      ou <strong>{calcHerb.vazaoBicoMlMin.toFixed(0)} mL/min</strong> por bico
                    </p>
                  </div>

                  {/* Métricas Secundárias */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Velocidade do Trator
                      </span>
                      <p className="font-display text-lg font-bold text-foreground mt-0.5">
                        {calcHerb.velKmH.toFixed(2)} <span className="text-xs font-normal">km/h</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {calcHerb.velMS.toFixed(2)} m/s
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Vazão Total da Barra Lateral
                      </span>
                      <p className="font-display text-lg font-bold text-primary mt-0.5">
                        {calcHerb.vazaoTotal.toFixed(2)} <span className="text-xs font-normal">L/min</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {herbBicos} bicos na faixa
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Rendimento Operacional
                      </span>
                      <p className="font-display text-lg font-bold text-gold mt-0.5">
                        {calcHerb.rendimentoHaH.toFixed(2)} <span className="text-xs font-normal">ha/h</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        faixa de {herbFaixa}m
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-card/80 p-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Tempo Médio por Hectare
                      </span>
                      <p className="font-display text-lg font-bold text-foreground mt-0.5">
                        {calcHerb.tempoMinPorHa.toFixed(0)} <span className="text-xs font-normal">min/ha</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        área tratada
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex gap-2">
                    <Button
                      onClick={copiarRelatorio}
                      className="flex-1 bg-gold text-[#071e11] hover:bg-[#e2bd5d] font-bold text-xs gap-1.5 h-10 rounded-xl"
                    >
                      {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copiado ? "Copiado!" : "Copiar Relatório Técnico"}
                    </Button>
                  </div>
                </div>

                {/* Fórmula Agronômica Explicada */}
                <div className="panel p-4 text-xs space-y-2 bg-card/60">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <HelpCircle className="size-3.5 text-gold" /> Fórmula Utilizada (Aplicador de Herbicida)
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground bg-muted/60 p-2 rounded-lg leading-relaxed">
                    Vazão (L/min) = [Volume (L/ha) × Faixa (m) × Velocidade (km/h)] ÷ 600
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Guia Técnico de Cores e Pontas ISO */}
        <section className="panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5">
              <Zap className="size-5 text-gold" />
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Guia Rápido de Pontas de Pulverização (Norma ISO 10625)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Identificação das cores de bicos e faixas de vazão a 3 bar (43.5 PSI) de pressão
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {[
              { cor: "Laranja (01)", vazao: "0.40 L/min", hex: "#f97316", pressao: "3 bar" },
              { cor: "Verde (015)", vazao: "0.60 L/min", hex: "#22c55e", pressao: "3 bar" },
              { cor: "Amarelo (02)", vazao: "0.80 L/min", hex: "#eab308", pressao: "3 bar" },
              { cor: "Azul (03)", vazao: "1.20 L/min", hex: "#3b82f6", pressao: "3 bar" },
              { cor: "Vermelho (04)", vazao: "1.60 L/min", hex: "#ef4444", pressao: "3 bar" },
              { cor: "Marrom (05)", vazao: "2.00 L/min", hex: "#854d0e", pressao: "3 bar" },
            ].map((ponta) => (
              <div key={ponta.cor} className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-center">
                <span
                  className="inline-block size-4 rounded-full shadow-xs mx-auto"
                  style={{ backgroundColor: ponta.hex }}
                />
                <p className="text-xs font-bold text-foreground">{ponta.cor}</p>
                <p className="font-display text-sm font-bold text-gold">{ponta.vazao}</p>
                <p className="text-[10px] text-muted-foreground">{ponta.pressao}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
