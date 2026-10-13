import { randomUUID } from "node:crypto";
// Core Authentication Server logic powered by PostgreSQL / SQLite
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { sql } from "./db.server";
import { generateToken, hashPassword, hashToken, verifyPassword } from "./crypto.server";
import {
  enviarEmailConvite,
  enviarEmailNotificacaoAdmin,
  enviarEmailRecuperacao,
} from "./email.server";

export type SessionUser = {
  id: string;
  email: string;
  nomeCompleto: string | null;
  cargo: string | null;
  papeis: ("admin" | "tecnico")[];
};

const SESSION_COOKIE_NAME = "agri_hub_session";
const SESSION_EXPIRATION_DAYS = 30;
const SESSION_SHORT_HOURS = 12;

/**
 * Lê o token de sessão enviado pelo navegador no cookie HTTP-Only.
 */
function lerTokenDoCookie(): string | undefined {
  try {
    const cookieHeader = getRequest()?.headers.get("cookie");
    if (!cookieHeader) return undefined;
    for (const parte of cookieHeader.split(";")) {
      const [k, ...v] = parte.trim().split("=");
      if (k === SESSION_COOKIE_NAME) return v.join("=") || undefined;
    }
  } catch {
    // fora de contexto HTTP request
  }
  return undefined;
}

/**
 * Revoga a sessão que o navegador já possuía (se houver). Chamado sempre que uma
 * nova sessão é criada, para que um login nunca deixe a sessão de outro usuário
 * válida naquele mesmo navegador.
 */
async function revogarSessaoDoNavegador() {
  const token = lerTokenDoCookie();
  if (!token) return;
  try {
    await sql`
      UPDATE public.user_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE session_token_hash = ${hashToken(token)} AND revoked_at IS NULL
    `;
  } catch (err) {
    console.warn("[Auth Warning] Não foi possível revogar a sessão anterior:", err);
  }
}

/**
 * Retorna a sessão ativa a partir do cookie de sessão HTTP-Only ou header Authorization.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  let sessionToken: string | undefined;

  try {
    const request = getRequest();
    if (request) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(";").map((c) => {
            const [k, ...v] = c.trim().split("=");
            return [k, v.join("=")];
          }),
        );
        sessionToken = cookies[SESSION_COOKIE_NAME];
      }

      if (!sessionToken) {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          sessionToken = authHeader.substring(7).trim();
        }
      }
    }
  } catch {
    // fora de contexto HTTP request
  }

  if (!sessionToken) return null;

  try {
    const tokenHash = hashToken(sessionToken);
    const [row] = await sql`
      SELECT
        s.id as session_id,
        u.id::text as user_id,
        u.email::text as email,
        u.nome_completo as nome_completo,
        u.cargo as cargo,
        u.status::text as status
      FROM public.user_sessions s
      JOIN public.app_users u ON u.id = s.user_id
      WHERE s.session_token_hash = ${tokenHash}
        AND s.expires_at > CURRENT_TIMESTAMP
        AND s.revoked_at IS NULL
        AND u.status != 'disabled'::public.user_status
    `;

    if (row) {
      const roleRows = await sql`
        SELECT role::text FROM public.user_roles WHERE user_id = ${row.user_id}::uuid
      `;
      const papeis = roleRows.map((r: any) => r.role as "admin" | "tecnico");
      if (papeis.length === 0) papeis.push("tecnico");

      return {
        id: row.user_id,
        email: row.email,
        nomeCompleto: row.nome_completo || row.email,
        cargo: row.cargo || "Técnico Agronômico",
        papeis,
      };
    }
  } catch (err) {
    console.error("[Auth Error] Erro ao verificar sessão no banco:", err);
  }

  // Token inexistente, expirado, revogado ou banco indisponível nunca deve
  // conceder acesso. Os dados dos usuários permanecem inalterados.
  return null;
}

/**
 * Autentica usuário via e-mail e senha.
 */
