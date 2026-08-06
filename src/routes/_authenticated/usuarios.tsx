import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileUp,
  Info,
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
  restaurarProgramaPadrao,
  salvarProgramaAtual,
  type ProgramaData,
} from "@/lib/programa-store";
import { exportarProgramaParaExcel } from "@/lib/excel-export";
import { copiarTexto } from "@/lib/share-utils";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestão do Sistema | AgroBase" },
      {
        name: "description",
        content:
          "Administração de acessos, convites de novos usuários e atualização da planilha do programa de manejo.",
      },
      { property: "og:title", content: "Gestão do Sistema | AgroBase" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaGestaoSistema,
});

const PAPEL_ROTULO: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
};

function iniciais(str: string) {
  return str
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function PaginaGestaoSistema() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [programaAtual, setProgramaAtual] = useState<ProgramaData>(obterProgramaAtual);
  const [usuarioRedefinirSenha, setUsuarioRedefinirSenha] = useState<{ id: string; nome: string; email: string } | null>(null);

  useEffect(() => {
    function atualizar() {
      setProgramaAtual(obterProgramaAtual());
    }
    window.addEventListener("storage_programa_atualizado", atualizar);
    return () => window.removeEventListener("storage_programa_atualizado", atualizar);
  }, []);

  const usuarios = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listarUsuariosFn(),
    enabled: isAdmin,
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ["usuarios"] });

  const papel = useMutation({
    mutationFn: (v: { userId: string; papel: "admin" | "tecnico" | "nenhum" }) =>
      definirPapelFn({ data: v }),
    onSuccess: async () => {
      toast.success("Papel de acesso atualizado.");
      await invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reenviar = useMutation({
    mutationFn: async (email: string) => {
      const res = await reenviarConviteFn({ data: { email } });
      if (res.enviadoPorSmtp) {
        toast.success(`Convite reenviado para ${email}.`);
      } else {
        toast.info(`Convite registrado para ${email}. Link salvo no terminal.`);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(res.link);
          toast.success("Link de ativação copiado para a área de transferência!");
        }
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: (userId: string) => excluirUsuarioFn({ data: { userId } }),
    onSuccess: async () => {
      toast.success("Registro removido com sucesso.");
      await invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <AppShell titulo="Gestão do Sistema">
        <div className="panel mx-auto max-w-md p-8 text-center space-y-3">
          <Shield className="mx-auto size-10 text-muted-foreground" />
          <p className="font-display text-base font-semibold">Área Restrita</p>
          <p className="text-sm text-muted-foreground">
            Apenas usuários administradores podem acessar as configurações de gestão e permissões.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      titulo="Gestão do Sistema"
      descricao="Gerenciamento de convites, permissões de acesso e atualização de dados agronômicos"
      acoes={<DialogConvite onPronto={invalidar} />}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <Tabs defaultValue="acessos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="acessos" className="gap-2">
              <Users className="size-4" />
              <span>Acessos & Convites</span>
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2">
              <FileSpreadsheet className="size-4" />
              <span>Atualização da Base (Planilha)</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Acessos e Convites */}
          <TabsContent value="acessos" className="mt-5 space-y-4">
            {usuarios.isLoading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando lista de usuários…
              </div>
            ) : usuarios.isError ? (
              <div className="panel p-6 text-sm text-destructive">
                Não foi possível carregar os usuários cadastrados.
              </div>
            ) : (
              <div className="space-y-3">
                {(usuarios.data ?? []).map((u) => {
                  const ehAdmin = u.papel === "admin";
                  const ehEuMesmo = u.id === user?.id;

                  return (
                    <article
                      key={u.id}
                      className="panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
                    >
                      {/* Avatar + Informações do Usuário */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                          {iniciais(u.nomeCompleto || u.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate font-display text-sm font-semibold">
                              {u.nomeCompleto ?? u.email}
                            </p>
                            {ehEuMesmo && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                você
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          {u.cargo && <p className="truncate text-xs text-muted-foreground">{u.cargo}</p>}
                        </div>
                      </div>

                      {/* Status da Conta e Ações */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0 border-t border-border/60 sm:border-t-0 shrink-0">
                        <Badge
                          variant={u.confirmado ? "secondary" : "outline"}
                          className="text-xs shrink-0"
                        >
                          {u.confirmado ? "Confirmado" : "Convite pendente"}
                        </Badge>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Select
                            value={u.papel ?? "nenhum"}
                            onValueChange={(v) =>
                              papel.mutate({ userId: u.id, papel: v as "admin" | "tecnico" | "nenhum" })
                            }
                          >
                            <SelectTrigger className="w-[145px] sm:w-[160px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{PAPEL_ROTULO["admin"]}</SelectItem>
                              <SelectItem value="tecnico">{PAPEL_ROTULO["tecnico"]}</SelectItem>
                              <SelectItem value="nenhum">Sem acesso</SelectItem>
                            </SelectContent>
                          </Select>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="Ações do usuário">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Opções do Usuário</DropdownMenuLabel>
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
                                disabled={ehEuMesmo || ehAdmin}
                                onClick={() => excluir.mutate(u.id)}
                                className="text-destructive focus:text-destructive"
                                title={
                                  ehAdmin
                                    ? "Trava de Segurança: Usuários administradores não podem ser excluídos diretamente. Altere para Técnico antes."
                                    : undefined
                                }
                              >
                                <Trash2 className="mr-2 size-4 text-destructive" />
                                <span>{u.confirmado ? "Excluir usuário" : "Cancelar convite"}</span>
                                {ehAdmin && <Lock className="ml-auto size-3 text-muted-foreground" />}
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
                      {programaAtual.versao || "Programa de Manejo Cooxupé (Oficial 2026)"}
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
                      toast.success("Base restaurada para o padrão oficial 2026.");
                    }}
                    className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="size-3.5" /> Restaurar Padrão
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
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
                    Linha Foliar
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-primary">
                    {programaAtual.foliar?.length || 0} <span className="text-xs font-normal">itens</span>
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
                        salvarProgramaAtual(data);
                        setProgramaAtual(data);
                        toast.success("Nova base agronômica aplicada com sucesso!");
                      } catch (err: any) {
                        toast.error(err.message || "Erro ao processar o arquivo enviado. Certifique-se de que é uma planilha válida.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </div>

              <div className="rounded-xl bg-card p-4 border border-border text-xs leading-relaxed text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Info className="size-4 text-gold shrink-0" />
                  <span>Como funciona a atualização?</span>
                </div>
                <p>
                  Quando uma nova safra ou atualização técnica for lançada pela equipe de Desenvolvimento Técnico, basta exportar a nova planilha e enviá-la acima. A aplicação valida a estrutura automaticamente e disponibiliza os novos produtos e dosagens para toda a equipe.
                </p>
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

function DialogRedefinirSenha({
  usuario,
  onFechar,
}: {
  usuario: { id: string; nome: string; email: string };
  onFechar: () => void;
}) {
  const [linkGerado, setLinkGerado] = useState<{ link: string; enviadoPorSmtp: boolean } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const solicitar = useMutation({
    mutationFn: () => solicitarRedefinicaoSenhaFn({ data: { userId: usuario.id } }),
    onSuccess: (res) => {
      if (res.enviadoPorSmtp) {
        toast.success(`E-mail de redefinição enviado com sucesso para ${usuario.email}!`);
        onFechar();
      } else {
        toast.success("Link de redefinição de senha gerado!");
        setLinkGerado({ link: res.link, enviadoPorSmtp: false });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível gerar o link de redefinição."),
  });

  async function copiarLink() {
    if (linkGerado?.link) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
      }
      const ok = await copiarTexto(linkGerado.link, inputRef.current);
      if (ok) {
        setCopiado(true);
        toast.success("Link de redefinição copiado para a área de transferência!");
        setTimeout(() => setCopiado(false), 2500);
      } else {
        toast.error("Não foi possível copiar o link.");
      }
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinição de Senha do Usuário</DialogTitle>
          <DialogDescription>
            Gerar link para <strong>{usuario.nome}</strong> ({usuario.email}) redefinir a própria senha com segurança.
          </DialogDescription>
        </DialogHeader>

        {linkGerado ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-gold">
                <Info className="size-4 shrink-0" />
                <span>Link de Redefinição Gerado!</span>
              </div>
              <p className="text-muted-foreground">
                O próprio usuário deve abrir o link abaixo para cadastrar sua nova senha de uso pessoal.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Link de Redefinição de Senha</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  readOnly
                  value={linkGerado.link}
                  onClick={(e) => e.currentTarget.select()}
                  className="text-xs font-mono bg-muted select-all"
                />
                <Button size="sm" variant="outline" onClick={copiarLink} className="shrink-0 gap-1.5">
                  {copiado ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  <span>{copiado ? "Copiado!" : "Copiar"}</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button onClick={onFechar} className="w-full">
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao confirmar, um link exclusivo com validade de 48 horas será gerado. O próprio usuário poderá definir a sua nova senha pessoal ao acessar o link.
            </p>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onFechar}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => solicitar.mutate()}
                disabled={solicitar.isPending}
              >
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

function DialogConvite({ onPronto }: { onPronto: () => Promise<void> }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [papel, setPapel] = useState<"admin" | "tecnico">("tecnico");
  const [linkGerado, setLinkGerado] = useState<{ email: string; link: string; enviadoPorSmtp: boolean } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convidar = useMutation({
    mutationFn: () =>
      convidarUsuarioFn({ data: { email, nomeCompleto: nome, cargo, papel } }),
    onSuccess: async (res) => {
      await onPronto();
      if (res.enviadoPorSmtp) {
        toast.success("Convite enviado com sucesso para a caixa de entrada!");
        setAberto(false);
        limparForm();
      } else {
        toast.success(`Convite criado com sucesso para ${res.email}!`);
        setLinkGerado({ email: res.email, link: res.link, enviadoPorSmtp: false });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível enviar o convite."),
  });

  function limparForm() {
    setEmail("");
    setNome("");
    setCargo("");
    setLinkGerado(null);
    setCopiado(false);
  }

  function fechar(open: boolean) {
    setAberto(open);
    if (!open) {
      setTimeout(limparForm, 300);
    }
  }

  async function copiarLink() {
    if (linkGerado?.link) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, 99999);
      }
      const ok = await copiarTexto(linkGerado.link, inputRef.current);
      if (ok) {
        setCopiado(true);
        toast.success("Link de ativação copiado para a área de transferência!");
        setTimeout(() => setCopiado(false), 2500);
      } else {
        toast.error("Não foi possível copiar o link.");
      }
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 px-3 gap-1.5 font-medium">
          <UserPlus className="size-4" />
          <span>Convidar</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar integrante</DialogTitle>
          <DialogDescription>
            Enviaremos um e-mail de confirmação. O próprio usuário define a senha no primeiro
            acesso.
          </DialogDescription>
        </DialogHeader>

        {linkGerado ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-gold">
                <Info className="size-4 shrink-0" />
                <span>Convite registrado com sucesso!</span>
              </div>
              <p className="text-muted-foreground">
                <strong>Servidor SMTP de e-mail não configurado em ambiente local.</strong> O e-mail não é enviado para a caixa de entrada real a menos que haja credenciais SMTP configuradas no arquivo <code className="bg-background px-1 py-0.5 rounded border border-border">.env</code> (<code className="text-primary">SMTP_HOST</code>, <code className="text-primary">SMTP_USER</code>, <code className="text-primary">SMTP_PASS</code>).
              </p>
              <p className="text-muted-foreground">
                O link de ativação foi impresso no terminal e pode ser copiado diretamente abaixo:
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Link de Ativação do Usuário</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  readOnly
                  value={linkGerado.link}
                  onClick={(e) => e.currentTarget.select()}
                  className="text-xs font-mono bg-muted select-all"
                />
                <Button size="sm" variant="outline" onClick={copiarLink} className="shrink-0 gap-1.5">
                  {copiado ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  <span>{copiado ? "Copiado!" : "Copiar"}</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button onClick={() => fechar(false)} className="w-full">
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              convidar.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={120}
                placeholder="Ex: Maria Silva"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-convite">E-mail corporativo</Label>
              <Input
                id="email-convite"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                placeholder="nome@cooxupe.com.br"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo (opcional)</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                maxLength={120}
                placeholder="Ex: Engenheiro Agrônomo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel de acesso</Label>
              <Select value={papel} onValueChange={(v) => setPapel(v as "admin" | "tecnico")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico - consulta completa</SelectItem>
                  <SelectItem value="admin">Administrador - consulta e gestão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={convidar.isPending} className="w-full">
                {convidar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
