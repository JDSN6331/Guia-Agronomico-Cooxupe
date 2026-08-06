import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programa } from "@/data/programa";
import { FlaticonCalculator, FlaticonTankMix } from "@/components/flaticon-icons";
import { Calculator, CheckCircle2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora de Dosagem | AgroBase" },
      {
        name: "description",
        content:
          "Calcule a quantidade total de produto comercial, volume de calda e reabastecimentos de pulverizador por hectare ou talhão.",
      },
    ],
  }),
  component: PaginaCalculadora,
});

function PaginaCalculadora() {
  const [tipoCultura, setTipoCultura] = useState<"cafe" | "milhoSoja">("cafe");
  const [produtoId, setProdutoId] = useState<string>("");
  const [areaHectares, setAreaHectares] = useState<string>("10");
  const [dosagemPorHa, setDosagemPorHa] = useState<string>("0.75");
  const [volumeCaldaPorHa, setVolumeCaldaPorHa] = useState<string>("400");
  const [capacidadeTanque, setCapacidadeTanque] = useState<string>("2000");

  const listaProdutos = useMemo(() => {
    if (tipoCultura === "cafe") {
      return programa.cafe.map((p) => ({
        id: p.id,
        nome: p.produto,
        fornecedor: p.fornecedor,
        grupo: p.grupo,
      }));
    }
    return programa.milhoSoja.map((p) => ({
      id: p.id,
      nome: p.produto,
      fornecedor: p.fornecedor,
      grupo: p.grupo,
    }));
  }, [tipoCultura]);

  // Atualiza dosagem padrão ao selecionar produto
  function aoSelecionarProduto(id: string) {
    setProdutoId(id);
    if (tipoCultura === "cafe") {
      const prod = programa.cafe.find((p) => p.id === id);
      if (prod) {
        const d = prod.dosagens["Em Produção"] || Object.values(prod.dosagens)[0];
        if (d) {
          const num = parseFloat(d.replace(",", "."));
          if (!isNaN(num)) setDosagemPorHa(num.toString());
        }
      }
    } else {
      const prod = programa.milhoSoja.find((p) => p.id === id);
      if (prod && prod.dosagem) {
        const num = parseFloat(prod.dosagem.replace(",", "."));
        if (!isNaN(num)) setDosagemPorHa(num.toString());
      }
    }
  }

  // Cálculos matemáticos
  const ha = parseFloat(areaHectares) || 0;
  const dosagem = parseFloat(dosagemPorHa) || 0;
  const caldaHa = parseFloat(volumeCaldaPorHa) || 0;
  const tanque = parseFloat(capacidadeTanque) || 1;

  const produtoTotal = ha * dosagem;
  const caldaTotal = ha * caldaHa;
  const tanquesTotais = caldaTotal / tanque;
  const produtoPorTanque = tanque > 0 ? (produtoTotal / (caldaTotal || 1)) * tanque : 0;

  function limpar() {
    setProdutoId("");
    setAreaHectares("10");
    setDosagemPorHa("0.75");
    setVolumeCaldaPorHa("400");
    setCapacidadeTanque("2000");
  }

  return (
    <AppShell
      titulo="Calculadora Agronômica"
      descricao="Dimensionamento de produto comercial, calda total e abastecimentos de pulverizador"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Formulário de entrada */}
          <section className="panel space-y-5 p-6 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FlaticonCalculator size={20} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold">Dados de Aplicação</h2>
                  <p className="text-xs text-muted-foreground">Preencha as métricas do talhão</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={limpar} className="text-xs">
                <RotateCcw className="mr-1.5 size-3.5" /> Limpar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cultura</Label>
                  <Select
                    value={tipoCultura}
                    onValueChange={(v) => {
                      setTipoCultura(v as "cafe" | "milhoSoja");
                      setProdutoId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cafe">Café</SelectItem>
                      <SelectItem value="milhoSoja">Milho & Soja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Produto do Programa</Label>
                  <Select value={produtoId} onValueChange={aoSelecionarProduto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {listaProdutos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} {p.fornecedor ? `(${p.fornecedor})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="area">Área a aplicar (Hectares - ha)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    min="0"
                    value={areaHectares}
                    onChange={(e) => setAreaHectares(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosagem">Dosagem por Hectare (L ou kg/ha)</Label>
                  <Input
                    id="dosagem"
                    type="number"
                    step="0.01"
                    min="0"
                    value={dosagemPorHa}
                    onChange={(e) => setDosagemPorHa(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calda">Volume de Calda (L/ha)</Label>
                  <Input
                    id="calda"
                    type="number"
                    step="10"
                    min="0"
                    value={volumeCaldaPorHa}
                    onChange={(e) => setVolumeCaldaPorHa(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanque">Capacidade do Tanque (Litros)</Label>
                  <Select value={capacidadeTanque} onValueChange={setCapacidadeTanque}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="600">600 L (Pulverizador de Barras Peq.)</SelectItem>
                      <SelectItem value="800">800 L (Turbina Ar / Café)</SelectItem>
                      <SelectItem value="2000">2.000 L (Tratorado Médio/Grande)</SelectItem>
                      <SelectItem value="3000">3.000 L (Autopropelido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Resultado dos cálculos */}
          <section className="panel flex flex-col justify-between space-y-6 bg-primary/5 p-6 border-primary/20 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="size-5" />
                <h3 className="font-display text-lg font-bold">Resultado do Cálculo</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Resumo de insumos para a área total de <strong>{ha} ha</strong>
              </p>

              <dl className="mt-6 space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total de Produto Comercial
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-primary">
                    {produtoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-base font-normal">L ou kg</span>
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3.5">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Volume Total Calda
                    </dt>
                    <dd className="mt-1 font-display text-xl font-bold">
                      {caldaTotal.toLocaleString("pt-BR")} L
                    </dd>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3.5">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Nº de Tanques
                    </dt>
                    <dd className="mt-1 font-display text-xl font-bold">
                      {tanquesTotais.toFixed(1)}{" "}
                      <span className="text-xs font-normal">abastec.</span>
                    </dd>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <FlaticonTankMix size={16} /> Produto por Tanque ({capacidadeTanque}L)
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-bold text-foreground">
                    {produtoPorTanque.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-sm font-normal">L ou kg / tanque</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-card/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
              ⚠️ <strong>Nota agronômica:</strong> Calibre a taxa de aplicação do pulverizador antes
              da operação. Ajuste a dosagem em função da velocidade e vazão de pontas de pulverização.
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