export async function entrarComEmailESenha(email: string, senha: string, manterConectado = false) {
  const rawEmail = email.trim().toLowerCase();
  const duracaoMs = manterConectado
    ? SESSION_EXPIRATION_DAYS * 24 * 3600 * 1000
    : SESSION_SHORT_HOURS * 3600 * 1000;

  // Tratamento padrão para outros usuários
  let user: { id: string; email: string; nome_completo?: string; cargo?: string; password_hash: string | null; status: string } | undefined;
  try {
    const [row] = await sql`
      SELECT
        id::text,
        email::text,
        nome_completo,
        cargo,
        password_hash,
        status::text
      FROM public.app_users
      WHERE lower(email::text) = ${rawEmail}
    `;
    user = row;
  } catch (err) {
    console.error("[Auth Error] Falha ao consultar banco de dados:", err);
    throw new Error("Não foi possível conectar ao banco de dados.");
  }

  if (!user || !user.password_hash) {
    throw new Error("E-mail ou senha incorretos.");
  }

  const valido = await verifyPassword(senha, user.password_hash);
  if (!valido) {
    throw new Error("E-mail ou senha incorretos.");
  }

  if (user.status !== "active") {
    throw new Error("Sua conta está desativada. Entre em contato com o suporte.");
  }

  // Encerra qualquer sessão anterior deste navegador antes de abrir a nova
  await revogarSessaoDoNavegador();

  // Criar nova sessão
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + duracaoMs);
  const expiresStr = expiresAt.toISOString();

  const sessionTokenHash = hashToken(sessionToken);
  const sessionId = randomUUID();
  try {
    await sql`UPDATE public.app_users SET last_sign_in_at = CURRENT_TIMESTAMP WHERE id = ${user.id}::uuid`;
    await sql`
      INSERT INTO public.user_sessions (id, user_id, session_token_hash, expires_at)
      VALUES (${sessionId}::uuid, ${user.id}::uuid, ${sessionTokenHash}, ${expiresStr})
    `;
  } catch (err) {
    console.error("[Auth Error] Não foi possível criar a sessão:", err);
    throw new Error("Não foi possível iniciar sua sessão. Tente novamente.");
  }

  let papeis: ("admin" | "tecnico")[] = ["tecnico"];
  try {
    const roleRows = await sql`
      SELECT role::text FROM public.user_roles WHERE user_id = ${user.id}::uuid
    `;
    const p = roleRows.map((r: any) => r.role as "admin" | "tecnico");
    if (p.length > 0) papeis = p;
  } catch {
    // ignora erro de roles
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    nomeCompleto: user.nome_completo || user.email,
    cargo: user.cargo || "Técnico Agronômico",
    papeis,
  };

  setCookieHeader(sessionToken, expiresAt, manterConectado);
  return { ok: true, user: sessionUser };
}

/**
 * Encerra a sessão ativa.
 */
export async function encerrarSessao() {
  try {
    const sessionToken = lerTokenDoCookie();
    if (sessionToken) {
      const tokenHash = hashToken(sessionToken);
      await sql`
        UPDATE public.user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE session_token_hash = ${tokenHash}
      `;
    }
  } catch {
    // ignora erros se fora do contexto de requisição
  }

  setCookieHeader("", new Date(0));
}

/**
 * Valida o token de convite recebido no e-mail.
 */
export async function validarTokenConvite(token: string) {
  const tokenHash = hashToken(token);

  try {
    // 1. Tenta encontrar na tabela de convites
    const [inviteRow] = await sql`
      SELECT
        i.id::text as invite_id,
        i.email::text as email,
        u.id::text as user_id,
        u.nome_completo as nome_completo
      FROM public.user_invites i
      JOIN public.app_users u ON u.id = i.user_id
      WHERE i.token_hash = ${tokenHash}
        AND i.expires_at > CURRENT_TIMESTAMP
        AND i.accepted_at IS NULL
    `;

    if (inviteRow) {
      return {
        valido: true,
        email: inviteRow.email,
        nomeCompleto: inviteRow.nome_completo,
      };
    }

    // 2. Tenta encontrar na tabela de redefinição de senha
    const [resetRow] = await sql`
      SELECT
        r.id::text as reset_id,
        u.email::text as email,
        u.id::text as user_id,
        u.nome_completo as nome_completo
      FROM public.password_reset_tokens r
      JOIN public.app_users u ON u.id = r.user_id
      WHERE r.token_hash = ${tokenHash}
        AND r.expires_at > CURRENT_TIMESTAMP
        AND r.used_at IS NULL
    `;

    if (resetRow) {
      return {
        valido: true,
        email: resetRow.email,
        nomeCompleto: resetRow.nome_completo,
      };
    }

    return { valido: false };
  } catch {
    return { valido: false };
  }
}

/**
 * Define a senha do usuário usando um token de convite ou de redefinição de senha.
 */
