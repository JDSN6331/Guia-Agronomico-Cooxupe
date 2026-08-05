import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTema } from "@/lib/theme";

export function ThemeToggle() {
  const { tema, alternar } = useTema();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={alternar}
      aria-label={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={tema === "dark" ? "Tema claro" : "Tema escuro"}
    >
      {tema === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </Button>
  );
}
