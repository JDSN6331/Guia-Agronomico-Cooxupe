import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Camera, Gauge, Layers, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MobileNav } from "@/components/mobile-nav";
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
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: LayoutDashboard },
  { to: "/cafe", label: "Café", icon: FlaticonCoffee },
  { to: "/milho-soja", label: "Milho e Soja", icon: FlaticonCornSoy },
  { to: "/familia-produtos", label: "Família de Produtos", icon: Layers },
  { to: "/calendario", label: "Calendário de Manejo", icon: FlaticonCalendar },
  { to: "/calculadora", label: "Calculadora de Dosagem", icon: FlaticonCalculator },
  { to: "/calculadora-vazao", label: "Calculadora de Vazão", icon: Gauge },
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
  const [recolhido, setRecolhido] = useState(false);
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const { user, isAdmin, sair: efetuarSair } = useAuth();
  const navigate = useNavigate();

  const userKey = user?.id ? `agri_foto_perfil_${user.id}` : "agri_foto_perfil_default";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const salvoRecolhido = localStorage.getItem("agri_sidebar_recolhido");
      if (salvoRecolhido !== null) {
        setRecolhido(salvoRecolhido === "true");
      }
      const fotoSalva = localStorage.getItem(userKey);
      if (fotoSalva) {
        setFotoPerfil(fotoSalva);
      }
    }
  }, [userKey]);

  function alternarRecolhido() {
    setRecolhido((v) => {
      const proximo = !v;
      if (typeof window !== "undefined") {
        localStorage.setItem("agri_sidebar_recolhido", String(proximo));
      }
      return proximo;
    });
  }

  function salvarFoto(dataUrl: string | null) {
    setFotoPerfil(dataUrl);
    if (typeof window !== "undefined") {
      if (dataUrl) {
        localStorage.setItem(userKey, dataUrl);
      } else {
        localStorage.removeItem(userKey);
      }
    }
  }

  const itens = isAdmin ? [...NAV, { to: "/usuarios", label: "Gestão do Sistema", icon: FlaticonUsers }] : [...NAV];
  const nome = user?.nomeCompleto || user?.email || "Usuário";

  async function sair() {
    await efetuarSair();
  }

  const renderNavLinks = (compact = false) => (
    <nav className="flex flex-col gap-1.5">
      {itens.map((item) => {
        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            onClick={() => setMenuAberto(false)}
            title={compact ? item.label : undefined}
            className={cn(
              "relative flex items-center rounded-xl font-medium border border-transparent outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 select-none transition-all duration-150 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              compact ? "justify-center px-0 py-2.5 h-10 w-10 mx-auto" : "gap-3 px-3.5 py-2.5 text-sm",
            )}
            activeProps={{
              className: cn(
                "bg-[#1c5c36] text-white dark:bg-[#10351e] dark:text-white shadow-md font-bold border-gold/50 hover:bg-[#1c5c36] dark:hover:bg-[#10351e]",
                !compact &&
                  "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1.5 before:-translate-y-1/2 before:rounded-r-full before:bg-gold",
              ),
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon size={19} className={cn("size-[19px] shrink-0", isActive ? "text-gold opacity-100" : "opacity-80")} />
                {!compact && <span>{item.label}</span>}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <OfflineIndicator />

      {/* Sidebar Desktop Adaptável (Expansível / Recolhível) */}
      <aside
        className={cn(
          "hidden lg:flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4 transition-all duration-200 ease-in-out select-none relative",
          recolhido ? "w-20 px-2" : "w-64 px-3",
        )}
      >
        {/* Cabeçalho da Sidebar: Brand e Botão de Recolher no Canto Inferior Direito da Seção */}
        <div
          className={cn(
            "relative pb-4 transition-all",
            recolhido ? "flex flex-col items-center justify-center px-0 gap-2" : "px-2 pr-9",
          )}
        >
          <Brand compacto={recolhido} />
          <Button
            variant="ghost"
            size="icon"
            onClick={alternarRecolhido}
            className={cn(
              "size-7 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0 transition-all",
              recolhido ? "static mt-1" : "absolute bottom-3 right-1",
            )}
            title={recolhido ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-label={recolhido ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {recolhido ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>
        <Separator className="mb-4" />
        <div className="flex-1 overflow-y-auto">{renderNavLinks(recolhido)}</div>
      </aside>

      {/* Drawer de Menu Tablet (Telas Médias) */}
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
            {renderNavLinks(false)}
          </div>
        </div>
      )}

      {/* Conteúdo Principal do App (Header Fixo no Topo + Main com Scroll Interno + MobileNav Fixo no Rodapé) */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden relative">
        {/* Header Superior Fixo em Todas as Páginas */}
        <header className="shrink-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
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
                  <button className="grid size-9 place-items-center rounded-full overflow-hidden bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-gold/45 ring-offset-2 ring-offset-background transition-shadow hover:ring-gold/80 outline-none focus:outline-none shrink-0">
                    {fotoPerfil ? (
                      <img src={fotoPerfil} alt={nome} className="size-full object-cover" />
                    ) : (
                      iniciais(nome)
                    )}
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
                  <DropdownMenuItem onClick={() => setModalFotoAberto(true)}>
                    <Camera className="mr-2 size-4 text-gold" /> Alterar Foto de Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={sair}>
                    <LogOut className="mr-2 size-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Área Principal de Conteúdo com Scroll Interno Fluido */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mt-12 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground/80 space-y-1">
            <p className="font-semibold text-foreground">Guia Agronômico AgroBase</p>
            <p className="text-[11px]">Desenvolvido pelo Time de Inteligência de Mercado - Comercial Insumos</p>
          </footer>
        </main>

        {/* Barra de Navegação Móvel Fixa no Rodapé */}
        <MobileNav />
      </div>

      {/* Modal de Carregamento de Foto de Perfil */}
      {modalFotoAberto && (
        <DialogFotoPerfil
          fotoAtual={fotoPerfil}
          onSalvar={(url) => {
            salvarFoto(url);
            setModalFotoAberto(false);
            toast.success("Foto de perfil atualizada com sucesso!");
          }}
          onFechar={() => setModalFotoAberto(false)}
        />
      )}
    </div>
  );
}

function DialogFotoPerfil({
  fotoAtual,
  onSalvar,
  onFechar,
}: {
  fotoAtual: string | null;
  onSalvar: (url: string | null) => void;
  onFechar: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(fotoAtual);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function processarArquivo(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida (.jpg, .png, .webp).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
          <DialogDescription>
            Carregue uma imagem do seu computador para personalizar seu avatar no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="relative group grid size-28 place-items-center rounded-full overflow-hidden border-2 border-gold bg-primary/10 text-primary shadow-xl">
            {preview ? (
              <img src={preview} alt="Pré-visualização" className="size-full object-cover" />
            ) : (
              <Camera className="size-10 text-gold/80" />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processarArquivo(file);
            }}
          />

          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs"
            >
              <Upload className="size-3.5 text-gold" /> Escolher Foto
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview(null)}
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Remover
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => onSalvar(preview)}>
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
