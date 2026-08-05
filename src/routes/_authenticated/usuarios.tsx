import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck, MoreVertical, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários | AgroBase" },
      {
        name: "description",
        content:
          "Administração de acessos: convide integrantes por e-mail, defina o papel de cada usuário e acompanhe as confirmações.",
      },
      { property: "og:title", content: "Usuários | AgroBase" },
      {
        property: "og:description",
        content: "Gestão de acessos da base de conhecimento AgroBase.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaUsuarios,
});

const PAPEL_ROTULO: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
};

function PaginaUsuarios() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();

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
      toast.success("Papel atualizado.");
      await invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reenviar = useMutation({
    mutationFn: (email: string) => reenviarConviteFn({ data: { email } }),
    onSuccess: () => toast.success("Convite reenviado."),
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: (userId: string) => excluirUsuarioFn({ data: { userId } }),
    onSuccess: async () => {
      toast.success("Usuário removido.");
      await invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <AppShell titulo="Usuários">
        <div className="panel mx-auto max-w-md p-8 text-center">
          <p className="font-display text-base font-semibold">Área restrita</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Apenas administradores podem gerenciar acessos.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      titulo="Usuários"
      descricao="Convites por e-mail, papéis de acesso e status de confirmação"
      acoes={<DialogConvite onPronto={invalidar} />}
    >
      <div className="mx-auto max-w-5xl">
        {usuarios.isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando usuários…
          </div>
        ) : usuarios.isError ? (
          <div className="panel p-6 text-sm text-destructive">
            Não foi possível carregar a lista de usuários.
          </div>
        ) : (
          <div className="space-y-3">
            {(usuarios.data ?? []).map((u) => (
              <article key={u.id} className="panel flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold">
                    {u.nomeCompleto ?? u.email}
                    {u.id === user?.id && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  {u.cargo && <p className="truncate text-xs text-muted-foreground">{u.cargo}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={u.confirmado ? "secondary" : "outline"}>
                    {u.confirmado ? "Confirmado" : "Convite pendente"}
                  </Badge>
                  <Select
                    value={u.papel ?? "nenhum"}
                    onValueChange={(v) =>
                      papel.mutate({ userId: u.id, papel: v as "admin" | "tecnico" | "nenhum" })
                    }
                  >
                    <SelectTrigger className="w-[168px]">
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
                      <Button variant="ghost" size="icon" aria-label="Mais ações">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => reenviar.mutate(u.email)}>
                        <MailCheck className="mr-2 size-4" /> Reenviar convite
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={u.id === user?.id}
                        onClick={() => excluir.mutate(u.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" /> Excluir usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DialogConvite({ onPronto }: { onPronto: () => Promise<void> }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [papel, setPapel] = useState<"admin" | "tecnico">("tecnico");

  const convidar = useMutation({
    mutationFn: () =>
      convidarUsuarioFn({ data: { email, nomeCompleto: nome, cargo, papel } }),
    onSuccess: async () => {
      toast.success("Convite enviado. O usuário definirá a senha pelo link do e-mail.");
      setAberto(false);
      setEmail("");
      setNome("");
      setCargo("");
      await onPronto();
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível enviar o convite."),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4 sm:mr-2" />
          <span className="hidden sm:inline">Convidar</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            Enviaremos um e-mail de confirmação. O próprio usuário define a senha no primeiro
            acesso.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            convidar.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-convite">E-mail corporativo</Label>
            <Input
              id="email-convite"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo (opcional)</Label>
            <Input
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label>Papel de acesso</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as "admin" | "tecnico")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico — consulta completa</SelectItem>
                <SelectItem value="admin">Administrador — consulta e gestão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={convidar.isPending} className="w-full">
              {convidar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
