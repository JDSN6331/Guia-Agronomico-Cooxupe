import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { entrarFn, obterSessaoFn, sairFn } from "./auth.functions";

export type Papel = "admin" | "tecnico";

export type User = {
  id: string;
  email: string;
  nomeCompleto: string | null;
  cargo: string | null;
};

type AuthContexto = {
  carregando: boolean;
  user: User | null;
  session: { user: User } | null;
  papeis: Papel[];
  isAdmin: boolean;
  entrar: (email: string, senha: string, manterConectado?: boolean) => Promise<User | null>;
  recarregarSessao: () => Promise<void>;
  recarregarPapeis: () => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<AuthContexto>({
  carregando: true,
  user: null,
  session: null,
  papeis: [],
  isAdmin: false,
  entrar: async () => null,
  recarregarSessao: async () => {},
  recarregarPapeis: async () => {},
  sair: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const operacaoAtual = useRef(0);

  const carregarSessao = useCallback(async () => {
    const operacao = ++operacaoAtual.current;
    setCarregando(true);
    try {
      const res = await obterSessaoFn();
      if (operacao !== operacaoAtual.current) return;
      if (res?.user) {
        const u: User = {
          id: res.user.id,
          email: res.user.email,
          nomeCompleto: res.user.nomeCompleto,
          cargo: res.user.cargo,
        };
        setUser(u);
        const roles = (res.user.papeis || []) as Papel[];
        setPapeis(roles);
      } else {
        setUser(null);
        setPapeis([]);
      }
    } catch {
      if (operacao !== operacaoAtual.current) return;
      setUser(null);
      setPapeis([]);
    } finally {
      if (operacao === operacaoAtual.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarSessao();
  }, [carregarSessao]);

  const entrar = useCallback(
    async (email: string, senha: string, manterConectado = false) => {
      const operacao = ++operacaoAtual.current;
      setCarregando(true);
      try {
        const res = await entrarFn({
          data: {
            email: email.trim(),
            senha,
            manterConectado,
          },
        });

        if (operacao !== operacaoAtual.current) return null;

        // O cookie seguro é gravado exclusivamente pelo servidor.
        const returnedUser = res?.user;
        if (returnedUser) {
          const u: User = {
            id: returnedUser.id,
            email: returnedUser.email,
            nomeCompleto: returnedUser.nomeCompleto,
            cargo: returnedUser.cargo,
          };
          const roles = (returnedUser.papeis || ["tecnico"]) as Papel[];
          setUser(u);
          setPapeis(roles);
          return u;
        }

        // Fallback: obter do servidor
        const sess = await obterSessaoFn();
        if (sess?.user) {
          const u: User = {
            id: sess.user.id,
            email: sess.user.email,
            nomeCompleto: sess.user.nomeCompleto,
            cargo: sess.user.cargo,
          };
          const roles = (sess.user.papeis || []) as Papel[];
          setUser(u);
          setPapeis(roles);
          return u;
        }
        return null;
      } finally {
        if (operacao === operacaoAtual.current) setCarregando(false);
      }
    },
    [],
  );

  const sair = useCallback(async () => {
    ++operacaoAtual.current;
    setCarregando(true);
    setUser(null);
    setPapeis([]);
    try {
      await sairFn();
    } catch {
      // ignora erro de rede no logout
    } finally {
      // Remove também um eventual cookie legado criado por versões anteriores.
      if (typeof document !== "undefined") {
        document.cookie = "agri_hub_session=; Path=/; max-age=0; SameSite=Lax;";
      }
      setCarregando(false);
    }
  }, []);

  // Timeout de desconexão automática por 30 minutos de inatividade (30 * 60 * 1000 ms)
  useEffect(() => {
    if (!user) return;

    let timer: NodeJS.Timeout;
    const INATIVIDADE_MAXIMA = 30 * 60 * 1000;

    const resetarTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void sair().then(() => {
          toast.info("Sessão encerrada por inatividade (30 min) para sua segurança.", {
            duration: 7000,
          });
        });
      }, INATIVIDADE_MAXIMA);
    };

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, resetarTimer, { passive: true }));
    resetarTimer();

    return () => {
      clearTimeout(timer);
      eventos.forEach((e) => window.removeEventListener(e, resetarTimer));
    };
  }, [user, sair]);

  const session = useMemo(() => (user ? { user } : null), [user]);

  const valor = useMemo<AuthContexto>(
    () => ({
      carregando,
      user,
      session,
      papeis: Array.isArray(papeis) ? papeis : [],
      isAdmin: Array.isArray(papeis) && papeis.includes("admin"),
      entrar,
      recarregarSessao: carregarSessao,
      recarregarPapeis: carregarSessao,
      sair,
    }),
    [carregando, user, session, papeis, entrar, carregarSessao, sair],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  return useContext(Contexto);
}
