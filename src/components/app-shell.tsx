import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { OfflineIndicator } from "@/components/offline-indicator";
import {
  FlaticonCoffee,
  FlaticonCornSoy,
  FlaticonFoliar,
  FlaticonCalendar,
  FlaticonCalculator,
  FlaticonTankMix,
  FlaticonUsers,
} from "@/components/flaticon-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: LayoutDashboard },
  { to: "/cafe", label: "Café", icon: FlaticonCoffee },
  { to: "/milho-soja", label: "Milho e Soja", icon: FlaticonCornSoy },
  { to: "/foliar", label: "Linha Foliar", icon: FlaticonFoliar },
  { to: "/calendario", label: "Calendário de Manejo", icon: FlaticonCalendar },
  { to: "/calculadora", label: "Calculadora de Dosagem", icon: FlaticonCalculator },
  { to: "/mistura-calda", label: "Mistura de Calda", icon: FlaticonTankMix },
] as const;

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const itens = isAdmin ? [...NAV, { to: "/usuarios", label: "Usuários", icon: FlaticonUsers }] : [...NAV];

  const nome =
    (user?.user_metadata?.["nome_completo"] as string | undefined) || user?.email || "Usuário";

  async function sair() {
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  }

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {itens.map((item) => {
        const ativo = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMenuAberto(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft font-semibold"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon size={18} className="size-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <OfflineIndicator />

      <div className="flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
          <div className="px-2 pb-4">
            <Brand />
          </div>
          <Separator className="mb-4" />
          {navLinks}
          <div className="mt-auto rounded-xl bg-sidebar-accent/60 p-3 text-xs leading-relaxed text-sidebar-accent-foreground">
            <p className="font-semibold text-gold">Base de Conhecimento Técnico</p>
            <p className="mt-1 opacity-80">
              Consulte sempre a bula e o intervalo de segurança antes da aplicação.
            </p>
          </div>

        </aside>

        {menuAberto && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setMenuAberto(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
              <div className="flex items-center justify-between px-2 pb-4">
                <Brand />
                <Button variant="ghost" size="icon" onClick={() => setMenuAberto(false)}>
                  <X className="size-5" />
                </Button>
              </div>
              <Separator className="mb-4" />
              {navLinks}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold sm:text-lg">{titulo}</h1>
                {descricao && (
                  <p className="truncate text-xs text-muted-foreground sm:text-[13px]">{descricao}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {acoes}
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {iniciais(nome)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">
                      {nome}
                      <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                        {user?.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={sair}>
                      <LogOut className="mr-2 size-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

