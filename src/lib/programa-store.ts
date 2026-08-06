import raw2026 from "@/data/programa2026.json";

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

export type ProgramaData = {
  versao?: string;
  atualizadoEm?: string;
  cafe: ProdutoCafe[];
  milhoSoja: ProdutoMilhoSoja[];
  foliar: ItemFoliar[];
  nutrientes: Nutriente[];
  calendarioAdulto: JanelaCalendario[];
  calendarioFormacao: JanelaCalendario[];
};

const STORAGE_KEY = "guia_agronomico_programa_data";

export function obterProgramaAtual(): ProgramaData {
  if (typeof window !== "undefined") {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed && Array.isArray(parsed.cafe)) {
          return parsed as ProgramaData;
        }
      }
    } catch (e) {
      console.warn("[Programa Store] Erro ao ler dataset do localStorage:", e);
    }
  }
  return raw2026 as unknown as ProgramaData;
}

export function salvarProgramaAtual(novoPrograma: ProgramaData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novoPrograma));
    window.dispatchEvent(new Event("storage_programa_atualizado"));
  }
}

export function restaurarProgramaPadrao() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("storage_programa_atualizado"));
  }
}
