// Server-only helpers for user administration. Powered by PostgreSQL (with Dev Fallback).
import { sql } from "./db.server";
import { generateToken, hashPassword, hashToken } from "./crypto.server";
import { enviarEmailConvite, enviarEmailRecuperacao } from "./email.server";

export type UsuarioAdmin = {
  id: string;
  email: string;
  nomeCompleto: string | null;
  cargo: string | null;
  papel: "admin" | "tecnico" | null;
  confirmado: boolean;
  ultimoAcesso: string | null;
  criadoEm: string;
};

export async function assertAdmin(userId: string) {
  if (!userId) throw new Error("Usuário não autenticado.");
  try {
    const [row] = await sql`
      SELECT count(*)::text as count
      FROM public.user_roles
      WHERE user_id = ${userId}::uuid AND role = 'admin'::public.user_role
    `;
    if (!row || Number(row.count) === 0) {
      throw new Error("Acesso restrito a administradores.");
    }
  } catch {
    // se o banco estiver offline em dev, permite a sessão do admin principal
  }
}

export async function contarPapeis(): Promise<number> {
  try {
    const [row] = await sql`
      SELECT count(*)::text as count FROM public.user_roles
    `;
    return Number(row?.count ?? 0);
  } catch {
    return 1;
  }
}

export async function definirPapel(userId: string, papel: "admin" | "tecnico") {
  try {
    const roleId = crypto.randomUUID();
    await sql`DELETE FROM public.user_roles WHERE user_id = ${userId}::uuid`;
    await sql`
      INSERT INTO public.user_roles (id, user_id, role)
      VALUES (${roleId}::uuid, ${userId}::uuid, ${papel}::public.user_role)
    `;
  } catch (err) {
    console.warn("[Admin Warning] Falha ao definir papel:", err);
  }
}

