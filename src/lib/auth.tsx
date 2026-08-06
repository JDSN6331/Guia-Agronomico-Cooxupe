import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { obterSessaoFn, sairFn } from "./auth.functions";

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
  recarregarSessao: async () => {},
  recarregarPapeis: async () => {},
  sair: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarSessao = useCallback(async () => {
    try {
      const res = await obterSessaoFn();
      if (res.user) {
        const u: User = {
          id: res.user.id,
          email: res.user.email,
          nomeCompleto: res.user.nomeCompleto,
          cargo: res.user.cargo,
        };
        setUser(u);
        setPapeis(res.user.papeis as Papel[]);
      } else {
        setUser(null);
        setPapeis([]);
      }
    } catch {
      setUser(null);
      setPapeis([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarSessao();
  }, [carregarSessao]);

  const sair = useCallback(async () => {
    try {
      await sairFn();
    } finally {
      setUser(null);
      setPapeis([]);
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
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
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
      recarregarSessao: carregarSessao,
      recarregarPapeis: carregarSessao,
      sair,
    }),
    [carregando, user, session, papeis, carregarSessao, sair],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  return useContext(Contexto);
}
