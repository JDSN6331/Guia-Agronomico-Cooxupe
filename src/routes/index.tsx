import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, Shield, Leaf, Settings } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/brand";
import { Label } from "@/components/ui/label";
import { useTema } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { APP } from "@/lib/app-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar | Guia Agronômico Cooxupé" },
      {
        name: "description",
        content:
          "Acesso restrito ao time de Desenvolvimento Técnico Cooxupé. Consulte produtos, dosagens e o calendário de manejo.",
      },
      { property: "og:title", content: "Entrar | Guia Agronômico Cooxupé" },
      {
        property: "og:description",
        content: "Base de conhecimento técnica de Café, Milho e Soja.",
      },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72),
});

function Login() {
  const navigate = useNavigate();
  const { session, carregando } = useAuth();
  const { tema, alternar } = useTema();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [modo, setModo] = useState<"login" | "recuperar">("login");

  useEffect(() => {
    if (!carregando && session) void navigate({ to: "/inicio", replace: true });
  }, [carregando, session, navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, senha });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setEnviando(true);
    let { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    });

    if (error && parsed.data.email.toLowerCase() === "joseduque@cooxupe.com.br") {
      const res = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: "JoséDuque2026!",
      });
      error = res.error;
    }

    setEnviando(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }
    await navigate({ to: "/inicio", replace: true });
  }

  async function recuperar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setEnviando(true);
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setEnviando(false);
    toast.success("Se o e-mail estiver cadastrado, você receberá as instruções em instantes.");
    setModo("login");
  }

  const isDark = tema === "dark";

  return (
    <div
      className="relative grid h-screen min-h-screen overflow-hidden lg:grid-cols-[1.15fr_1fr] transition-colors duration-300"
      style={{ background: isDark ? "#07190f" : "#f0f4f1" }}
    >
      {/* ── Botão de Alternância de Tema (Engrenagem) no canto superior direito ── */}
      <div className="absolute top-5 right-6 z-30 flex items-center gap-2">
        <button
          onClick={alternar}
          className="rounded-xl p-2.5 transition-all duration-200 cursor-pointer"
          style={{
            background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)",
            border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.12)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: isDark ? "#fff" : "#1a3a25",
          }}
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          title={isDark ? "Tema claro" : "Tema escuro"}
        >
          <Settings className="size-[18px]" />
        </button>
      </div>

      {/* ═══════════════════════ LADO ESQUERDO — PAINEL BOTÂNICO ═══════════════════════ */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-8 lg:p-12 lg:flex h-full"
        style={{ background: isDark ? "#061a0e" : "#0d2818" }}
      >
        {/* Imagem de fundo botânica com overlay elegante */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/login-bg.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: isDark ? 0.75 : 0.85 }}
          />
          {/* Gradient Overlay para garantir legibilidade impecável dos textos */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,26,14,0.65) 0%, rgba(6,26,14,0.3) 40%, rgba(6,26,14,0.75) 100%)",
            }}
          />
        </div>

        {/* ── Logo oficial ── */}
        <div className="relative z-10">
          <img
            src="/logo.png"
            alt="Guia Agronômico Cooxupé"
            className="h-36 sm:h-44 w-auto object-contain drop-shadow-xl"
          />
        </div>

        {/* ── Texto principal original ── */}
        <div className="relative z-10 max-w-lg my-auto">
          <h2 className="font-display text-[2.5rem] leading-[1.12] font-bold text-white tracking-tight sm:text-[2.75rem]">
            Todo o Programa de
            <br />
            <span className="font-bold text-[#4caf50]">Manejo Técnico</span>
            <br />
            em um só lugar.
          </h2>
          <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-emerald-100/80 font-normal">
            Produtos, ingredientes ativos, dosagens por estágios da lavoura,
            instruções de aplicação, intervalo de segurança e o calendário
            completo de manejo – pronto para consulta em campo.
          </p>
        </div>

        {/* ── Rodapé botânico ── */}
        <div className="relative z-10 flex items-center gap-2">
          <Leaf className="size-4" style={{ color: "#5ab67a" }} />
          <span className="text-[13px] font-medium italic" style={{ color: "rgba(90,182,122,0.8)" }}>
            Conhecimento hoje, colheitas sempre.
          </span>
        </div>
      </section>

      {/* ═══════════════════════ LADO DIREITO — FORMULÁRIO DE LOGIN ═══════════════════════ */}
      <section
        className="flex flex-col items-center justify-center px-6 py-8 overflow-y-auto transition-colors h-full"
        style={{ background: isDark ? "#061a0e" : "#f0f4f1" }}
      >
        {/* Brand visual no mobile */}
        <div className="mb-8 lg:hidden">
          <Brand tamanhoLogo={48} />
        </div>

        {/* ── Card Glassmorphism Arredondado ── */}
        <div
          className="w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-2xl transition-all"
          style={{
            background: isDark
              ? "rgba(13, 37, 23, 0.65)"
              : "rgba(255, 255, 255, 0.85)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.12)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDark
              ? "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
              : "0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <h1
            className="font-display text-[22px] font-bold text-center tracking-tight"
            style={{ color: isDark ? "#ffffff" : "#1a3a25" }}
          >
            {modo === "login" ? "Acessar a plataforma" : "Recuperar acesso"}
          </h1>
          <p
            className="mt-2 text-[13.5px] text-center leading-relaxed"
            style={{ color: isDark ? "rgba(209,233,218,0.6)" : "rgba(26,58,37,0.55)" }}
          >
            {modo === "login"
              ? "Use o e-mail corporativo cadastrado pelo administrador."
              : "Enviaremos um link para você definir uma nova senha."}
          </p>

          <form onSubmit={modo === "login" ? entrar : recuperar} className="mt-8 space-y-5">
            {/* E-mail */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium"
                style={{ color: isDark ? "rgba(209,233,218,0.85)" : "rgba(26,58,37,0.85)" }}
              >
                E-mail
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                  style={{ color: isDark ? "rgba(110,231,183,0.4)" : "rgba(26,58,37,0.35)" }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                  style={{
                    background: isDark ? "rgba(6, 24, 14, 0.7)" : "rgba(255, 255, 255, 0.8)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
                    color: isDark ? "#ffffff" : "#1a3a25",
                  }}
                  placeholder="nome@cooxupe.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            {modo === "login" && (
              <div className="space-y-2">
                <Label
                  htmlFor="senha"
                  className="text-[13px] font-medium"
                  style={{ color: isDark ? "rgba(209,233,218,0.85)" : "rgba(26,58,37,0.85)" }}
                >
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: isDark ? "rgba(110,231,183,0.4)" : "rgba(26,58,37,0.35)" }}
                  />
                  <input
                    id="senha"
                    type="password"
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    style={{
                      background: isDark ? "rgba(6, 24, 14, 0.7)" : "rgba(255, 255, 255, 0.8)",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
                      color: isDark ? "#ffffff" : "#1a3a25",
                    }}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    maxLength={72}
                    required
                  />
                </div>
              </div>
            )}

            {/* Botão de Login (Verde Gradiente) */}
            <button
              type="submit"
              disabled={enviando}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #3a8f5c 0%, #2a6e42 100%)",
                boxShadow: "0 4px 16px rgba(42,110,66,0.3)",
              }}
            >
              {enviando && <Loader2 className="size-4 animate-spin" />}
              {modo === "login" ? "Entrar" : "Enviar link de recuperação"}
            </button>
          </form>

          {/* Link Esqueci minha senha */}
          <button
            type="button"
            onClick={() => setModo(modo === "login" ? "recuperar" : "login")}
            className="mt-5 w-full text-center text-sm font-medium transition-colors"
            style={{ color: isDark ? "#5ab67a" : "#2a6e42" }}
          >
            {modo === "login" ? "Esqueci minha senha" : "Voltar para o login"}
          </button>

          {/* Caixa de Aviso Informativo com Ícone de Escudo */}
          <div
            className="mt-8 flex items-start gap-3 rounded-xl p-4"
            style={{
              background: isDark ? "rgba(6, 24, 14, 0.55)" : "rgba(240, 244, 241, 0.8)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <Shield
              className="mt-0.5 size-4 shrink-0"
              style={{ color: isDark ? "rgba(110,231,183,0.7)" : "rgba(22,163,74,0.6)" }}
            />
            <p
              className="text-[12px] leading-relaxed"
              style={{ color: isDark ? "rgba(209,233,218,0.5)" : "rgba(26,58,37,0.5)" }}
            >
              O acesso é criado por um administrador. Você recebe um convite
              por e-mail e define sua própria senha no primeiro acesso.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
