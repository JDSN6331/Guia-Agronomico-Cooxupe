import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "tecnico";

type AuthContexto = {
  carregando: boolean;
  session: Session | null;
  user: User | null;
  papeis: Papel[];
  isAdmin: boolean;
  recarregarPapeis: () => Promise<void>;
};

const Contexto = createContext<AuthContexto>({
  carregando: true,
  session: null,
  user: null,
  papeis: [],
  isAdmin: false,
  recarregarPapeis: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
      if (!novaSessao) setPapeis([]);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const carregarPapeis = useMemo(
    () => async () => {
      if (!userId) {
        setPapeis([]);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      setPapeis((data ?? []).map((r) => r.role as Papel));
    },
    [userId],
  );

  useEffect(() => {
    void carregarPapeis();
  }, [carregarPapeis]);

  const valor = useMemo<AuthContexto>(
    () => ({
      carregando,
      session,
      user: session?.user ?? null,
      papeis,
      isAdmin: papeis.includes("admin"),
      recarregarPapeis: carregarPapeis,
    }),
    [carregando, session, papeis, carregarPapeis],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  return useContext(Contexto);
}
