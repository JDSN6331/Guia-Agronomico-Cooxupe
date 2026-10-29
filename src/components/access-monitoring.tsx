import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Loader2 } from "lucide-react";
import { listarMonitoramentoFn, listarSessoesFn } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const dates = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Sao_Paulo",
});
function date(value: string | null) {
  return value ? dates.format(new Date(value)) : "—";
}
function duration(seconds: number | null) {
  if (seconds == null) return "Sem medição";
  if (seconds < 60) return seconds + " s";
  const minutes = Math.floor(seconds / 60);
  return minutes < 60
    ? minutes + " min"
    : Math.floor(minutes / 60) + " h " + (minutes % 60) + " min";
}

export function AccessMonitoring() {
  const { isAdmin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; nome: string } | null>(null);
  const [page, setPage] = useState(0);
  const users = useQuery({
    queryKey: ["monitoramento", user?.id],
    queryFn: () => listarMonitoramentoFn(),
    enabled: isAdmin,
    refetchInterval: 60_000,
  });
  const history = useQuery({
    queryKey: ["sessoes-monitoramento", user?.id, selected?.id, page],
    queryFn: () => listarSessoesFn({ data: { userId: selected!.id, page } }),
    enabled: isAdmin && Boolean(selected),
    refetchInterval: 60_000,
  });
  if (!isAdmin) return null;
  const rows = (users.data ?? []).filter((u) =>
    (u.nome + " " + u.email).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  const total = users.data?.reduce((acc, u) => acc + u.logins, 0) ?? 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Monitoramento de acessos</h2>
          <p className="text-xs text-muted-foreground">
            Horários de Brasília · atualização automática a cada minuto
          </p>
        </div>
        <Button
          variant="outline"
          disabled={users.isFetching}
          onClick={() => void users.refetch()}
          className="gap-2"
        >
          <RefreshCw className={"size-4 " + (users.isFetching ? "animate-spin" : "")} /> Atualizar
        </Button>
      </div>
      <p className="rounded-xl border border-border p-4 text-xs text-muted-foreground leading-relaxed">
        Cada login bem-sucedido cria uma sessão. A quantidade considera as sessões preservadas no
        banco, incluindo acessos anteriores. O tempo de uso é estimado a partir desta atualização,
        com a aba visível e conectada, em intervalos de até um minuto. Não mede atenção nem o tempo
        total de validade do login. Sem sinal por 90 segundos, o usuário deixa de aparecer como
        online. Fechar o navegador não registra uma saída exata.
      </p>
      {users.isPending ? (
        <div className="flex justify-center p-8">
          <Loader2 className="size-6 animate-spin" aria-label="Carregando acessos" />
        </div>
      ) : users.isError ? (
        <p role="alert" className="panel p-4 text-sm text-destructive">
          Não foi possível carregar os acessos. Tente atualizar.
        </p>
      ) : (
        <>
          {users.isRefetchError && (
            <p role="alert" className="text-sm text-destructive">
              Falha ao atualizar. Os dados abaixo são da última consulta bem-sucedida.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Usuários cadastrados", users.data.length],
              ["Logins registrados", total],
              ["Online (sinal recente)", users.data.filter((u) => u.online).length],
            ].map(([label, value]) => (
              <div key={label} className="panel p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <Input
            aria-label="Buscar usuário por nome ou e-mail"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="panel overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {[
                    "Usuário",
                    "Presença",
                    "Logins",
                    "Último login",
                    "Última atividade",
                    "Uso estimado",
                    "Histórico",
                  ].map((h) => (
                    <th key={h} scope="col" className="p-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <p className="font-semibold">{u.nome || u.email}</p>
                      <p className="text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.online ? "default" : "outline"}>
                        {u.online ? "Online" : "Sem sinal recente"}
                      </Badge>
                    </td>
                    <td className="p-3">{u.logins}</td>
                    <td className="p-3 whitespace-nowrap">{date(u.ultimoLogin)}</td>
                    <td className="p-3 whitespace-nowrap">{date(u.ultimaAtividade)}</td>
                    <td className="p-3 whitespace-nowrap">
                      {duration(u.sessoesMedidas ? u.segundosAtivos : null)}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={"Ver sessões de " + (u.nome || u.email)}
                        onClick={() => {
                          setPage(0);
                          setSelected({ id: u.id, nome: u.nome || u.email });
                        }}
                      >
                        Ver sessões
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
            )}
          </div>
        </>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sessões de {selected?.nome}</DialogTitle>
            <DialogDescription>
              Histórico de logins. Uso estimado somente após o início da medição; sessões antigas
              ficam sem medição.
            </DialogDescription>
          </DialogHeader>
          {history.isPending ? (
            <p className="p-4 text-sm">Carregando sessões...</p>
          ) : history.isError ? (
            <div role="alert" className="text-sm text-destructive">
              Não foi possível carregar as sessões.{" "}
              <Button variant="outline" onClick={() => void history.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              {history.isRefetchError && (
                <p role="alert" className="text-sm text-destructive">
                  Falha ao atualizar o histórico. Exibindo a última consulta.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Login",
                        "Estado",
                        "Saída registrada",
                        "Última atividade",
                        "Uso estimado",
                      ].map((h) => (
                        <th key={h} scope="col" className="p-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.sessoes.map((s) => {
                      const status = s.encerradaEm
                        ? "Encerrada"
                        : Date.parse(s.expiraEm) <= Date.now()
                          ? "Expirada"
                          : s.ultimaAtividade &&
                              Date.now() - Date.parse(s.ultimaAtividade) <= 90_000
                            ? "Online"
                            : "Sem sinal recente";
                      return (
                        <tr key={s.id} className="border-b border-border">
                          <td className="p-3 whitespace-nowrap">{date(s.inicio)}</td>
                          <td className="p-3 whitespace-nowrap">{status}</td>
                          <td className="p-3 whitespace-nowrap">{date(s.encerradaEm)}</td>
                          <td className="p-3 whitespace-nowrap">{date(s.ultimaAtividade)}</td>
                          <td
                            className="p-3 whitespace-nowrap"
                            title={
                              s.medicaoDesde ? "Medição desde " + date(s.medicaoDesde) : undefined
                            }
                          >
                            {duration(s.segundosAtivos)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {history.data.total === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum login registrado.</p>
              )}
              <div className="flex items-center justify-between gap-2 text-xs">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span>
                  Página {page + 1} de {Math.max(1, Math.ceil(history.data.total / 20))} ·{" "}
                  {history.data.total} sessões
                </span>
                <Button
                  variant="outline"
                  disabled={(page + 1) * 20 >= history.data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
