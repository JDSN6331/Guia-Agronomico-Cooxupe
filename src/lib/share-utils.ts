import { toast } from "sonner";

export type DadosFichaProduto = {
  titulo: string;
  cultura?: string | undefined;
  ingrediente?: string | undefined;
  fornecedor?: string | undefined;
  grupo?: string | undefined;
  dosagens?: Record<string, string> | undefined;
  dosagemUnica?: string | undefined;
  unidadeFormacao?: string | undefined;
  instrucoes?: string | undefined;
  funcao?: string | undefined;
  carencia?: string | undefined;
};

export function formatarTextoRecomendacao(p: DadosFichaProduto): string {
  const linhas: string[] = [
    `🌱 *RECOMENDAÇÃO TÉCNICA*`,
    `📌 *Produto:* ${p.titulo}`,
  ];

  if (p.cultura) linhas.push(`🌾 *Cultura:* ${p.cultura}`);
  if (p.ingrediente) linhas.push(`🧪 *Ingrediente Ativo:* ${p.ingrediente}`);
  if (p.fornecedor) linhas.push(`🏢 *Fornecedor:* ${p.fornecedor}`);
  if (p.grupo) linhas.push(`🏷️ *Grupo:* ${p.grupo}`);

  if (p.dosagens && Object.keys(p.dosagens).length > 0) {
    linhas.push(`\n📊 *Dosagem por Estágio:*`);
    Object.entries(p.dosagens).forEach(([estagio, valor]) => {
      linhas.push(`• ${estagio}: *${valor}${p.unidadeFormacao ? ` ${p.unidadeFormacao}` : ""}*`);
    });
  } else if (p.dosagemUnica) {
    linhas.push(`📊 *Dosagem:* ${p.dosagemUnica}`);
  }

  if (p.funcao) linhas.push(`\n🎯 *Função Agronômica:* ${p.funcao}`);
  if (p.instrucoes) linhas.push(`📝 *Instruções de Aplicação:* ${p.instrucoes}`);
  if (p.carencia) linhas.push(`⏳ *Carência (Intervalo de Segurança):* ${p.carencia} dias`);

  linhas.push(`\n---\n_Consulte sempre a bula oficial e o receituário agronômico._`);
  return linhas.join("\n");
}

export function compartilharWhatsApp(p: DadosFichaProduto) {
  const texto = formatarTextoRecomendacao(p);
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Função de cópia resiliente que funciona em HTTPS, Localhost e também via HTTP IP (ex: http://172.16.253.34:8082).
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Tenta usar a Clipboard API moderna se disponível (HTTPS / localhost)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // caso o navegador negue permissão por contexto inseguro HTTP IP, continua para o fallback
    }
  }

  // 2. Fallback universal usando elemento textarea temporário (funciona em conexões HTTP IP)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = "fixed";
    textArea.style.top = "-999999px";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textArea);
    return ok;
  } catch (err) {
    console.error("Falha no fallback de cópia:", err);
    return false;
  }
}

export async function copiarRecomendacao(p: DadosFichaProduto) {
  const texto = formatarTextoRecomendacao(p);
  const sucesso = await copiarTexto(texto);
  if (sucesso) {
    toast.success("Ficha técnica copiada para a área de transferência!");
  } else {
    toast.error("Não foi possível copiar o texto automaticamente.");
  }
}

export function imprimirFichaProduto(p: DadosFichaProduto) {
  const janelaImpressao = window.open("", "_blank");
  if (!janelaImpressao) {
    toast.error("Permita pop-ups no navegador para imprimir a ficha.");
    return;
  }

  const conteudoHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Ficha Técnica - ${p.titulo}</title>
      <style>
        body { font-family: sans-serif; margin: 30px; color: #1a2e22; line-height: 1.5; }
        .header { border-bottom: 2px solid #235839; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 20px; font-weight: bold; color: #235839; }
        .sub { font-size: 12px; color: #555; }
        h1 { font-size: 22px; color: #111; margin: 10px 0 5px; }
        .badge { display: inline-block; background: #e8f3ed; color: #235839; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .box { background: #f9fbf9; border: 1px solid #e1e9e3; padding: 12px; border-radius: 8px; }
        .label { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; }
        .val { font-size: 14px; font-weight: bold; margin-top: 4px; }
        .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 11px; color: #777; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🌱 Base de Conhecimento Técnico</div>
        <div class="sub">Desenvolvimento Técnico</div>
      </div>

      <h1>${p.titulo}</h1>
      ${p.grupo ? `<span class="badge">${p.grupo}</span>` : ""}
      ${p.carencia ? `<span class="badge" style="background:#fff3e0; color:#b78103;">Carência: ${p.carencia} dias</span>` : ""}

      <div class="grid">
        ${p.ingrediente ? `<div class="box"><div class="label">Ingrediente Ativo</div><div class="val">${p.ingrediente}</div></div>` : ""}
        ${p.fornecedor ? `<div class="box"><div class="label">Fornecedor</div><div class="val">${p.fornecedor}</div></div>` : ""}
      </div>

      ${
        p.dosagens && Object.keys(p.dosagens).length > 0
          ? `
        <div class="box" style="margin-bottom:15px;">
          <div class="label">Dosagem por Estágio Fenológico</div>
          <div class="grid" style="margin:10px 0 0;">
            ${Object.entries(p.dosagens)
              .map(
                ([est, val]) =>
                  `<div><strong>${est}:</strong> ${val} ${p.unidadeFormacao || ""}</div>`,
              )
              .join("")}
          </div>
        </div>
      `
          : p.dosagemUnica
            ? `<div class="box" style="margin-bottom:15px;"><div class="label">Dosagem</div><div class="val">${p.dosagemUnica}</div></div>`
            : ""
      }

      ${p.funcao ? `<div class="box" style="margin-bottom:15px;"><div class="label">Função Agronômica</div><div>${p.funcao}</div></div>` : ""}
      ${p.instrucoes ? `<div class="box" style="margin-bottom:15px;"><div class="label">Instruções de Aplicação</div><div>${p.instrucoes}</div></div>` : ""}

      <div class="footer">
        Ficha emitida via Guia Agronômico Cooxupé - Uso interno do time de Desenvolvimento Técnico.
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `;

  janelaImpressao.document.write(conteudoHtml);
  janelaImpressao.document.close();
}
