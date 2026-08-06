import raw2026 from "@/data/programa2026.json";

export type ProdutoCafe = {
  id: string;
  produto: string;
  ingrediente?: string;
  fornecedor?: string;
  grupo?: string;
  familia?: string;
  dosagens: Record<string, string>;
  unidadeFormacao?: string;
  unidadeProducao?: string;
  instrucoes?: string;
  funcao?: string;
  carencia?: string;
};

export type ProdutoMilhoSoja = {
  id: string;
  produto: string;
  fornecedor?: string;
  grupo?: string;
  familia?: string;
  cultura?: string;
  dosagem?: string;
  instrucoes?: string;
  funcao?: string;
  composicao?: string;
  carencia?: string;
};

export type Nutriente = { nutriente: string; produtos: string[] };

export type JanelaCalendario = {
  id: string;
  janela: string;
  descricao: string;
  nota?: string;
  categorias: { categoria: string; produtos: string[] }[];
};

export type VersaoPlanilha = {
  id: string;
  nomeArquivo: string;
  versao: string;
  dataEnvio: string;
  enviadoPor: string;
  totalCafe: number;
  totalMilhoSoja: number;
  dados: ProgramaData;
};

export type ProgramaData = {
  versao?: string;
  atualizadoEm?: string;
  cafe: ProdutoCafe[];
  milhoSoja: ProdutoMilhoSoja[];
  nutrientes: Nutriente[];
  calendarioAdulto: JanelaCalendario[];
  calendarioFormacao: JanelaCalendario[];
  historicoVersoes?: VersaoPlanilha[];
};

const STORAGE_KEY = "guia_agronomico_programa_data";
const HISTORICO_KEY = "guia_agronomico_historico_versoes";

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

export function salvarProgramaAtual(novoPrograma: ProgramaData, nomeArquivo = "Programa de uso 2026.xlsx", usuario = "Administrador") {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novoPrograma));

    // Adicionar registro no histórico
    const historicoAtual = obterHistoricoVersoes();
    const novaVersao: VersaoPlanilha = {
      id: `versao-${Date.now()}`,
      nomeArquivo,
      versao: novoPrograma.versao || `v${Date.now()}`,
      dataEnvio: new Date().toISOString(),
      enviadoPor: usuario,
      totalCafe: novoPrograma.cafe?.length || 0,
      totalMilhoSoja: novoPrograma.milhoSoja?.length || 0,
      dados: novoPrograma,
    };

    const novoHistorico = [novaVersao, ...historicoAtual].slice(0, 20); // guarda até 20 versões
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(novoHistorico));

    window.dispatchEvent(new Event("storage_programa_atualizado"));
  }
}

export function obterHistoricoVersoes(): VersaoPlanilha[] {
  if (typeof window !== "undefined") {
    try {
      const salvo = localStorage.getItem(HISTORICO_KEY);
      if (salvo) {
        return JSON.parse(salvo) as VersaoPlanilha[];
      }
    } catch (e) {
      console.warn("[Programa Store] Erro ao ler histórico:", e);
    }
  }
  return [
    {
      id: "versao-oficial-2026",
      nomeArquivo: "Programa de uso 2026.xlsx",
      versao: "2026.1 (Oficial)",
      dataEnvio: new Date().toISOString(),
      enviadoPor: "Sistema (Oficial)",
      totalCafe: (raw2026 as unknown as ProgramaData).cafe?.length || 0,
      totalMilhoSoja: (raw2026 as unknown as ProgramaData).milhoSoja?.length || 0,
      dados: raw2026 as unknown as ProgramaData,
    },
  ];
}

export function restaurarProgramaPadrao() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("storage_programa_atualizado"));
  }
}
