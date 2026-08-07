import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Briefcase, Eye, EyeOff, KeyRound, Leaf, Loader2, Lock, Mail, Moon, Shield, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/brand";
import { Label } from "@/components/ui/label";
import { ativarContaComCodigoFn, entrarFn, solicitarCadastroFn, solicitarRecuperacaoFn } from "@/lib/auth.functions";
import { useAuth } from "@/lib/auth";
import { useTema } from "@/lib/theme";

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
  senha: z.string().min(1, "Informe a senha").max(72),
});

const GOLD = "#d4b054";

function Login() {
  const navigate = useNavigate();
  const { session, carregando, recarregarSessao } = useAuth();
  const { tema, alternar } = useTema();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigoAtivacao, setCodigoAtivacao] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [manterConectado, setManterConectado] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modo, setModo] = useState<"login" | "cadastrar" | "ativar" | "recuperar">("login");
  const [sucessoCadastro, setSucessoCadastro] = useState<string | null>(null);

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
    try {
      await entrarFn({ data: { email: parsed.data.email, senha: parsed.data.senha, manterConectado } });
      await recarregarSessao();
      toast.success("Bem-vindo ao Guia Agronômico!");
      await navigate({ to: "/inicio", replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message && !err.message.includes("aborted")
          ? err.message
          : "Não foi possível entrar. Verifique e-mail e senha.";
      toast.error(msg, {
        style: {
          background: "#991b1b",
          color: "#ffffff",
          border: "1px solid #f87171",
          fontWeight: 700,
          fontSize: "14px",
        },
      });
    } finally {
      setEnviando(false);
    }
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCompleto.trim()) {
      toast.error("Informe seu nome completo");
      return;
    }
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setEnviando(true);
    setSucessoCadastro(null);
    try {
      const res = await solicitarCadastroFn({
        data: {
          nomeCompleto: nomeCompleto.trim(),
          email: parsed.data,
          cargo: cargo.trim() || undefined,
        },
      });
      setSucessoCadastro(res.message);
      setModo("ativar");
      setCodigoAtivacao("");
      setNovaSenha("");
      setConfirmarSenha("");
      toast.success("Solicitação enviada ao Administrador!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível realizar o cadastro.";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  async function ativarConta(e: React.FormEvent) {
    e.preventDefault();
    const emailParsed = z.string().trim().email().safeParse(email);
    if (!emailParsed.success) {
      toast.error("Informe um e-mail válido");
      return;
    }
    if (codigoAtivacao.trim().length < 6) {
      toast.error("Informe o código de ativação de 6 dígitos");
      return;
    }
    if (novaSenha.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    setEnviando(true);
    try {
      await ativarContaComCodigoFn({
        data: {
          email: emailParsed.data,
          codigo: codigoAtivacao.trim(),
          senha: novaSenha,
        },
      });
      await recarregarSessao();
      toast.success("Conta ativada com sucesso! Bem-vindo!");
      await navigate({ to: "/inicio", replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código de ativação inválido.";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  async function recuperar(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setEnviando(true);
    try {
      await solicitarRecuperacaoFn({ data: parsed.data });
      toast.success("Se o e-mail estiver cadastrado, você receberá as instruções em instantes.");
      setModo("login");
    } catch {
      toast.error("Não foi possível enviar o e-mail de recuperação.");
    } finally {
      setEnviando(false);
    }
  }

  const isDark = tema === "dark";
  const painel = isDark ? "#08150e" : "#0d2818";
  const cardBg = isDark ? "rgba(10, 28, 18, 0.72)" : "rgba(255,255,255,0.9)";
  const txt = isDark ? "#ffffff" : "#12281b";
  const sub = isDark ? "rgba(214,236,222,0.62)" : "rgba(18,40,27,0.6)";

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
        className="relative hidden h-full flex-col overflow-hidden p-10 lg:flex lg:p-14"
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
          {/* halo verde superior */}
          <div
            className="absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(88,190,120,0.28), transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <img
            src="/logo.png"
            alt="Guia Agronômico Cooxupé"
            className="h-52 w-auto self-start object-contain object-left drop-shadow-2xl xl:h-60"
          />

          <div className="mt-6 max-w-xl">
            <h2 className="font-display text-[2.6rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[3rem]">
              Todo o Programa de
              <br />
              <span style={{ color: "#5fc47f" }}>Manejo Técnico</span>
              <br />
              em um só lugar.
            </h2>
            <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-emerald-50/75">
              Produtos, ingredientes ativos, dosagens por estágios da lavoura, instruções de
              aplicação, intervalo de segurança e o calendário completo de manejo.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-2">
          <Leaf className="size-4" style={{ color: GOLD }} />
          <span
            className="text-[13px] font-medium italic"
            style={{ color: "rgba(212,176,84,0.8)" }}
          >
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
          {/* Alternador de Modo (Entrar vs Criar conta vs Ativar) */}
          {modo !== "recuperar" && (
            <div
              className="flex rounded-xl p-1 mb-6 text-center"
              style={{ background: isDark ? "rgba(6, 22, 13, 0.6)" : "rgba(18,40,27,0.06)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setModo("login");
                  setSucessoCadastro(null);
                  setCodigoAtivacao("");
                  setNovaSenha("");
                  setConfirmarSenha("");
                }}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  modo === "login"
                    ? "bg-[#2a6e42] text-white shadow-md"
                    : isDark
                    ? "text-emerald-300/70 hover:text-white"
                    : "text-emerald-800/70 hover:text-emerald-900"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo("cadastrar");
                  setSucessoCadastro(null);
                  setCodigoAtivacao("");
                  setNovaSenha("");
                  setConfirmarSenha("");
                }}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  modo === "cadastrar"
                    ? "bg-[#2a6e42] text-white shadow-md"
                    : isDark
                    ? "text-emerald-300/70 hover:text-white"
                    : "text-emerald-800/70 hover:text-emerald-900"
                }`}
              >
                Criar conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo("ativar");
                  setCodigoAtivacao("");
                  setNovaSenha("");
                  setConfirmarSenha("");
                }}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  modo === "ativar"
                    ? "bg-[#2a6e42] text-white shadow-md"
                    : isDark
                    ? "text-emerald-300/70 hover:text-white"
                    : "text-emerald-800/70 hover:text-emerald-900"
                }`}
              >
                Ativar conta
              </button>
            </div>
          )}

          <h1
            className="text-center font-display text-[22px] font-bold tracking-tight"
            style={{ color: txt }}
          >
            {modo === "login"
              ? "Acessar a plataforma"
              : modo === "cadastrar"
              ? "Criar sua conta"
              : modo === "ativar"
              ? "Ativar conta com Código"
              : "Recuperar acesso"}
          </h1>
          <span
            className="mx-auto mt-3 block h-px w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
          <p className="mt-3 text-center text-[13.5px] leading-relaxed" style={{ color: sub }}>
            {modo === "login"
              ? "Use o seu e-mail cadastrado e senha."
              : modo === "cadastrar"
              ? "Preencha seus dados para solicitar o código de ativação ao administrador."
              : modo === "ativar"
              ? "Informe o código de 6 dígitos fornecido pelo Administrador para criar sua senha."
              : "Enviaremos um link para você definir uma nova senha."}
          </p>

          {sucessoCadastro && (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium leading-relaxed text-emerald-300">
              {sucessoCadastro}
            </div>
          )}

          <form
            onSubmit={
              modo === "login"
                ? entrar
                : modo === "cadastrar"
                ? cadastrar
                : modo === "ativar"
                ? ativarConta
                : recuperar
            }
            className="mt-6 space-y-4"
          >
            {modo === "cadastrar" && (
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto" className="text-[13px] font-medium" style={{ color: txt }}>
                  Nome Completo
                </Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                  />
                  <input
                    id="nomeCompleto"
                    type="text"
                    className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(18,40,27,0.12)"}`,
                      color: txt,
                      ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
                    }}
                    placeholder="Seu nome completo"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    maxLength={120}
                    required
                  />
                </div>
              </div>
            )}

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

            {modo === "cadastrar" && (
              <div className="space-y-2">
                <Label htmlFor="cargo" className="text-[13px] font-medium" style={{ color: txt }}>
                  Cargo / Função <span className="opacity-60 font-normal">(Opcional)</span>
                </Label>
                <div className="relative">
                  <Briefcase
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                  />
                  <input
                    id="cargo"
                    type="text"
                    className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(18,40,27,0.12)"}`,
                      color: txt,
                      ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
                    }}
                    placeholder="Ex: Técnico Agronômico"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
            )}

            {modo === "ativar" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="codigoAtivacao" className="text-[13px] font-medium" style={{ color: txt }}>
                    Código de Ativação (6 dígitos)
                  </Label>
                  <div className="relative">
                    <KeyRound
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                      style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                    />
                    <input
                      id="codigoAtivacao"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="flex h-11 w-full rounded-xl px-4 pl-10 tracking-widest text-base font-bold outline-none transition-all focus:ring-2"
                      style={{
                        background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                        border: `1px solid ${isDark ? "rgba(212,176,84,0.3)" : "rgba(18,40,27,0.2)"}`,
                        color: txt,
                        ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
                      }}
                      placeholder="Código de 6 dígitos"
                      value={codigoAtivacao}
                      onChange={(e) => setCodigoAtivacao(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novaSenha" className="text-[13px] font-medium" style={{ color: txt }}>
                    Criar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                      style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                    />
                    <input
                      id="novaSenha"
                      type="password"
                      autoComplete="new-password"
                      className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2"
                      style={{
                        background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(18,40,27,0.12)"}`,
                        color: txt,
                        ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
                      }}
                      placeholder="Mínimo 8 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      maxLength={72}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha" className="text-[13px] font-medium" style={{ color: txt }}>
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
                      style={{ color: isDark ? "rgba(212,176,84,0.55)" : "rgba(18,40,27,0.35)" }}
                    />
                    <input
                      id="confirmarSenha"
                      type="password"
                      autoComplete="new-password"
                      className="flex h-11 w-full rounded-xl px-4 pl-10 text-sm outline-none transition-all focus:ring-2"
                      style={{
                        background: isDark ? "rgba(6, 22, 13, 0.7)" : "rgba(255,255,255,0.85)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(18,40,27,0.12)"}`,
                        color: txt,
                        ["--tw-ring-color" as string]: "rgba(212,176,84,0.45)",
                      }}
                      placeholder="Repita a nova senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      maxLength={72}
                      required
                    />
                  </div>
                </div>
              </>
            )}

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
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-xl px-4 pl-10 pr-11 text-sm outline-none transition-all focus:ring-2"
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
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((valor) => !valor)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors hover:bg-black/5"
                    style={{ color: isDark ? "rgba(212,176,84,0.7)" : "rgba(18,40,27,0.45)" }}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {modo === "login" && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: txt }}>
                  <input
                    type="checkbox"
                    checked={manterConectado}
                    onChange={(e) => setManterConectado(e.target.checked)}
                    className="size-4 rounded border-gold/40 text-gold focus:ring-gold bg-background/50 accent-[#d4b054]"
                  />
                  Manter conectado
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 mt-2"
              style={{
                background: "linear-gradient(135deg, #4aa367 0%, #2a6e42 100%)",
                boxShadow: "0 6px 20px rgba(42,110,66,0.35)",
              }}
            >
              {enviando && <Loader2 className="size-4 animate-spin" />}
              {modo === "login"
                ? "Entrar"
                : modo === "cadastrar"
                ? "Solicitar Código ao Admin"
                : modo === "ativar"
                ? "Ativar conta e Entrar"
                : "Enviar link de recuperação"}
            </button>
          </form>

          {modo === "login" ? (
            <div className="mt-5 space-y-2 text-center">
              <button
                type="button"
                onClick={() => setModo("recuperar")}
                className="block w-full cursor-pointer text-center text-sm font-medium transition-colors hover:brightness-110"
                style={{ color: isDark ? GOLD : "#2a6e42" }}
              >
                Esqueci minha senha
              </button>
              <button
                type="button"
                onClick={() => setModo("ativar")}
                className="block w-full cursor-pointer text-center text-xs font-medium transition-colors opacity-80 hover:opacity-100 hover:underline"
                style={{ color: isDark ? GOLD : "#2a6e42" }}
              >
                Possui um Código de Ativação? Ative sua conta aqui
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setModo("login");
                setSucessoCadastro(null);
              }}
              className="mt-5 w-full cursor-pointer text-center text-sm font-medium transition-colors hover:brightness-110"
              style={{ color: isDark ? GOLD : "#2a6e42" }}
            >
              Já possui uma conta ativa? Voltar para o login
            </button>
          )}

          <div
            className="mt-8 flex items-start gap-3 rounded-xl p-4"
            style={{
              background: isDark ? "rgba(6, 22, 13, 0.55)" : "rgba(242,245,241,0.85)",
              border: `1px solid ${isDark ? "rgba(212,176,84,0.18)" : "rgba(18,40,27,0.07)"}`,
            }}
          >
            <Shield className="mt-0.5 size-4 shrink-0" style={{ color: GOLD }} />
            <p className="text-[12px] leading-relaxed" style={{ color: sub }}>
              {modo === "ativar"
                ? "Informe o código de 6 dígitos enviado ao e-mail do Administrador para criar sua senha."
                : "Solicite o cadastro para receber o Código de Ativação de 6 dígitos liberado pelo Administrador."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
