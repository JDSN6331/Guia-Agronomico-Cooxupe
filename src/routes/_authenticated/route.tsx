import { useEffect, useState } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { assumirPrimeiroAdminFn } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Gate,
});

function Gate() {
  const { carregando, session, papeis, recarregarSessao, sair } = useAuth();
  const navigate = useNavigate();
  const [checando, setChecando] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function verificarAutenticacao() {
      if (!carregando && !session) {
        setChecando(true);
        try {
          await recarregarSessao();
        } finally {
          if (ativo) setChecando(false);
        }
      }
    }
    void verificarAutenticacao();
    return () => {
      ativo = false;
    };
  }, [carregando, session, recarregarSessao]);

  useEffect(() => {
    if (!carregando && !checando && !session) {
      void navigate({ to: "/", replace: true });
    }
  }, [carregando, checando, session, navigate]);

  if (carregando || checando || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!Array.isArray(papeis) || papeis.length === 0) {
    return <SemAcesso onAtualizar={recarregarSessao} onSair={sair} />;
  }

  return <Outlet />;
}

function SemAcesso({
  onAtualizar,
  onSair,
}: {
  onAtualizar: () => Promise<void>;
  onSair: () => Promise<void>;
}) {
  const navigate = useNavigate();

  async function assumirAdmin() {
    try {
      await assumirPrimeiroAdminFn();
      await onAtualizar();
      toast.success("Você agora é o administrador da plataforma.");
    } catch {
      toast.error("A plataforma já possui administradores. Solicite acesso a um deles.");
    }
  }

  async function efetuarSaida() {
    await onSair();
    await navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between p-5">
        <Brand />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="panel w-full max-w-md p-7 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold">Acesso ainda não liberado</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sua conta existe, mas nenhum perfil de acesso foi atribuído. Peça a um administrador do
            time de Desenvolvimento Técnico para liberar seu acesso.
          </p>
          <div className="mt-6 space-y-2">
            <Button variant="outline" className="w-full" onClick={assumirAdmin}>
              Sou o primeiro administrador
            </Button>
            <Button variant="ghost" className="w-full" onClick={efetuarSaida}>
              Sair
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            A opção acima só funciona enquanto a plataforma não tiver nenhum administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
