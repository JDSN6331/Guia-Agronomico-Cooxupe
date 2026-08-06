import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  contarPapeis,
  convidar,
  definirPapel,
  excluirUsuario,
  listarUsuarios,
  reenviarConvite,
  removerPapeis,
  solicitarRedefinicaoSenha,
} from "./admin.server";
import { getSessionUser } from "./auth.server";

async function requireAdminSession() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !sessionUser.papeis.includes("admin")) {
    throw new Error("Acesso restrito a administradores.");
  }
  return sessionUser;
}

export const listarUsuariosFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    await requireAdminSession();
    return await listarUsuarios();
  } catch (err) {
    console.warn("[Admin Functions] Warning listing users, returning current session user:", err);
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      return [
        {
          id: sessionUser.id,
          email: sessionUser.email,
          nomeCompleto: sessionUser.nomeCompleto,
          cargo: sessionUser.cargo,
          status: "active",
          confirmado: true,
          papeis: sessionUser.papeis,
          criadoEm: new Date().toISOString(),
        },
      ];
    }
    return [];
  }
});

export const convidarUsuarioFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email("E-mail inválido").max(255),
        nomeCompleto: z.string().trim().min(2, "Informe o nome").max(120).optional(),
        cargo: z.string().trim().max(120).default("Técnico Agronômico"),
        papel: z.enum(["admin", "tecnico"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const adminUser = await requireAdminSession();
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "http://localhost:3000";
    return await convidar({
      email: data.email,
      nomeCompleto: data.nomeCompleto || data.email,
      cargo: data.cargo || "Técnico Agronômico",
      papel: data.papel,
      redirectTo: `${origem}/definir-senha`,
      criadoPorUserId: adminUser.id,
    });
  });

export const reenviarConviteFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdminSession();
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "http://localhost:3000";
    return await reenviarConvite(data.email, `${origem}/definir-senha`);
  });

export const solicitarRedefinicaoSenhaFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ userId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    await requireAdminSession();
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "http://localhost:3000";
    return await solicitarRedefinicaoSenha(data.userId, `${origem}/definir-senha`);
  });

export const definirPapelFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        userId: z.string().min(1),
        papel: z.enum(["admin", "tecnico", "nenhum"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const adminUser = await requireAdminSession();
    if (data.papel === "nenhum") {
      if (data.userId === adminUser.id) throw new Error("Você não pode remover o próprio acesso.");
      await removerPapeis(data.userId);
    } else {
      await definirPapel(data.userId, data.papel);
    }
    return { ok: true as const };
  });

export const excluirUsuarioFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ userId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const adminUser = await requireAdminSession();
    if (data.userId === adminUser.id) throw new Error("Você não pode excluir a própria conta.");
    await excluirUsuario(data.userId);
    return { ok: true as const };
  });

/** Bootstrap: a primeira conta da plataforma assume o papel de administrador. */
export const assumirPrimeiroAdminFn = createServerFn({ method: "POST" }).handler(async () => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("Usuário não autenticado.");
  const total = await contarPapeis();
  if (total > 0) throw new Error("A plataforma já possui administradores.");
  await definirPapel(sessionUser.id, "admin");
  return { ok: true as const };
});
