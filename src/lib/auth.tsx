import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agri_hub_user");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignora erro de json
      }
    }
    return null;
  });

  const [papeis, setPapeis] = useState<Papel[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agri_hub_papeis");
        if (saved) return JSON.parse(saved);
      } catch {
        // ignora
      }
    }
    return [];
  });

  const [carregando, setCarregando] = useState(true);

  const carregarSessao = useCallback(async () => {
    try {
      const res = await obterSessaoFn();
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
        if (typeof window !== "undefined") {
          localStorage.setItem("agri_hub_user", JSON.stringify(u));
          localStorage.setItem("agri_hub_papeis", JSON.stringify(roles));
        }
      } else {
        setUser(null);
        setPapeis([]);
        if (typeof window !== "undefined") {
          localStorage.removeItem("agri_hub_user");
          localStorage.removeItem("agri_hub_papeis");
        }
      }
    } catch {
      // se falhar temporariamente a rede, mantem o estado
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarSessao();
  }, [carregarSessao]);

  const entrar = useCallback(
    async (email: string, senha: string, manterConectado = false) => {
      setCarregando(true);
      try {
        const res = await entrarFn({
          data: {
            email: email.trim(),
            senha,
            manterConectado,
          },
        });

        // Garantir gravação do cookie no cliente
        if (typeof document !== "undefined" && res?.token) {
          const isHttps = window.location.protocol === "https:";
          const maxAge = manterConectado ? 30 * 24 * 3600 : 24 * 3600;
          document.cookie = `agri_hub_session=${res.token}; Path=/; max-age=${maxAge}; SameSite=Lax; ${
            isHttps ? "Secure;" : ""
          }`;
        }

        // Se o servidor retornou o usuário diretamente, usa-o imediatamente sem round-trip extra
        const returnedUser = (res as any)?.user;
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
          if (typeof window !== "undefined") {
            localStorage.setItem("agri_hub_user", JSON.stringify(u));
            localStorage.setItem("agri_hub_papeis", JSON.stringify(roles));
          }
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
          if (typeof window !== "undefined") {
            localStorage.setItem("agri_hub_user", JSON.stringify(u));
            localStorage.setItem("agri_hub_papeis", JSON.stringify(roles));
          }
          return u;
        }
        return null;
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  const sair = useCallback(async () => {
    try {
      await sairFn();
    } catch {
      // ignora erro de rede no logout
    } finally {
      setUser(null);
      setPapeis([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("agri_hub_user");
        localStorage.removeItem("agri_hub_papeis");
        document.cookie = "agri_hub_session=; Path=/; max-age=0; SameSite=Lax;";
        window.location.href = "/";
      }
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