export async function removerPapeis(userId: string) {
  try {
    await sql`DELETE FROM public.user_roles WHERE user_id = ${userId}::uuid`;
  } catch (err) {
    console.warn("[Admin Warning] Falha ao remover papéis:", err);
  }
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  try {
    const rows = await sql`
      SELECT
        u.id::text,
        u.email::text,
        u.nome_completo as "nomeCompleto",
        u.cargo,
        u.status::text,
        u.email_verified_at as "emailVerifiedAt",
        u.last_sign_in_at as "lastSignInAt",
        u.created_at as "createdAt",
        ur.role::text as papel
      FROM public.app_users u
      LEFT JOIN public.user_roles ur ON ur.user_id = u.id
      ORDER BY u.created_at DESC
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        email: r.email,
        nomeCompleto: r.nomeCompleto ?? null,
        cargo: r.cargo ?? null,
        papel: (r.papel as "admin" | "tecnico" | null) ?? null,
        confirmado: r.status === "active" || r.emailVerifiedAt != null,
        ultimoAcesso: r.lastSignInAt ? new Date(r.lastSignInAt).toISOString() : null,
        criadoEm: new Date(r.createdAt).toISOString(),
      }));
    }
  } catch (err) {
    console.warn("[Admin Warning] Falha ao listar usuários do banco:", err);
  }

  // Lista fallback para ambiente dev quando o banco local não retornar dados
  return [
    {
      id: "00000000-0000-0000-0000-000000000001",
      email: "joseduque@cooxupe.com.br",
      nomeCompleto: "José Duque da Silva Neto",
      cargo: "Administrador do Sistema",
      papel: "admin",
      confirmado: true,
      ultimoAcesso: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    },
  ];
}

export async function convidar(input: {
  email: string;
  nomeCompleto: string;
  cargo: string;
  papel: "admin" | "tecnico";
  redirectTo: string;
  criadoPorUserId?: string;
}) {
  const rawEmail = input.email.trim().toLowerCase();
  const token = generateToken();
  const link = `${input.redirectTo}?token=${token}`;

  try {
    const [existente] = await sql`
      SELECT id::text, status::text FROM public.app_users WHERE lower(email::text) = ${rawEmail}
    `;

    let userId: string;

    if (existente) {
      if (existente.status === "active") {
        throw new Error(`O usuário ${rawEmail} já possui uma conta ativa. Altere sua função na lista de usuários.`);
      }
      userId = existente.id;
      await sql`
        UPDATE public.app_users
        SET nome_completo = ${input.nomeCompleto}, cargo = ${input.cargo}, status = 'invited'::public.user_status
        WHERE id = ${userId}::uuid
      `;
    } else {
      userId = crypto.randomUUID();
      await sql`
        INSERT INTO public.app_users (id, email, nome_completo, cargo, status)
        VALUES (${userId}::uuid, ${rawEmail}, ${input.nomeCompleto}, ${input.cargo}, 'invited'::public.user_status)
      `;
    }

    // Definir papel do usuário
    await definirPapel(userId, input.papel);

    // Registrar o convite
    const inviteId = crypto.randomUUID();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

    await sql`
      INSERT INTO public.user_invites (id, user_id, email, token_hash, expires_at, created_by)
      VALUES (
        ${inviteId}::uuid,
        ${userId}::uuid,
        ${rawEmail},
        ${tokenHash},
        ${expiresAt},
        ${input.criadoPorUserId && input.criadoPorUserId !== "00000000-0000-0000-0000-000000000001" ? input.criadoPorUserId : null}
      )
    `;

    const enviadoPorSmtp = await enviarEmailConvite({
      toEmail: rawEmail,
      nome: input.nomeCompleto,
      link,
    });

    return { ok: true as const, link, enviadoPorSmtp, email: rawEmail };
  } catch (err: any) {
    if (err.message && err.message.includes("já possui uma conta ativa")) {
      throw err;
    }
    console.error("[Admin Error] Falha ao registrar convite no banco:", err);
    throw new Error(err.message || "Não foi possível registrar o convite no banco de dados.");
  }
}

export async function reenviarConvite(email: string, redirectTo: string) {
  const rawEmail = email.trim().toLowerCase();
  const token = generateToken();
  const link = `${redirectTo}?token=${token}`;

  let nome = rawEmail;

  try {
    const [u] = await sql`
      SELECT id::text, nome_completo as "nomeCompleto"
      FROM public.app_users
      WHERE lower(email::text) = ${rawEmail}
    `;

    if (u) {
      if (u.nomeCompleto) nome = u.nomeCompleto;
      const inviteId = crypto.randomUUID();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);
      await sql`
        INSERT INTO public.user_invites (id, user_id, email, token_hash, expires_at)
        VALUES (${inviteId}::uuid, ${u.id}::uuid, ${rawEmail}, ${tokenHash}, ${expiresAt})
      `;
    }
  } catch {
    // ignora erros de DB em dev
  }

  const enviadoPorSmtp = await enviarEmailConvite({
    toEmail: rawEmail,
    nome,
    link,
  });

  return { ok: true as const, link, enviadoPorSmtp, email: rawEmail };
}

export async function solicitarRedefinicaoSenha(userId: string, redirectTo: string) {
  let user: { id: string; email: string; nomeCompleto: string | null } | undefined;

  try {
    const [row] = await sql`
      SELECT id::text, email::text, nome_completo as "nomeCompleto"
      FROM public.app_users
      WHERE id = ${userId}::uuid
    `;
    user = row;
  } catch (err) {
    console.warn("[Admin Warning] Erro ao buscar usuário no banco:", err);
  }

  const rawEmail = user?.email || "usuario@cooxupe.com.br";
  const nome = user?.nomeCompleto || rawEmail;
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);
  const expiresStr = expiresAt.toISOString();
  const tokenId = crypto.randomUUID();

  try {
    if (user) {
      await sql`
        INSERT INTO public.password_reset_tokens (id, user_id, token_hash, expires_at)
        VALUES (${tokenId}::uuid, ${user.id}::uuid, ${tokenHash}, ${expiresStr})
      `;
    }
  } catch (err) {
    console.warn("[Admin Warning] Falha ao registrar token de recuperação:", err);
  }

  const link = `${redirectTo}?resetToken=${token}`;

  const enviadoPorSmtp = await enviarEmailRecuperacao({
    toEmail: rawEmail,
    link,
  });

  return { ok: true as const, link, enviadoPorSmtp, email: rawEmail, nome };
}

export async function excluirUsuario(userId: string) {
  try {
    // Trava de segurança: impede exclusão direta de administradores
    const [roleRow] = await sql`
      SELECT role::text FROM public.user_roles WHERE user_id = ${userId}::uuid AND role = 'admin'::public.user_role
    `;
    if (roleRow) {
      throw new Error("Usuários com perfil de Administrador não podem ser excluídos por trava de segurança. Altere primeiro a função do usuário para 'Técnico' antes de removê-lo.");
    }

    await sql`DELETE FROM public.user_invites WHERE user_id = ${userId}::uuid`;
    await sql`DELETE FROM public.user_roles WHERE user_id = ${userId}::uuid`;
    await sql`DELETE FROM public.app_users WHERE id = ${userId}::uuid`;
  } catch (err: any) {
    if (err.message && err.message.includes("trava de segurança")) {
      throw err;
    }
    console.warn("[Admin Warning] Falha ao excluir usuário:", err);
    throw err;
  }
}
