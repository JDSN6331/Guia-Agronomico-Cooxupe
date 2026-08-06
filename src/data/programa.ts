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

export const totais = {
  cafe: programa.cafe?.length || 0,
  milhoSoja: programa.milhoSoja?.length || 0,
  janelas: (programa.calendarioAdulto?.length || 0) + (programa.calendarioFormacao?.length || 0),
};
