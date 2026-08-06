import type { ProgramaData } from "./programa-store";

export function exportarProgramaParaExcel(programa: ProgramaData) {
  const BOM = "\uFEFF";
  const sep = ";";

  const escapeCSV = (val?: string | number | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const linhas: string[] = [];

  // Seção 1: CATÁLOGO CAFÉ
  linhas.push("PROGRAMA DE MANEJO COOXUPÉ - CATÁLOGO CAFÉ");
  linhas.push(
    [
      "ID",
      "Produto",
      "Ingrediente Ativo",
      "Fornecedor",
      "Grupo",
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
  linhas.push("PROGRAMA DE MANEJO COOXUPÉ - MILHO E SOJA");
  linhas.push(
    [
      "ID",
      "Produto",
      "Cultura",
      "Fornecedor",
      "Grupo",
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

  linhas.push("");
  linhas.push("");

  // Seção 3: LINHA FOLIAR
  linhas.push("PROGRAMA DE MANEJO COOXUPÉ - LINHA FOLIAR");
  linhas.push(
    ["ID", "Código", "Descrição / Item", "Classe Nutricional", "Fornecedor", "Status"]
      .map(escapeCSV)
      .join(sep),
  );

  (programa.foliar || []).forEach((f) => {
    linhas.push(
      [f.id, f.codigo, f.descricao, f.classe, f.fornecedor, f.status].map(escapeCSV).join(sep),
    );
  });

  const content = BOM + linhas.join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Programa_Manejo_Cooxupe_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