export async function definirSenhaComToken(token: string, senha: string) {
  const tokenHash = hashToken(token);
  let userId: string | null = null;

  try {
    // 1. Tenta localizar por convite
    const [invite] = await sql`
      SELECT id::text, user_id::text, email::text
      FROM public.user_invites
      WHERE token_hash = ${tokenHash}
        AND expires_at > CURRENT_TIMESTAMP
        AND accepted_at IS NULL
    `;

    if (invite) {
      userId = invite.user_id;
      await sql`
        UPDATE public.user_invites
        SET accepted_at = CURRENT_TIMESTAMP
        WHERE id = ${invite.id}::uuid
      `;
    } else {
      // 2. Tenta localizar por token de redefinição de senha
      const [reset] = await sql`
        SELECT id::text, user_id::text
        FROM public.password_reset_tokens
        WHERE token_hash = ${tokenHash}
          AND expires_at > CURRENT_TIMESTAMP
          AND used_at IS NULL
      `;
      if (reset) {
        userId = reset.user_id;
        await sql`
          UPDATE public.password_reset_tokens
          SET used_at = CURRENT_TIMESTAMP
          WHERE id = ${reset.id}::uuid
        `;
      }
    }
  } catch (err) {
    console.warn("[Auth Warning] Erro ao consultar tabelas de token:", err);
  }

  if (!userId) {
    throw new Error("Link de redefinição ou convite inválido ou expirado. Peça a um administrador para reenviar.");
  }

  const newPasswordHash = await hashPassword(senha);

  // Atualizar usuário
  await sql`
    UPDATE public.app_users
    SET
      password_hash = ${newPasswordHash},
      status = 'active'::public.user_status,
      email_verified_at = CURRENT_TIMESTAMP,
      last_sign_in_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}::uuid
  `;

  // Criar sessão automaticamente e logar (encerrando antes a sessão anterior do navegador)
  await revogarSessaoDoNavegador();
  const sessionToken = generateToken();
  const sessionTokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_SHORT_HOURS * 3600 * 1000);
  const expiresStr = expiresAt.toISOString();
  const sessionId = randomUUID();

  try {
    await sql`
      INSERT INTO public.user_sessions (id, user_id, session_token_hash, expires_at)
      VALUES (${sessionId}::uuid, ${userId}::uuid, ${sessionTokenHash}, ${expiresStr})
    `;
  } catch (err) {
    console.error("[Auth Error] Não foi possível criar a sessão após definir a senha:", err);
    throw new Error("Senha definida, mas não foi possível iniciar a sessão. Faça login novamente.");
  }

  setCookieHeader(sessionToken, expiresAt, false);

  return { ok: true };
}

/**
 * Envia e-mail com link para recuperar/redefinir senha.
 */
export async function solicitarRecuperacaoSenha(email: string, redirectTo: string) {
  const rawEmail = email.trim().toLowerCase();

  try {
    const [user] = await sql`
      SELECT id::text, email::text, nome_completo
      FROM public.app_users
      WHERE lower(email::text) = ${rawEmail}
    `;

    if (!user) {
      return { ok: true };
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000);
    const expiresStr = expiresAt.toISOString();
    const tokenId = generateToken();

    await sql`
      INSERT INTO public.password_reset_tokens (id, user_id, token_hash, expires_at)
      VALUES (${tokenId}, ${user.id}::uuid, ${tokenHash}, ${expiresStr})
    `;

    const link = `${redirectTo}?resetToken=${token}`;

    await enviarEmailRecuperacao({
      toEmail: user.email,
      link,
    });
  } catch {
    // ignora erros de envio/DB em dev
  }

  return { ok: true };
}

/**
 * Permite auto-cadastro de novos usuários no sistema, gerando um PIN de 6 dígitos enviado ao Administrador.
 */
export async function solicitarCadastro(
  email: string,
  nomeCompleto: string,
  cargo?: string,
) {
  const rawEmail = email.trim().toLowerCase();
  const nome = nomeCompleto.trim();
  const funcao = (cargo || "Técnico Agronômico").trim();

  // 1. Verificar se usuário já existe
  const [userExistente] = await sql`
    SELECT id::text, status::text FROM public.app_users WHERE lower(email::text) = ${rawEmail}
  `;

  if (userExistente && userExistente.status === "active") {
    throw new Error("Este e-mail já possui uma conta ativa. Faça login diretamente.");
  }

  let userId: string;

  if (userExistente) {
    userId = userExistente.id;
    await sql`
      UPDATE public.app_users
      SET nome_completo = ${nome}, cargo = ${funcao}
      WHERE id = ${userId}::uuid
    `;
  } else {
    userId = randomUUID();
    await sql`
      INSERT INTO public.app_users (id, email, nome_completo, cargo, status)
      VALUES (${userId}::uuid, ${rawEmail}, ${nome}, ${funcao}, 'invited'::public.user_status)
    `;

    const roleId = randomUUID();
    await sql`
      INSERT INTO public.user_roles (id, user_id, role)
      VALUES (${roleId}::uuid, ${userId}::uuid, 'tecnico'::public.user_role)
      ON CONFLICT (user_id, role) DO NOTHING
    `;
  }

  // Criar Código de Ativação de 6 dígitos para o usuário
  const codigoAtivacao = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = hashToken(codigoAtivacao);
  const inviteId = randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 horas

  // Limpar convites ativos anteriores deste e-mail
  try {
    await sql`DELETE FROM public.user_invites WHERE lower(email::text) = ${rawEmail}`;
  } catch {
    // ignora se tabela de convite não possui registros
  }

  await sql`
    INSERT INTO public.user_invites (id, user_id, email, token_hash, expires_at)
    VALUES (${inviteId}::uuid, ${userId}::uuid, ${rawEmail}, ${tokenHash}, ${expiresAt.toISOString()})
  `;

  // Disparar e-mail com o código de ativação para o e-mail do Administrador (zeduquesneto@gmail.com)
  await enviarEmailNotificacaoAdmin({
    nomeUsuario: nome,
    emailUsuario: rawEmail,
    cargoUsuario: funcao,
    codigoAtivacao,
  });

  return {
    ok: true,
    email: rawEmail,
    message: "Solicitação registrada! Um e-mail com o código de ativação de 6 dígitos foi enviado ao administrador do sistema.",
  };
}

