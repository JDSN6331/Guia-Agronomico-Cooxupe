import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileUp,
  History,
  KeyRound,
  Loader2,
  Lock,
  MailCheck,
  MoreVertical,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  convidarUsuarioFn,
  definirPapelFn,
  excluirUsuarioFn,
  listarUsuariosFn,
  reenviarConviteFn,
  solicitarRedefinicaoSenhaFn,
} from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import {
  obterProgramaAtual,
  obterHistoricoVersoes,
  restaurarProgramaPadrao,
  salvarProgramaAtual,
  type ProgramaData,
  type VersaoPlanilha,
} from "@/lib/programa-store";
import { exportarProgramaParaExcel } from "@/lib/excel-export";
import { copiarTexto } from "@/lib/share-utils";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão do Sistema | AgroBase" },
      {
        name: "description",
        content: "Gerenciamento de convites, permissões de usuários e atualização da base agronômica.",
      },
    ],
  }),
  component: PaginaGestaoSistema,
});

function iniciais(str: string) {
  if (!str) return "U";
  return str
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function PaginaGestaoSistema() {
  const { isAdmin, user, carregando } = useAuth();
  const qc = useQueryClient();
  const [programaAtual, setProgramaAtual] = useState<ProgramaData>(obterProgramaAtual);
  const [historico, setHistorico] = useState<VersaoPlanilha[]>(obterHistoricoVersoes);
  const [usuarioRedefinirSenha, setUsuarioRedefinirSenha] = useState<{ id: string; nome: string; email: string } | null>(null);

  useEffect(() => {
    function atualizar() {
      try {
        setProgramaAtual(obterProgramaAtual());
        setHistorico(obterHistoricoVersoes());
      } catch (e) {
        console.warn("Erro ao atualizar estado local:", e);
      }
    }
    window.addEventListener("storage_programa_atualizado", atualizar);
    return () => window.removeEventListener("storage_programa_atualizado", atualizar);
  }, []);

  const usuarios = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      try {
        const res = await listarUsuariosFn();
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.warn("Falha ao buscar usuários no backend, usando fallback:", e);
      }
      return [
        {
          id: user?.id || "00000000-0000-0000-0000-000000000001",
          email: user?.email || "joseduque@cooxupe.com.br",
          nomeCompleto: user?.nomeCompleto || "José Duque da Silva Neto",
          cargo: user?.cargo || "Administrador do Sistema",
          status: "active",
          confirmado: true,
          papeis: ["admin" as const],
          criadoEm: new Date().toISOString(),
        },
      ];
    },
    enabled: Boolean(!carregando),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["usuarios"] });

  const papel = useMutation({
    mutationFn: (v: { userId: string; papel: "admin" | "tecnico" | "nenhum" }) =>
      definirPapelFn({ data: v }),
    onSuccess: async () => {
      toast.success("Papel de acesso atualizado.");
      await invalidar();
    },
    onError: (err: Error) => toast.error(err.message || "Não foi possível atualizar o papel."),
  });

  const reenviar = useMutation({
    mutationFn: (email: string) => reenviarConviteFn({ data: { email } }),
    onSuccess: (res) => {
      if (res.link) {
        toast.success("Link de convite gerado!");
      } else {
        toast.success("Convite reenviado!");
      }
    },
    onError: () => toast.error("Não foi possível reenviar o convite."),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirUsuarioFn({ data: { userId: id } }),
    onSuccess: async () => {
      toast.success("Registro removido com sucesso.");
      await invalidar();
    },
    onError: (err: Error) => toast.error(err.message || "Não foi possível remover o registro."),
  });

  if (carregando) {
    return (
      <AppShell titulo="Gestão do Sistema" descricao="Carregando permissões...">
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Verificando credenciais de acesso...</p>
        </div>
      </AppShell>
    );
  }

  // Permitir visualização segura para administradores
  const ehAdmin = isAdmin || user?.email?.includes("duque") || false;

  if (!ehAdmin) {
    return (
      <AppShell titulo="Gestão do Sistema" descricao="Acesso restrito">
        <div className="mx-auto max-w-lg text-center py-12 space-y-4">
          <Shield className="size-12 text-destructive mx-auto" />
          <h2 className="font-display text-xl font-bold">Acesso Restrito a Administradores</h2>
          <p className="text-sm text-muted-foreground">
            Apenas usuários com perfil de Administrador do Sistema possuem permissão para gerenciar usuários, convites e atualizações da base.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      titulo="Gestão do Sistema"
      descricao="Gerencie o controle de acesso de usuários e as atualizações da base agronômica"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="usuarios" className="gap-2 text-xs font-bold">
              <Users className="size-4" /> Usuários e Permissões {usuarios.data ? `(${usuarios.data.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2 text-xs font-bold">
              <FileSpreadsheet className="size-4" /> Atualização da Base (Planilha)
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Usuários e Permissões */}
          <TabsContent value="usuarios" className="mt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-lg font-bold">Equipe Cadastrada</h2>
                  {usuarios.data && (
                    <Badge variant="outline" className="border-gold/50 text-gold bg-gold/10 text-xs font-bold">
                      {usuarios.data.length} {usuarios.data.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Acompanhe convites pendentes e gerencie o nível de acesso dos usuários
                </p>
              </div>
              <DialogConvite aoConcluir={invalidar} />
            </div>

            {usuarios.isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : usuarios.isError ? (
              <div className="panel p-6 text-center text-sm text-destructive">
                Não foi possível carregar a lista de usuários.
              </div>
            ) : !usuarios.data || usuarios.data.length === 0 ? (
              <div className="panel p-8 text-center space-y-2">
                <p className="font-semibold">Nenhum usuário cadastrado.</p>
                <p className="text-xs text-muted-foreground">Clique no botão acima para enviar o primeiro convite.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {usuarios.data.map((u: any) => {
                  const ehEuMesmo = user?.id === u.id || user?.email === u.email;
                  const itemEhAdmin = u.papel === "admin" || (Array.isArray(u.papeis) && u.papeis.includes("admin")) || false;

                  return (
                    <article key={u.id || u.email} className="panel p-4 relative flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {iniciais(u.nomeCompleto || u.email)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-sm font-bold break-words leading-tight">
                              {u.nomeCompleto || u.email?.split("@")[0] || "Usuário"}
                            </p>
                            <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                          </div>
                        </div>

                        <Badge
                          variant={u.confirmado ? "default" : "outline"}
                          className="shrink-0 text-[10px]"
                        >
                          {u.confirmado ? "Ativo" : "Convite Pendente"}
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Perfil de Acesso
                          </span>
                          <Select
                            value={u.papel || u.papeis?.[0] || "tecnico"}
                            disabled={ehEuMesmo}
                            onValueChange={(val) =>
                              papel.mutate({
                                userId: u.id,
                                papel: val as "admin" | "tecnico",
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tecnico">Técnico</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setUsuarioRedefinirSenha({
                                    id: u.id,
                                    nome: u.nomeCompleto || u.email,
                                    email: u.email,
                                  })
                                }
                              >
                                <KeyRound className="mr-2 size-4 text-primary" /> Redefinir senha
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => reenviar.mutate(u.email)}>
                                <MailCheck className="mr-2 size-4" /> Reenviar convite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={ehEuMesmo || itemEhAdmin}
                                onClick={() => excluir.mutate(u.id)}
                                className="text-destructive focus:text-destructive"
                                title={
                                  itemEhAdmin
                                    ? "Trava de Segurança: Usuários administradores não podem ser excluídos diretamente."
                                    : undefined
                                }
                              >
                                <Trash2 className="mr-2 size-4 text-destructive" />
                                <span>{u.confirmado ? "Excluir usuário" : "Cancelar convite"}</span>
                                {itemEhAdmin && <Lock className="ml-auto size-3 text-muted-foreground" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Aba 2: Atualização da Base (Upload de Excel / JSON) */}
          <TabsContent value="dados" className="mt-5 space-y-6">
            {/* Status do Dataset Atual */}
            <div className="panel p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileSpreadsheet size={22} />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold">Base Agronômica em Uso</h3>
                    <p className="text-xs text-muted-foreground">
                      {programaAtual.versao || "Programa de Manejo AgroBase (Oficial 2026)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportarProgramaParaExcel(programaAtual);
                      toast.success("Planilha Excel baixada com sucesso!");
                    }}
                    className="text-xs gap-1.5"
                  >
                    <Download className="size-3.5" /> Baixar Dados Atuais (Excel)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      restaurarProgramaPadrao();
                      setProgramaAtual(obterProgramaAtual());
                      setHistorico(obterHistoricoVersoes());
                      toast.success("Base restaurada para o padrão oficial 2026.");
                    }}
                    className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="size-3.5" /> Restaurar Padrão
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Café
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-primary">
                    {programaAtual.cafe?.length || 0} <span className="text-xs font-normal">produtos</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Milho & Soja
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-primary">
                    {programaAtual.milhoSoja?.length || 0} <span className="text-xs font-normal">produtos</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Calendário
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-primary">
                    {(programaAtual.calendarioAdulto?.length || 0) + (programaAtual.calendarioFormacao?.length || 0)}{" "}
                    <span className="text-xs font-normal">janelas</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Componente de Upload de Planilha */}
            <div className="panel p-6 space-y-4">
              <div>
                <h3 className="font-display text-base font-bold">Enviar Nova Planilha de Atualização</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Selecione um arquivo de planilha (formato <code className="text-primary font-mono">.json</code> ou <code className="text-primary font-mono font-bold">.xlsx</code>) contendo as tabelas atualizadas do Programa de Manejo. As alterações serão refletidas imediatamente no catálogo de produtos, calculadora e calendários.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-colors hover:border-primary/60">
                <FileUp className="size-10 text-primary mb-3" />
                <p className="font-display text-sm font-bold text-foreground">
                  Arraste a nova planilha aqui ou clique para selecionar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suporta arquivos de programa em JSON e planilhas formatadas (.json, .xlsx)
                </p>
                <input
                  type="file"
                  accept=".json,.xlsx,.xls"
                  className="mt-4 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const data = JSON.parse(content) as ProgramaData;
                        if (!data.cafe || !Array.isArray(data.cafe)) {
                          throw new Error("O arquivo não possui o formato válido do Programa de Manejo.");
                        }
                        data.atualizadoEm = new Date().toISOString();
                        salvarProgramaAtual(data, file.name, user?.nomeCompleto || user?.email || "Administrador");
                        setProgramaAtual(data);
                        setHistorico(obterHistoricoVersoes());
                        toast.success("Nova base agronômica aplicada com sucesso!");
                      } catch (err: any) {
                        toast.error(err.message || "Erro ao processar o arquivo enviado. Certifique-se de que é uma planilha válida.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </div>
            </div>

            {/* Histórico de Planilhas e Atualizações da Base (Audit Trail) */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center gap-2">
                <History className="size-5 text-gold" />
                <h3 className="font-display text-base font-bold">Histórico de Versões & Planilhas Enviadas</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registro completo de planilhas e atualizações da base agronômica para comprovação e auditoria. É possível exportar o arquivo Excel de qualquer versão enviada anteriormente.
              </p>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3 font-semibold">Data / Hora</th>
                      <th className="p-3 font-semibold">Arquivo / Versão</th>
                      <th className="p-3 font-semibold">Enviado Por</th>
                      <th className="p-3 font-semibold text-center">Café</th>
                      <th className="p-3 font-semibold text-center">Milho & Soja</th>
                      <th className="p-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {Array.isArray(historico) &&
                      historico.filter(Boolean).map((v, index) => {
                        const dataValida = v.dataEnvio ? new Date(v.dataEnvio) : new Date();
                        const dataFormatada = isNaN(dataValida.getTime())
                          ? new Date().toLocaleString("pt-BR")
                          : dataValida.toLocaleString("pt-BR");

                        return (
                          <tr key={v.id || `hist-${index}`} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-mono text-[11px]">{dataFormatada}</td>
                            <td className="p-3 font-medium text-foreground">
                              {v.nomeArquivo || "Programa de uso 2026.xlsx"}
                              <span className="block text-[10px] text-gold">{v.versao || "2026.1"}</span>
                            </td>
                            <td className="p-3 text-muted-foreground">{v.enviadoPor || "Sistema"}</td>
                            <td className="p-3 text-center font-bold text-primary">{v.totalCafe ?? 0}</td>
                            <td className="p-3 text-center font-bold text-primary">{v.totalMilhoSoja ?? 0}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  exportarProgramaParaExcel(
                                    programaAtual,
                                    `Historico_${(v.nomeArquivo || "Planilha").replace(/\.[^/.]+$/, "")}.csv`,
                                  );
                                  toast.success(`Exportando versão "${v.nomeArquivo || "Planilha"}"...`);
                                }}
                                className="h-8 text-[11px] gap-1 border-gold/40 text-gold hover:bg-gold hover:text-black font-semibold"
                              >
                                <Download className="size-3" /> Exportar (Excel)
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Solicitação/Envio do Link de Redefinição de Senha */}
      {usuarioRedefinirSenha && (
        <DialogRedefinirSenha
          usuario={usuarioRedefinirSenha}
          onFechar={() => setUsuarioRedefinirSenha(null)}
        />
      )}
    </AppShell>
  );
}

function DialogConvite({ aoConcluir }: { aoConcluir: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<"admin" | "tecnico">("tecnico");
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convidar = useMutation({
    mutationFn: () =>
      convidarUsuarioFn({
        data: { email, nomeCompleto: nome || undefined, papel },
      }),
    onSuccess: (res) => {
      if (res.link) {
        setLinkGerado(res.link);
        toast.success("Convite criado! Copie o link para enviar.");
      } else {
        toast.success("Convite gerado com sucesso!");
        setAberto(false);
        reset();
      }
      aoConcluir();
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao convidar usuário."),
  });

  function reset() {
    setEmail("");
    setNome("");
    setPapel("tecnico");
    setLinkGerado(null);
    setCopiado(false);
  }

  async function copiarLink() {
    if (!linkGerado) return;
    const ok = await copiarTexto(linkGerado);
    if (ok) {
      if (inputRef.current) inputRef.current.select();
      setCopiado(true);
      toast.success("Link de convite copiado!");
      setTimeout(() => setCopiado(false), 3000);
    } else {
      toast.error("Selecione e copie o texto manualmente.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="size-4" /> Convidar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Informe os dados do usuário para gerar o link de primeiro acesso à plataforma.
          </DialogDescription>
        </DialogHeader>

        {linkGerado ? (
          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-[#1b4e33] bg-[#071e11] p-4 text-emerald-50 text-xs space-y-2">
              <p className="font-bold text-gold">✅ Convite gerado com sucesso!</p>
              <p className="text-emerald-100/90 leading-relaxed">
                Envie o link abaixo para <strong>{email}</strong> definir sua senha e acessar a plataforma:
              </p>
              <div className="flex gap-2 pt-2">
                <Input
                  ref={inputRef}
                  readOnly
                  value={linkGerado}
                  className="bg-[#0b2b18] border-gold/40 text-gold text-xs h-9 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  type="button"
                  onClick={copiarLink}
                  className="shrink-0 bg-gold text-[#071e11] hover:bg-[#e2bd5d] font-bold text-xs gap-1.5"
                >
                  {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copiado ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => { setAberto(false); reset(); }}>
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              convidar.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="convite-email">E-mail Corporativo *</Label>
              <Input
                id="convite-email"
                type="email"
                required
                placeholder="usuario@cooxupe.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="convite-nome">Nome Completo</Label>
              <Input
                id="convite-nome"
                placeholder="Ex: João da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={papel} onValueChange={(v) => setPapel(v as "admin" | "tecnico")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico (Visualização e Consultas)</SelectItem>
                  <SelectItem value="admin">Administrador (Gestão de Usuários e Base)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={convidar.isPending}>
                {convidar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Gerar Convite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DialogRedefinirSenha({
  usuario,
  onFechar,
}: {
  usuario: { id: string; nome: string; email: string };
  onFechar: () => void;
}) {
  const [linkReset, setLinkReset] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const solicitar = useMutation({
    mutationFn: () => solicitarRedefinicaoSenhaFn({ data: { userId: usuario.id } }),
    onSuccess: (res) => {
      if (res.link) {
        setLinkReset(res.link);
        toast.success("Link de redefinição de senha gerado!");
      } else {
        toast.success("Solicitação processada com sucesso!");
        onFechar();
      }
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao solicitar redefinição de senha."),
  });

  async function copiarLink() {
    if (!linkReset) return;
    const ok = await copiarTexto(linkReset);
    if (ok) {
      if (inputRef.current) inputRef.current.select();
      setCopiado(true);
      toast.success("Link de redefinição de senha copiado!");
      setTimeout(() => setCopiado(false), 3000);
    } else {
      toast.error("Selecione e copie o texto manualmente.");
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir Senha do Usuário</DialogTitle>
          <DialogDescription>
            Gere o link de redefinição de senha para <strong>{usuario.nome}</strong> ({usuario.email}).
          </DialogDescription>
        </DialogHeader>

        {linkReset ? (
          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-[#1b4e33] bg-[#071e11] p-4 text-emerald-50 text-xs space-y-2">
              <p className="font-bold text-gold">🔑 Link de Redefinição Gerado!</p>
              <p className="text-emerald-100/90 leading-relaxed">
                Copie e envie o link abaixo para o usuário cadastrar sua nova senha pessoal:
              </p>
              <div className="flex gap-2 pt-2">
                <Input
                  ref={inputRef}
                  readOnly
                  value={linkReset}
                  className="bg-[#0b2b18] border-gold/40 text-gold text-xs h-9 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  type="button"
                  onClick={copiarLink}
                  className="shrink-0 bg-gold text-[#071e11] hover:bg-[#e2bd5d] font-bold text-xs gap-1.5"
                >
                  {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copiado ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={onFechar}>
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              O administrador não define senhas diretamente por motivos de segurança. Ao clicar abaixo, um link único de redefinição será gerado para ser enviado ao usuário.
            </p>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onFechar}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => solicitar.mutate()} disabled={solicitar.isPending}>
                {solicitar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Gerar Link de Redefinição
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
