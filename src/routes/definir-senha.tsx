import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/definir-senha")({
  ssr: false,
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
  const [pronto, setPronto] = useState(false);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setSessaoValida(true);
        setPronto(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSessaoValida(Boolean(data.session));
      setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar a senha. Solicite um novo convite.");
      return;
    }
    toast.success("Senha definida com sucesso. Bem-vindo!");
    await navigate({ to: "/inicio", replace: true });
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
          ) : !sessaoValida ? (
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
                <CheckCircle2 className="size-3.5" /> E-mail confirmado
              </span>
              <h1 className="mt-4 font-display text-2xl font-bold">Crie sua senha</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha uma senha com pelo menos 8 caracteres para concluir o primeiro acesso.
              </p>
              <form onSubmit={salvar} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Nova senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="senha"
                      type="password"
                      className="pl-9"
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      maxLength={72}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmacao">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmacao"
                      type="password"
                      className="pl-9"
                      autoComplete="new-password"
                      value={confirmacao}
                      onChange={(e) => setConfirmacao(e.target.value)}
                      maxLength={72}
                      required
                    />
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
