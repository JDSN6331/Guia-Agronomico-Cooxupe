import type { ProgramaData } from "./programa-store";

export function exportarProgramaParaExcel(programa: ProgramaData, nomeArquivoCustomizado?: string) {
  const BOM = "\uFEFF";
  const sep = ";";

  const escapeCSV = (val?: string | number | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const linhas: string[] = [];

  // Seção 1: CATÁLOGO CAFÉ
  linhas.push("PROGRAMA DE MANEJO AGROBASE - CATÁLOGO CAFÉ");
  linhas.push(
    [
      "ID",
      "Produto",
      "Ingrediente Ativo",
      "Fornecedor",
      "Grupo",
      "Família",
      "Dosagem Viveiro",
      "Dosagem Plantio",
      "Dosagem 1 Ano / Recepa",
      "Dosagem Em Produção",
      "Dosagem Esqueletado / Decotado",
      "Função Agronômica",
      "Instruções de Aplicação",
      "Carência (Dias)",
    ]
      .map(escapeCSV)
      .join(sep),
  );

  (programa.cafe || []).forEach((c) => {
    linhas.push(
      [
        c.id,
        c.produto,
        c.ingrediente,
        c.fornecedor,
        c.grupo,
        c.familia,
        c.dosagens?.["Viveiro"],
        c.dosagens?.["Plantio"],
        c.dosagens?.["1 ano / Recepa"],
        c.dosagens?.["Em Produção"],
        c.dosagens?.["Esqueletado / Decotado"],
        c.funcao,
        c.instrucoes,
        c.carencia,
      ]
        .map(escapeCSV)
        .join(sep),
    );
  });

  linhas.push("");
  linhas.push("");

  // Seção 2: MILHO E SOJA
  linhas.push("PROGRAMA DE MANEJO AGROBASE - MILHO E SOJA");
  linhas.push(
    [
      "ID",
      "Produto",
      "Cultura",
      "Fornecedor",
      "Grupo",
      "Família",
      "Dosagem",
      "Composição / Ingrediente",
      "Função Agronômica",
      "Instruções de Aplicação",
      "Carência (Dias)",
    ]
      .map(escapeCSV)
      .join(sep),
  );

  (programa.milhoSoja || []).forEach((ms) => {
    linhas.push(
      [
        ms.id,
        ms.produto,
        ms.cultura,
        ms.fornecedor,
        ms.grupo,
        ms.familia,
        ms.dosagem,
        ms.composicao,
        ms.funcao,
        ms.instrucoes,
        ms.carencia,
      ]
        .map(escapeCSV)
        .join(sep),
    );
  });

  const content = BOM + linhas.join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivoCustomizado || `Programa_Manejo_AgroBase_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
