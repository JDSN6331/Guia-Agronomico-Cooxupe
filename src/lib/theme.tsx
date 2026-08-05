import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "light" | "dark";

type TemaContexto = { tema: Tema; alternar: () => void };

const Contexto = createContext<TemaContexto>({ tema: "light", alternar: () => {} });

const STORAGE_KEY = "agrobase-tema";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("light");

  useEffect(() => {
    const salvo = window.localStorage.getItem(STORAGE_KEY) as Tema | null;
    const preferido: Tema =
      salvo ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTema(preferido);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const proximo = atual === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, proximo);
      return proximo;
    });
  }, []);

  return <Contexto.Provider value={{ tema, alternar }}>{children}</Contexto.Provider>;
}

export function useTema() {
  return useContext(Contexto);
}
