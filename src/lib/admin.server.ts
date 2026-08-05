// Server-only helpers for user administration. Never imported by client code.
import type { SupabaseClient } from "@supabase/supabase-js";

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

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Acesso restrito a administradores.");
}

export async function contarPapeis(): Promise<number> {
  const db = await admin();
  const { count, error } = await db.from("user_roles").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function definirPapel(userId: string, papel: "admin" | "tecnico") {
  const db = await admin();
  await db.from("user_roles").delete().eq("user_id", userId);
  const { error } = await db.from("user_roles").insert({ user_id: userId, role: papel });
  if (error) throw new Error(error.message);
}

export async function removerPapeis(userId: string) {
  const db = await admin();
  const { error } = await db.from("user_roles").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const db = await admin();
  const { data: lista, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);

  const { data: perfis } = await db.from("profiles").select("id, nome_completo, cargo, email");
  const { data: papeis } = await db.from("user_roles").select("user_id, role");

  const perfilPor = new Map((perfis ?? []).map((p) => [p.id, p]));
  const papelPor = new Map((papeis ?? []).map((r) => [r.user_id, r.role]));

  return lista.users.map((u) => {
    const perfil = perfilPor.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      nomeCompleto:
        perfil?.nome_completo ?? (u.user_metadata?.["nome_completo"] as string | undefined) ?? null,
      cargo: perfil?.cargo ?? (u.user_metadata?.["cargo"] as string | undefined) ?? null,
      papel: (papelPor.get(u.id) as "admin" | "tecnico" | undefined) ?? null,
      confirmado: Boolean(u.email_confirmed_at),
      ultimoAcesso: u.last_sign_in_at ?? null,
      criadoEm: u.created_at,
    };
  });
}

export async function convidar(input: {
  email: string;
  nomeCompleto: string;
  cargo: string;
  papel: "admin" | "tecnico";
  redirectTo: string;
}) {
  const db = await admin();
  const { data, error } = await db.auth.admin.inviteUserByEmail(input.email, {
    data: { nome_completo: input.nomeCompleto, cargo: input.cargo },
    redirectTo: input.redirectTo,
  });
  if (error) throw new Error(error.message);

  const novoId = data.user.id;
  await db.from("profiles").upsert(
    {
      id: novoId,
      email: input.email,
      nome_completo: input.nomeCompleto,
      cargo: input.cargo,
    },
    { onConflict: "id" },
  );
  await definirPapel(novoId, input.papel);
  return novoId;
}

export async function reenviarConvite(email: string, redirectTo: string) {
  const db = await admin();
  const { error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function excluirUsuario(userId: string) {
  const db = await admin();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