/**
 * Valida o código PIN de 6 dígitos e ativa a conta cadastrando a senha do usuário.
 */
export async function ativarContaComCodigo(email: string, codigo: string, senha: string) {
  const rawEmail = email.trim().toLowerCase();
  const cleanCode = codigo.trim();
  const tokenHash = hashToken(cleanCode);

  try {
    const [invite] = await sql`
      SELECT
        i.id::text as invite_id,
        i.user_id::text as user_id,
        u.email::text as email
      FROM public.user_invites i
      JOIN public.app_users u ON u.id = i.user_id
      WHERE lower(i.email::text) = ${rawEmail}
        AND i.token_hash = ${tokenHash}
        AND i.expires_at > CURRENT_TIMESTAMP
        AND i.accepted_at IS NULL
    `;

    if (!invite) {
      throw new Error("Código de ativação de 6 dígitos inválido ou expirado. Peça o código correto ao Administrador.");
    }

    // Marcar convite como aceito
    await sql`
      UPDATE public.user_invites
      SET accepted_at = CURRENT_TIMESTAMP
      WHERE id = ${invite.invite_id}::uuid
    `;

    const newPasswordHash = await hashPassword(senha);

    // Ativar usuário
    await sql`
      UPDATE public.app_users
      SET
        password_hash = ${newPasswordHash},
        status = 'active'::public.user_status,
        email_verified_at = CURRENT_TIMESTAMP,
        last_sign_in_at = CURRENT_TIMESTAMP
      WHERE id = ${invite.user_id}::uuid
    `;

    // Iniciar sessão automaticamente (encerrando antes a sessão anterior do navegador)
    await revogarSessaoDoNavegador();
    const sessionToken = generateToken();
    const sessionTokenHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_SHORT_HOURS * 3600 * 1000);
    const expiresStr = expiresAt.toISOString();
    const sessionId = randomUUID();

    try {
      await sql`
        INSERT INTO public.user_sessions (id, user_id, session_token_hash, expires_at)
        VALUES (${sessionId}::uuid, ${invite.user_id}::uuid, ${sessionTokenHash}, ${expiresStr})
      `;
    } catch (err) {
      console.error("[Auth Error] Não foi possível criar a sessão após ativar a conta:", err);
      throw new Error("Conta ativada, mas não foi possível iniciar a sessão. Faça login novamente.");
    }

    let papeis: ("admin" | "tecnico")[] = ["tecnico"];
    try {
      const roleRows = await sql`
        SELECT role::text FROM public.user_roles WHERE user_id = ${invite.user_id}::uuid
      `;
      const p = roleRows.map((r: any) => r.role as "admin" | "tecnico");
      if (p.length > 0) papeis = p;
    } catch {
      // fallback
    }

    const sessionUser: SessionUser = {
      id: invite.user_id,
      email: invite.email,
      nomeCompleto: invite.nome_completo || invite.email,
      cargo: "Técnico Agronômico",
      papeis,
    };

    setCookieHeader(sessionToken, expiresAt, false);
    return { ok: true, user: sessionUser };
  } catch (err: any) {
    throw new Error(err?.message || "Não foi possível ativar a conta. Verifique o código e tente novamente.");
  }
}

/**
 * Grava o cookie de sessão. Com `persistente = false` o cookie não recebe
 * Expires/Max-Age ("cookie de sessão"): o navegador o descarta ao ser fechado,
 * evitando que a próxima pessoa a usar o computador entre na conta anterior.
 */
function setCookieHeader(token: string, expiresAt: Date, persistente = true) {
  let isSecure = false;
  try {
    const request = getRequest();
    if (request) {
      const proto = request.headers.get("x-forwarded-proto") || "";
      const url = request.url || "";
      isSecure = proto === "https" || url.startsWith("https://");
    }
  } catch {
    // fallback
  }

  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const validade = persistente
    ? `; Expires=${expiresAt.toUTCString()}; Max-Age=${maxAge}`
    : "";
  const cookieValue = `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }${validade}`;
  try {
    setResponseHeader("Set-Cookie", cookieValue);
  } catch {
    // ignora erros fora do contexto de requisição
  }
}
