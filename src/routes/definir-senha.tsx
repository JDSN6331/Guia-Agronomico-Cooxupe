import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { definirSenhaFn, validarConviteFn } from "@/lib/auth.functions";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  token: z.string().optional(),
  resetToken: z.string().optional(),
});

export const Route = createFileRoute("/definir-senha")({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Definir senha | AgroBase" },
      {
        name: "description",
        content: "Crie a senha do seu acesso à base de conhecimento técnico AgroBase.",
      },
      { property: "og:title", content: "Definir senha | AgroBase" },
      {
        property: "og:description",
        content: "Confirme seu convite e defina a senha de acesso.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DefinirSenha,
});

function DefinirSenha() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { recarregarSessao } = useAuth();
  const token = search.token || search.resetToken;

  const [pronto, setPronto] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      setPronto(true);
      return;
    }

    validarConviteFn({ data: { token } })
      .then((res) => {
        setTokenValido(res.valido);
        if (res.email) setEmail(res.email);
      })
      .catch(() => {
        setTokenValido(false);
      })
      .finally(() => {
        setPronto(true);
      });
  }, [token]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Token de convite não encontrado.");
      return;
    }
    if (senha.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSalvando(true);
    try {
      await definirSenhaFn({ data: { token, senha } });
      await recarregarSessao();
      toast.success("Senha definida com sucesso. Bem-vindo!");
      await navigate({ to: "/inicio", replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível salvar a senha.";
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between p-5">
        <Brand />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-sm">
          {!pronto ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Validando seu convite…
            </div>
          ) : !tokenValido ? (
            <div className="panel p-6 text-center">
              <h1 className="font-display text-xl font-bold">Link inválido ou expirado</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Abra o link direto do e-mail de convite ou peça ao administrador para reenviá-lo.
              </p>
              <Button className="mt-5 w-full" onClick={() => navigate({ to: "/" })}>
                Ir para o login
              </Button>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <CheckCircle2 className="size-3.5" /> {email ?? "Convite de acesso validado"}
              </span>
              <h1 className="mt-4 font-display text-2xl font-bold">Crie sua senha</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha uma senha com pelo menos 8 caracteres para concluir seu cadastro.
              </p>
              <form onSubmit={salvar} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Nova senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      maxLength={72}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((valor) => !valor)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmacao">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmacao"
                      type={mostrarConfirmacao ? "text" : "password"}
                      className="pl-9 pr-10"
                      autoComplete="new-password"
                      value={confirmacao}
                      onChange={(e) => setConfirmacao(e.target.value)}
                      maxLength={72}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmacao((valor) => !valor)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={
                        mostrarConfirmacao
                          ? "Ocultar confirmacao da senha"
                          : "Mostrar confirmacao da senha"
                      }
                      title={
                        mostrarConfirmacao
                          ? "Ocultar confirmacao da senha"
                          : "Mostrar confirmacao da senha"
                      }
                    >
                      {mostrarConfirmacao ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={salvando}>
                  {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Salvar senha e entrar
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
