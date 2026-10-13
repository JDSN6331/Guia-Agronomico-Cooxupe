import raw from "./programa2026.json";
import { obterProgramaAtual, type ProgramaData } from "@/lib/programa-store";

export type {
  ProdutoCafe,
  ProdutoMilhoSoja,
  Nutriente,
  JanelaCalendario,
  ProgramaData,
} from "@/lib/programa-store";

export const programa: ProgramaData =
  typeof window !== "undefined" ? obterProgramaAtual() : (raw as unknown as ProgramaData);

export const ANO_PROGRAMA = 2026;

export function unicos(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export function normalizar(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function buscaEm(termo: string, campos: (string | undefined)[]): boolean {
  if (!termo.trim()) return true;
  const alvo = normalizar(campos.filter(Boolean).join(" "));
  return normalizar(termo)
    .split(/\s+/)
    .filter(Boolean)
    .every((palavra) => alvo.includes(palavra));
}

/**
 * Separadores aceitos ao colar uma lista: ponto e vírgula, barra vertical, quebra de linha,
 * tabulação e vírgula seguida de espaço (para não quebrar números como "1,5").
 */
const SEPARADOR_TERMOS = /[;|\n\r\t]+|,(?=\s|$)/;

/** Quebra um texto digitado/colado em termos individuais, sem vazios nem repetidos. */
export function separarTermos(texto: string): string[] {
  const vistos = new Set<string>();
  const termos: string[] = [];
  for (const parte of texto.split(SEPARADOR_TERMOS)) {
    const termo = parte.trim().replace(/\s+/g, " ");
    const chave = normalizar(termo);
    if (!termo || vistos.has(chave)) continue;
    vistos.add(chave);
    termos.push(termo);
  }
  return termos;
}

/** Une termos já confirmados com o texto em digitação, ignorando repetições. */
export function termosEfetivos(termos: string[], digitando: string): string[] {
  return separarTermos([...termos, digitando].join(";"));
}

/**
 * Busca com vários termos: o item é encontrado se casar com QUALQUER um deles (OU).
 * Dentro de cada termo, todas as palavras precisam aparecer (E), como em `buscaEm`.
 * Sem termos, tudo é considerado encontrado.
 */
export function buscaMultipla(termos: string[], campos: (string | undefined)[]): boolean {
  if (termos.length === 0) return true;
  return termos.some((termo) => buscaEm(termo, campos));
}

/** Retorna quais termos casam com o item (usado para contagem e para a coluna do export). */
export function termosQueCasam(termos: string[], campos: (string | undefined)[]): string[] {
  return termos.filter((termo) => buscaEm(termo, campos));
}

export const totais = {
  cafe: programa.cafe?.length || 0,
  milhoSoja: programa.milhoSoja?.length || 0,
  janelas: (programa.calendarioAdulto?.length || 0) + (programa.calendarioFormacao?.length || 0),
};
