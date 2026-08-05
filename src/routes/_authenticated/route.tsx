import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { assumirPrimeiroAdminFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Gate,
});

function Gate() {
  const { carregando, session, papeis, recarregarPapeis } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!carregando && !session) void navigate({ to: "/", replace: true });
  }, [carregando, session, navigate]);

  useEffect(() => {
    if (!session) return;
    void supabase
      .from("profiles")
      .upsert(
        {
          id: session.user.id,
          email: session.user.email ?? null,
          nome_completo:
            (session.user.user_metadata?.["nome_completo"] as string | undefined) ?? null,
          cargo: (session.user.user_metadata?.["cargo"] as string | undefined) ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      )
      .then(() => undefined);
  }, [session]);

  if (carregando || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (papeis.length === 0) {
    return <SemAcesso onAtualizar={recarregarPapeis} />;
  }

  return <Outlet />;
}

function SemAcesso({ onAtualizar }: { onAtualizar: () => Promise<void> }) {
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

  async function sair() {
    await supabase.auth.signOut();
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
            <Button variant="ghost" className="w-full" onClick={sair}>
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
