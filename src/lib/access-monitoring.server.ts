import { ensureMonitoringReady, sql } from "./db.server";
import { getSessionUser } from "./auth.server";

// SQLite guarda timestamps sem fuso; PostgreSQL retorna objetos Date.
export function utcIso(value: string | Date | null): string | null {
  if (!value) return null;
  const normalized =
    typeof value === "string" && !/[zZ]|[+-]\d{2}(:?\d{2})?$/.test(value)
      ? value.replace(" ", "T") + "Z"
      : value;
  return new Date(normalized).toISOString();
}

export async function registrarPresenca(continuar: boolean) {
  await ensureMonitoringReady();
  const user = await getSessionUser();
  if (!user?.sessionId) throw new Error("Sessão expirada. Faça login novamente.");
  const now = new Date().toISOString();
  await sql`
    INSERT INTO public.user_session_activity (session_id, last_seen_at, tracked_from)
    VALUES (${user.sessionId}::uuid, ${now}, ${now})
    ON CONFLICT (session_id) DO NOTHING
  `;
  const [previous] = await sql`
    SELECT last_seen_at FROM public.user_session_activity WHERE session_id = ${user.sessionId}::uuid
  `;
  if (!previous) return { ok: true };
  const elapsed = Math.floor((Date.parse(now) - Date.parse(utcIso(previous.last_seen_at)!)) / 1000);
  // Sem somar intervalos de aba fechada, suspensão ou queda de conexão.
  const seconds = continuar && elapsed > 0 && elapsed <= 90 ? elapsed : 0;
  await sql`
    UPDATE public.user_session_activity
    SET last_seen_at = ${now}, active_seconds = active_seconds + ${seconds}
    WHERE session_id = ${user.sessionId}::uuid AND last_seen_at = ${previous.last_seen_at}
      AND last_seen_at <= ${now}
  `;
  // A comparação anterior evita contar duas vezes requisições/abas simultâneas.
  return { ok: true };
}

export async function listarMonitoramento() {
  await ensureMonitoringReady();
  const now = new Date().toISOString();
  const recent = new Date(Date.now() - 90_000).toISOString();
  const rows = await sql`
    SELECT u.id::text, u.email::text, u.nome_completo, u.last_sign_in_at,
      COALESCE(m.logins, 0) AS logins, m.last_login, m.last_seen,
      COALESCE(m.active_seconds, 0) AS active_seconds,
      COALESCE(m.measured_sessions, 0) AS measured_sessions,
      COALESCE(m.online_sessions, 0) AS online_sessions
    FROM public.app_users u
    LEFT JOIN (
      SELECT s.user_id, COUNT(*) AS logins, MAX(s.created_at) AS last_login,
        MAX(a.last_seen_at) AS last_seen, SUM(a.active_seconds) AS active_seconds,
        COUNT(a.session_id) AS measured_sessions,
        SUM(CASE WHEN a.last_seen_at >= ${recent} AND s.revoked_at IS NULL
          AND s.expires_at > ${now} THEN 1 ELSE 0 END) AS online_sessions
      FROM public.user_sessions s
      LEFT JOIN public.user_session_activity a ON a.session_id = s.id
      GROUP BY s.user_id
    ) m ON m.user_id = u.id
    ORDER BY
      CASE WHEN COALESCE(m.online_sessions, 0) > 0 THEN 0 ELSE 1 END,
      COALESCE(m.last_login, u.last_sign_in_at) DESC NULLS LAST,
      u.nome_completo, u.email
  `;
  return rows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    nome: r.nome_completo as string | null,
    logins: Number(r.logins),
    ultimoLogin: utcIso(r.last_login || r.last_sign_in_at),
    ultimaAtividade: utcIso(r.last_seen),
    segundosAtivos: Number(r.active_seconds),
    sessoesMedidas: Number(r.measured_sessions),
    online: Number(r.online_sessions) > 0,
  }));
}

export async function listarSessoes(userId: string, page: number) {
  await ensureMonitoringReady();
  const [total] =
    await sql` SELECT COUNT(*) AS total FROM public.user_sessions WHERE user_id = ${userId}::uuid `;
  const rows = await sql`
    SELECT s.id::text, s.created_at, s.expires_at, s.revoked_at,
      a.last_seen_at, a.active_seconds, a.tracked_from
    FROM public.user_sessions s
    LEFT JOIN public.user_session_activity a ON a.session_id = s.id
    WHERE s.user_id = ${userId}::uuid
    ORDER BY s.created_at DESC, s.id DESC LIMIT 20 OFFSET ${page * 20}
  `;
  return {
    total: Number(total?.total ?? 0),
    sessoes: rows.map((r) => ({
      id: String(r.id),
      inicio: utcIso(r.created_at)!,
      expiraEm: utcIso(r.expires_at)!,
      encerradaEm: utcIso(r.revoked_at),
      ultimaAtividade: utcIso(r.last_seen_at),
      segundosAtivos: r.active_seconds == null ? null : Number(r.active_seconds),
      medicaoDesde: utcIso(r.tracked_from),
    })),
  };
}
