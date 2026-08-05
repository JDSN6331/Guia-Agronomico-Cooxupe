import raw from "./programa2026.json";

export type ProdutoCafe = {
  id: string;
  produto: string;
  ingrediente?: string;
  fornecedor?: string;
  grupo?: string;
  dosagens: Record<string, string>;
  unidadeFormacao?: string;
  instrucoes?: string;
  funcao?: string;
  carencia?: string;
};

export type ProdutoMilhoSoja = {
  id: string;
  produto: string;
  fornecedor?: string;
  grupo?: string;
  cultura?: string;
  dosagem?: string;
  instrucoes?: string;
  funcao?: string;
  composicao?: string;
  carencia?: string;
};

export type ItemFoliar = {
  id: string;
  codigo?: string;
  descricao: string;
  status?: string;
  fornecedor?: string;
  classe?: string;
};

export type Nutriente = { nutriente: string; produtos: string[] };

export type JanelaCalendario = {
  id: string;
  janela: string;
  descricao: string;
  nota?: string;
  categorias: { categoria: string; produtos: string[] }[];
};

type Programa = {
  cafe: ProdutoCafe[];
  milhoSoja: ProdutoMilhoSoja[];
  foliar: ItemFoliar[];
  nutrientes: Nutriente[];
  calendarioAdulto: JanelaCalendario[];
  calendarioFormacao: JanelaCalendario[];
};

export const programa = raw as unknown as Programa;

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
  cafe: programa.cafe.length,
  milhoSoja: programa.milhoSoja.length,
  foliar: programa.foliar.length,
  janelas: programa.calendarioAdulto.length + programa.calendarioFormacao.length,
};
