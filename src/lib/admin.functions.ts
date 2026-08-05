import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  contarPapeis,
  convidar,
  definirPapel,
  excluirUsuario,
  listarUsuarios,
  reenviarConvite,
  removerPapeis,
} from "./admin.server";

export const listarUsuariosFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return listarUsuarios();
  });

export const convidarUsuarioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email("E-mail inválido").max(255),
        nomeCompleto: z.string().trim().min(2, "Informe o nome").max(120),
        cargo: z.string().trim().max(120).default(""),
        papel: z.enum(["admin", "tecnico"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "";
    await convidar({ ...data, redirectTo: `${origem}/definir-senha` });
    return { ok: true as const };
  });

export const reenviarConviteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "";
    await reenviarConvite(data.email, `${origem}/definir-senha`);
    return { ok: true as const };
  });

export const definirPapelFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        papel: z.enum(["admin", "tecnico", "nenhum"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.papel === "nenhum") {
      if (data.userId === context.userId) throw new Error("Você não pode remover o próprio acesso.");
      await removerPapeis(data.userId);
    } else {
      await definirPapel(data.userId, data.papel);
    }
    return { ok: true as const };
  });

export const excluirUsuarioFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    await excluirUsuario(data.userId);
    return { ok: true as const };
  });

/** Bootstrap: a primeira conta da plataforma assume o papel de administrador. */
export const assumirPrimeiroAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const total = await contarPapeis();
    if (total > 0) throw new Error("A plataforma já possui administradores.");
    await definirPapel(context.userId, "admin");
    return { ok: true as const };
  });
