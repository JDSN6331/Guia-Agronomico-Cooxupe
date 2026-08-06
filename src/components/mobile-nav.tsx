import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
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
import { useTema } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [sheetAberto, setSheetAberto] = useState(false);
  const { user, isAdmin, sair: efetuarSair } = useAuth();
  const { tema, alternar } = useTema();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nome = user?.nomeCompleto || user?.email || "Usuário";

  async function sair() {
    setSheetAberto(false);
    await efetuarSair();
    await navigate({ to: "/", replace: true });
  }

  const navPrincipal = [
    { to: "/inicio", label: "Início", icon: LayoutDashboard },
    { to: "/cafe", label: "Café", icon: FlaticonCoffee },
    { to: "/milho-soja", label: "Milho/Soja", icon: FlaticonCornSoy },
    { to: "/foliar", label: "Foliar", icon: FlaticonFoliar },
  ] as const;

  const maisItens = [
    { to: "/calendario", label: "Calendário de Manejo", desc: "Janelas fenológicas e produtos", icon: FlaticonCalendar },
    { to: "/calculadora", label: "Calculadora de Dosagem", desc: "Cálculo de calda e dosagens", icon: FlaticonCalculator },
    { to: "/mistura-calda", label: "Mistura de Calda", desc: "Ordem de adição e prevenção", icon: FlaticonTankMix },
    ...(isAdmin ? [{ to: "/usuarios", label: "Gestão do Sistema", desc: "Convites e atualização da base", icon: FlaticonUsers }] : []),
  ] as const;

  const isMaisAtivo = sheetAberto || maisItens.some((i) => i.to === pathname);

  return (
    <>
      {/* Barra de Navegação Inferior Móvel (App Bottom Bar) - z-50 e 20% largura uniforme por item */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl pb-[env(safe-area-inset-bottom)] select-none">
        <div className="flex h-16 w-full items-center justify-between px-1">
          {navPrincipal.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="flex-1 w-0 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 select-none active:scale-95 transition-transform"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "grid size-8 place-items-center rounded-full transition-colors duration-150",
                      isActive
                        ? "bg-[#133d25] text-gold shadow-sm ring-1 ring-gold/30"
                        : "bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon size={20} className="size-[20px]" />
                  </div>
                  <span
                    className={cn(
                      "w-full truncate text-center text-[10px] tracking-tight leading-none",
                      isActive ? "text-gold font-bold" : "text-muted-foreground font-medium",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          ))}

          {/* Botão "Mais" que abre o Bottom Sheet */}
          <button
            onClick={() => setSheetAberto(true)}
            className="flex-1 w-0 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 select-none active:scale-95 transition-transform"
          >
            <div
              className={cn(
                "grid size-8 place-items-center rounded-full transition-colors duration-150",
                isMaisAtivo
                  ? "bg-[#133d25] text-gold shadow-sm ring-1 ring-gold/30"
                  : "bg-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Menu size={20} className="size-[20px]" />
            </div>
            <span
              className={cn(
                "w-full truncate text-center text-[10px] tracking-tight leading-none",
                isMaisAtivo ? "text-gold font-bold" : "text-muted-foreground font-medium",
              )}
            >
              Mais
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet Drawer Modal Móvel */}
      {sheetAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay escuro */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSheetAberto(false)}
          />

          {/* Modal estilo Bottom Sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-gold/30 bg-background p-6 shadow-2xl animate-in slide-in-from-bottom duration-250 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {/* Puxador superior visual */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />

            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-[#133d25] text-gold font-bold text-sm shadow-md">
                  {nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">{nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSheetAberto(false)}
                className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu de Recursos Adicionais */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Recursos & Ferramentas</p>
              {maisItens.map((item) => {
                const ativo = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: true }}
                    onClick={() => setSheetAberto(false)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl p-3.5 transition-all outline-none focus:outline-none active:scale-[0.98]",
                      ativo
                        ? "bg-[#133d25] text-white font-bold border border-gold/40"
                        : "bg-card/70 hover:bg-card border border-border text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("grid size-10 place-items-center rounded-xl", ativo ? "bg-gold/20 text-gold" : "bg-accent text-accent-foreground")}>
                        <item.icon size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs opacity-70">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="opacity-50" />
                  </Link>
                );
              })}
            </div>

            {/* Controles de Configuração e Conta */}
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <button
                onClick={alternar}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card/70 p-3.5 text-sm font-semibold outline-none focus:outline-none active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                    {tema === "dark" ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-400" />}
                  </div>
                  <span>Aparência: {tema === "dark" ? "Tema Escuro" : "Tema Claro"}</span>
                </div>
                <span className="text-xs font-bold text-gold">Alternar</span>
              </button>

              <button
                onClick={sair}
                className="flex w-full items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm font-semibold text-rose-500 outline-none focus:outline-none active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-rose-500/20 text-rose-500">
                    <LogOut size={20} />
                  </div>
                  <span>Sair do Aplicativo</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
