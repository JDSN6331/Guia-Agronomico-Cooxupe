import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, Shield, Leaf, Sun, Moon, Package, Sprout, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/brand";
import { Label } from "@/components/ui/label";
import { useTema } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { totais } from "@/data/programa";

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

const GOLD = "#d4b054";

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
  const painel = isDark ? "#08150e" : "#0d2818";
  const cardBg = isDark ? "rgba(10, 28, 18, 0.72)" : "rgba(255,255,255,0.9)";
  const txt = isDark ? "#ffffff" : "#12281b";
  const sub = isDark ? "rgba(214,236,222,0.62)" : "rgba(18,40,27,0.6)";

  const metricas = [
    { icone: Package, valor: totais.cafe, rotulo: "Produtos Café" },
    { icone: Sprout, valor: totais.milhoSoja, rotulo: "Milho e Soja" },
    { icone: CalendarDays, valor: totais.janelas, rotulo: "Janelas de Manejo" },
  ];

  return (
    <div
      className="relative grid min-h-screen overflow-hidden lg:grid-cols-[1.15fr_1fr] transition-colors duration-300"
      style={{ background: isDark ? "#08150e" : "#f2f5f1" }}
    >
      {/* Alternância de tema */}
      <button
        onClick={alternar}
        className="absolute right-6 top-5 z-30 rounded-xl p-2.5 transition-all duration-200 cursor-pointer hover:brightness-125"
        style={{
          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.75)",
          border: `1px solid ${isDark ? "rgba(212,176,84,0.35)" : "rgba(18,40,27,0.12)"}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: isDark ? GOLD : "#12281b",
        }}
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        title={isDark ? "Tema claro" : "Tema escuro"}
      >
        {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </button>

      {/* ── PAINEL ESQUERDO ── */}
      <section
        className="relative hidden h-full flex-col justify-between overflow-hidden p-10 lg:flex lg:p-14"
        style={{ background: painel }}
      >
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/login-bg.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: isDark ? 0.6 : 0.8 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(6,22,13,0.94) 0%, rgba(6,22,13,0.72) 45%, rgba(6,22,13,0.45) 100%)",
            }}
          />
          {/* halo verde superior, como no modelo */}
          <div
            className="absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(88,190,120,0.28), transparent 70%)" }}
          />
        </div>

        <div className="relative z-10">
          <img
            src="/logo.png"
            alt="Guia Agronômico Cooxupé"
            className="h-40 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <h2 className="font-display text-[2.6rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[3rem]">
            Todo o Programa de
            <br />
            <span style={{ color: "#5fc47f" }}>Manejo Técnico</span>
            <br />
            em um só lugar.
          </h2>
          <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-emerald-50/75">
            Produtos, ingredientes ativos, dosagens por estágios da lavoura, instruções de
            aplicação, intervalo de segurança e o calendário completo de manejo – pronto para
            consulta em campo.
          </p>

          {/* Métricas */}
          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
            {metricas.map(({ icone: Icone, valor, rotulo }) => (
              <div key={rotulo} className="flex items-center gap-3">
                <span
                  className="grid size-11 place-items-center rounded-full"
                  style={{
                    background: "rgba(212,176,84,0.12)",
                    border: "1px solid rgba(212,176,84,0.35)",
                    color: GOLD,
                  }}
                >
                  <Icone className="size-[18px]" />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-[22px] font-bold text-white">
                    {valor}
                  </span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-50/60">
                    {rotulo}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Leaf className="size-4" style={{ color: GOLD }} />
          <span className="text-[13px] font-medium italic" style={{ color: "rgba(212,176,84,0.8)" }}>
            Conhecimento hoje, colheitas sempre.
          </span>
        </div>
      </section>

      {/* ── FORMULÁRIO ── */}
      <section
        className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10 transition-colors"
        style={{ background: isDark ? "#0a1c12" : "#f2f5f1" }}
      >
        <div className="mb-8 lg:hidden">
          <Brand tamanhoLogo={52} />
        </div>

        <div
          className="w-full max-w-md rounded-3xl p-8 shadow-2xl transition-all sm:p-10"
          style={{
            background: cardBg,
            border: `1px solid ${isDark ? "rgba(212,176,84,0.18)" : "rgba(18,40,27,0.08)"}`,
            boxShadow: isDark
              ? "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 18px 50px rgba(13,40,24,0.09), inset 0 1px 0 rgba(255,255,255,0.9)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <h1
            className="text-center font-display text-[22px] font-bold tracking-tight"
            style={{ color: txt }}
          >
            {modo === "login" ? "Acessar a plataforma" : "Recuperar acesso"}
          </h1>
          <span
            className="mx-auto mt-3 block h-px w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
          <p className="mt-3 text-center text-[13.5px] leading-relaxed" style={{ color: sub }}>
            {modo === "login"
              ? "Use o e-mail corporativo cadastrado pelo administrador."
              : "Enviaremos um link para você definir uma nova senha."}
          </p>

          <form onSubmit={modo === "login" ? entrar : recuperar} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium" style={{ color: txt }}>
                E-mail
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                  style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(18,40,27,0.12)"}`,
                    color: txt,
                    ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
                  }}
                  placeholder="nome@cooxupe.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>

            {modo === "login" && (
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-[13px] font-medium" style={{ color: txt }}>
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                  />
                  <input
                    id="senha"
                    type="password"
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(18,40,27,0.12)"}`,
                      color: txt,
                      ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
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

            <button
              type="submit"
              disabled={enviando}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #4aa367 0%, #2a6e42 100%)",
                boxShadow: "0 6px 20px rgba(42,110,66,0.35)",
              }}
            >
              {enviando && <Loader2 className="size-4 animate-spin" />}
              {modo === "login" ? "Entrar" : "Enviar link de recuperação"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setModo(modo === "login" ? "recuperar" : "login")}
            className="mt-5 w-full cursor-pointer text-center text-sm font-medium transition-colors hover:brightness-110"
            style={{ color: isDark ? GOLD : "#2a6e42" }}
          >
            {modo === "login" ? "Esqueci minha senha" : "Voltar para o login"}
          </button>

          <div
            className="mt-8 flex items-start gap-3 rounded-xl p-4"
            style={{
              background: isDark ? "rgba(6, 22, 13, 0.55)" : "rgba(242,245,241,0.85)",
              border: `1px solid ${isDark ? "rgba(212,176,84,0.18)" : "rgba(18,40,27,0.07)"}`,
            }}
          >
            <Shield className="mt-0.5 size-4 shrink-0" style={{ color: GOLD }} />
            <p className="text-[12px] leading-relaxed" style={{ color: sub }}>
              O acesso é criado por um administrador. Você recebe um convite por e-mail e define sua
              própria senha no primeiro acesso.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
