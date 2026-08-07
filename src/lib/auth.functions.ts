import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  definirSenhaComToken,
  encerrarSessao,
  entrarComEmailESenha,
  getSessionUser,
  solicitarCadastro,
  solicitarRecuperacaoSenha,
  validarTokenConvite,
} from "./auth.server";

export const obterSessaoFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getSessionUser();
  return { user };
});

export const entrarFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email("E-mail inválido").max(255),
        senha: z.string().min(1, "Informe a senha").max(72),
        manterConectado: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return await entrarComEmailESenha(data.email, data.senha, Boolean(data.manterConectado));
  });

export const sairFn = createServerFn({ method: "POST" }).handler(async () => {
  await encerrarSessao();
  return { ok: true as const };
});

export const validarConviteFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    return await validarTokenConvite(data.token);
  });

export const definirSenhaFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        token: z.string().min(1),
        senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return await definirSenhaComToken(data.token, data.senha);
  });

export const solicitarRecuperacaoFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "";
    return await solicitarRecuperacaoSenha(data.email, `${origem}/definir-senha`);
  });

export const solicitarCadastroFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        nomeCompleto: z.string().trim().min(2, "Informe seu nome completo").max(120),
        email: z.string().trim().email("Informe um e-mail válido").max(255),
        cargo: z.string().trim().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const origem = request ? new URL(request.url).origin : "";
    return await solicitarCadastro(data.email, data.nomeCompleto, data.cargo, `${origem}/definir-senha`);
  });
