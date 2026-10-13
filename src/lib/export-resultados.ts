import * as XLSX from "xlsx";
import { toast } from "sonner";
import { copiarTexto, type DadosFichaProduto } from "./share-utils";

/** Item da lista de resultados pronto para exportação. */
export type ItemExportavel = DadosFichaProduto & {
  /** Termos da busca que encontraram este item. */
  encontradoPor?: string[] | undefined;
};

type ContextoExportacao = {
  /** Termos usados na busca (chips). */
  termos: string[];
  /** Rótulo curto usado no nome do arquivo e no título (ex.: "Café"). */
  rotulo: string;
};

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function limpar(valor?: string | null) {
  return valor ? String(valor).replace(/\.{2,}/g, " ").trim() : "";
}

function textoCarencia(carencia?: string) {
  const c = limpar(carencia);
  if (!c) return "";
  return c.toLowerCase().includes("dias") ? c : `${c} dias`;
}

function escaparHtml(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Exporta todos os resultados da busca diretamente em uma planilha Excel nativa (.xlsx).
 */
export function exportarResultadosExcel(itens: ItemExportavel[], ctx: ContextoExportacao) {
  if (itens.length === 0) {
    toast.error("Não há resultados para exportar.");
    return;
  }

  // Colunas de dosagem por estágio: união das chaves, na ordem em que aparecem.
  const estagios: string[] = [];
  for (const item of itens) {
    for (const est of Object.keys(item.dosagens ?? {})) {
      if (!estagios.includes(est)) estagios.push(est);
    }
  }
  const temDosagemUnica = itens.some((i) => Boolean(i.dosagemUnica));
  const temTermos = ctx.termos.length > 0;

  const linhas = itens.map((i) => {
    const row: Record<string, string> = {
      Cultura: i.cultura || "",
      Produto: i.titulo || "",
      "Ingrediente Ativo / Composição": limpar(i.ingrediente),
      Fornecedor: limpar(i.fornecedor),
      Grupo: limpar(i.grupo),
      "Família": limpar(i.familia),
    };

    for (const est of estagios) {
      row[`Dosagem ${est}`] = i.dosagens?.[est] || "";
    }
    if (temDosagemUnica) {
      row["Dosagem"] = i.dosagemUnica || "";
    }

    row["Função Agronômica"] = limpar(i.funcao);
    row["Instruções de Aplicação"] = limpar(i.instrucoes);
    row["Carência"] = textoCarencia(i.carencia);
    if (temTermos) {
      row["Termos da busca encontrados"] = (i.encontradoPor ?? []).join(" | ");
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(linhas);

  if (linhas.length > 0) {
    worksheet["!cols"] = Object.keys(linhas[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...linhas.map((r) => String((r as any)[key] || "").length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 48) };
    });
  }

  const workbook = XLSX.utils.book_new();
  const nomeAba = (ctx.rotulo || "Produtos").slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, nomeAba);

  const nomeArquivo = `Resultados_${semAcento(ctx.rotulo) || "Busca"}_${dataHoje()}.xlsx`;
  XLSX.writeFile(workbook, nomeArquivo);
  toast.success(`${itens.length} ${itens.length === 1 ? "item exportado" : "itens exportados"} para Excel (.xlsx).`);
}

function formatarItemTexto(p: ItemExportavel): string {
  const linhas: string[] = [`📌 *${p.titulo}*`];
  if (p.cultura) linhas.push(`🌾 Cultura: ${p.cultura}`);
  if (p.ingrediente) linhas.push(`🧪 Ingrediente Ativo: ${limpar(p.ingrediente)}`);
  if (p.fornecedor) linhas.push(`🏢 Fornecedor: ${limpar(p.fornecedor)}`);
  if (p.grupo) linhas.push(`🏷️ Grupo: ${limpar(p.grupo)}`);
  if (p.familia) linhas.push(`📁 Família: ${limpar(p.familia)}`);

  if (p.dosagens && Object.keys(p.dosagens).length > 0) {
    linhas.push("📊 Dosagem por estágio:");
    for (const [estagio, valor] of Object.entries(p.dosagens)) linhas.push(`   • ${estagio}: ${valor}`);
  } else if (p.dosagemUnica) {
    linhas.push(`📊 Dosagem: ${p.dosagemUnica}`);
  }

  if (p.funcao) linhas.push(`🎯 Função: ${limpar(p.funcao)}`);
  if (p.instrucoes) linhas.push(`📝 Instruções: ${limpar(p.instrucoes)}`);
  const carencia = textoCarencia(p.carencia);
  if (carencia) linhas.push(`⏳ Carência: ${carencia}`);
  return linhas.join("\n");
}

/**
 * Copia todos os resultados como texto único (para colar em e-mail, WhatsApp Web, Word...).
 */
export async function copiarResultados(itens: ItemExportavel[], ctx: ContextoExportacao) {
  if (itens.length === 0) {
    toast.error("Não há resultados para copiar.");
    return;
  }
  const cabecalho = [
    `🌱 *GUIA AGRONÔMICO AGROBASE - ${ctx.rotulo.toUpperCase()}*`,
    `${itens.length} ${itens.length === 1 ? "resultado" : "resultados"}` +
      (ctx.termos.length > 0 ? ` para: ${ctx.termos.join(" | ")}` : ""),
  ].join("\n");
  const rodape = "_Consulte sempre a bula oficial e o receituário agronômico._";
  const texto = [cabecalho, ...itens.map(formatarItemTexto), rodape].join("\n\n──────────\n\n");

  const ok = await copiarTexto(texto);
  if (ok) toast.success(`${itens.length} ${itens.length === 1 ? "ficha copiada" : "fichas copiadas"}!`);
  else toast.error("Não foi possível copiar o texto automaticamente.");
}

/**
 * Abre um documento único com todas as fichas e aciona a impressão (permite salvar em PDF).
 */
export function imprimirResultados(itens: ItemExportavel[], ctx: ContextoExportacao) {
  if (itens.length === 0) {
    toast.error("Não há resultados para imprimir.");
    return;
  }
  const janela = window.open("", "_blank");
  if (!janela) {
    toast.error("Permita pop-ups no navegador para imprimir os resultados.");
    return;
  }

  const campo = (rotulo: string, valor?: string) =>
    valor ? `<div class="campo"><span class="rot">${escaparHtml(rotulo)}</span><span>${escaparHtml(valor)}</span></div>` : "";

  const fichas = itens
    .map((p) => {
      const carencia = textoCarencia(p.carencia);
      const dosagens =
        p.dosagens && Object.keys(p.dosagens).length > 0
          ? `<div class="campo"><span class="rot">Dosagem por estágio</span><ul>${Object.entries(p.dosagens)
              .map(([e, v]) => `<li><strong>${escaparHtml(e)}:</strong> ${escaparHtml(v)}</li>`)
              .join("")}</ul></div>`
          : campo("Dosagem", p.dosagemUnica);

      return `
        <section class="ficha">
          <h2>${escaparHtml(p.titulo)}</h2>
          <div class="tags">
            ${p.cultura ? `<span class="tag">${escaparHtml(p.cultura)}</span>` : ""}
            ${p.grupo ? `<span class="tag">${escaparHtml(limpar(p.grupo))}</span>` : ""}
            ${p.familia ? `<span class="tag azul">${escaparHtml(limpar(p.familia))}</span>` : ""}
            ${carencia ? `<span class="tag ouro">Carência: ${escaparHtml(carencia)}</span>` : ""}
          </div>
          ${campo("Ingrediente ativo / composição", limpar(p.ingrediente))}
          ${campo("Fornecedor", limpar(p.fornecedor))}
          ${dosagens}
          ${campo("Função agronômica", limpar(p.funcao))}
          ${campo("Instruções de aplicação", limpar(p.instrucoes))}
        </section>`;
    })
    .join("");

  const termos =
    ctx.termos.length > 0
      ? `<p class="sub">Termos pesquisados: ${ctx.termos.map((t) => `<span class="tag">${escaparHtml(t)}</span>`).join(" ")}</p>`
      : "";

  janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Resultados - ${escaparHtml(ctx.rotulo)} - AgroBase</title>
  <style>
    body { font-family: sans-serif; margin: 28px; color: #1a2e22; line-height: 1.45; }
    .header { border-bottom: 2px solid #235839; padding-bottom: 12px; margin-bottom: 18px; }
    .logo { font-size: 20px; font-weight: bold; color: #235839; }
    .sub { font-size: 12px; color: #555; margin: 6px 0 0; }
    .ficha { border: 1px solid #e1e9e3; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid; background: #f9fbf9; }
    h2 { font-size: 16px; margin: 0 0 6px; color: #111; }
    .tags { margin-bottom: 8px; }
    .tag { display: inline-block; background: #e8f3ed; color: #235839; padding: 2px 9px; border-radius: 10px; font-size: 11px; font-weight: bold; margin: 0 4px 4px 0; }
    .tag.azul { background: #e3f2fd; color: #0d47a1; }
    .tag.ouro { background: #fff3e0; color: #b78103; }
    .campo { font-size: 12.5px; margin-top: 5px; }
    .rot { display: block; font-size: 10.5px; text-transform: uppercase; color: #666; font-weight: bold; }
    ul { margin: 2px 0 0; padding-left: 18px; }
    .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 11px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🌱 Guia Agronômico AgroBase — ${escaparHtml(ctx.rotulo)}</div>
    <p class="sub">${itens.length} ${itens.length === 1 ? "resultado" : "resultados"} · emitido em ${new Date().toLocaleDateString("pt-BR")}</p>
    ${termos}
  </div>
  ${fichas}
  <div class="footer">Uso interno do time de Desenvolvimento Técnico. Consulte sempre a bula oficial e o receituário agronômico.</div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  janela.document.close();
}
