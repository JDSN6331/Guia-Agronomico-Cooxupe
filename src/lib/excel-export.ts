import * as XLSX from "xlsx";
import type { ProgramaData } from "./programa-store";

export function exportarProgramaParaExcel(programa: ProgramaData, nomeArquivoCustomizado?: string) {
  const workbook = XLSX.utils.book_new();

  // Aba 1: CATÁLOGO CAFÉ
  const linhasCafe = (programa.cafe || []).map((c) => ({
    ID: c.id,
    Produto: c.produto,
    "Ingrediente Ativo": c.ingrediente || "",
    Fornecedor: c.fornecedor || "",
    Grupo: c.grupo || "",
    "Família": c.familia || "",
    "Dosagem Viveiro": c.dosagens?.["Viveiro"] || "",
    "Dosagem Plantio": c.dosagens?.["Plantio"] || "",
    "Dosagem 1 Ano / Recepa": c.dosagens?.["1 ano / Recepa"] || "",
    "Dosagem Em Produção": c.dosagens?.["Em Produção"] || "",
    "Dosagem Esqueletado / Decotado": c.dosagens?.["Esqueletado / Decotado"] || "",
    "Função Agronômica": c.funcao || "",
    "Instruções de Aplicação": c.instrucoes || "",
    "Carência (Dias)": c.carencia || "",
  }));

  const sheetCafe = XLSX.utils.json_to_sheet(linhasCafe);
  if (linhasCafe.length > 0) {
    sheetCafe["!cols"] = Object.keys(linhasCafe[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...linhasCafe.map((r) => String((r as any)[key] || "").length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 48) };
    });
  }
  XLSX.utils.book_append_sheet(workbook, sheetCafe, "Catálogo Café");

  // Aba 2: MILHO E SOJA
  const linhasMilhoSoja = (programa.milhoSoja || []).map((ms) => ({
    ID: ms.id,
    Produto: ms.produto,
    Cultura: ms.cultura || "",
    Fornecedor: ms.fornecedor || "",
    Grupo: ms.grupo || "",
    "Família": ms.familia || "",
    Dosagem: ms.dosagem || "",
    "Composição / Ingrediente": ms.composicao || "",
    "Função Agronômica": ms.funcao || "",
    "Instruções de Aplicação": ms.instrucoes || "",
    "Carência (Dias)": ms.carencia || "",
  }));

  const sheetMilhoSoja = XLSX.utils.json_to_sheet(linhasMilhoSoja);
  if (linhasMilhoSoja.length > 0) {
    sheetMilhoSoja["!cols"] = Object.keys(linhasMilhoSoja[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...linhasMilhoSoja.map((r) => String((r as any)[key] || "").length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 48) };
    });
  }
  XLSX.utils.book_append_sheet(workbook, sheetMilhoSoja, "Milho e Soja");

  let nomeFinal = nomeArquivoCustomizado || `Programa_Manejo_AgroBase_${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (nomeFinal.endsWith(".csv")) {
    nomeFinal = nomeFinal.replace(/\.csv$/i, ".xlsx");
  } else if (!nomeFinal.endsWith(".xlsx")) {
    nomeFinal = `${nomeFinal}.xlsx`;
  }

  XLSX.writeFile(workbook, nomeFinal);
}
