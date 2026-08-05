import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { APP } from "@/lib/app-config";
import { totais } from "@/data/programa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar | AgroBase — Base de Conhecimento Técnico" },
      {
        name: "description",
        content:
          "Acesso restrito ao time de Desenvolvimento Técnico. Consulte produtos, dosagens e o calendário de manejo do Programa de Uso 2026.",
      },
      { property: "og:title", content: "Entrar | AgroBase" },
      {
        property: "og:description",
        content: "Base de conhecimento técnica de Café, Milho e Soja — Programa de Uso 2026.",
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
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.senha,
    });
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

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="field-grid absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15">
              <ShieldCheck className="size-[19px]" />
            </span>
            <span className="font-display text-[15px] font-bold">{APP.nome}</span>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl leading-[1.1] font-bold">
            Todo o Programa de Uso {APP.ano} em um só lugar.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-85">
            Produtos, ingredientes ativos, dosagens por estágio da lavoura, instruções de aplicação,
            intervalo de segurança e o calendário completo de manejo — pronto para consulta em campo.
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-primary-foreground/20 pt-6">
            {[
              { n: totais.cafe, l: "Produtos Café" },
              { n: totais.milhoSoja, l: "Milho e Soja" },
              { n: totais.janelas, l: "Janelas de manejo" },
            ].map((i) => (
              <div key={i.l}>
                <dt className="font-display text-2xl font-bold">{i.n}</dt>
                <dd className="text-[11px] uppercase tracking-wider opacity-75">{i.l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs opacity-60">Uso interno — {APP.equipe}</p>
      </section>

      <section className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-5">
          <Brand className="lg:hidden" />
          <span className="hidden lg:block" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-bold">
              {modo === "login" ? "Acessar a plataforma" : "Recuperar acesso"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {modo === "login"
                ? "Use o e-mail corporativo cadastrado pelo administrador."
                : "Enviaremos um link para você definir uma nova senha."}
            </p>

            <form onSubmit={modo === "login" ? entrar : recuperar} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="pl-9"
                    placeholder="nome@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              {modo === "login" && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="senha"
                      type="password"
                      autoComplete="current-password"
                      className="pl-9"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      maxLength={72}
                      required
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
                {modo === "login" ? "Entrar" : "Enviar link de recuperação"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setModo(modo === "login" ? "recuperar" : "login")}
              className="mt-5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {modo === "login" ? "Esqueci minha senha" : "Voltar para o login"}
            </button>

            <p className="mt-10 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              O acesso é criado por um administrador. Você recebe um convite por e-mail e define sua
              própria senha no primeiro acesso.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
