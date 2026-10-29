-- Adição isolada: não altera usuários, senhas ou sessões existentes.
-- Sem backfill: não é possível reconstruir o tempo de uso passado.
-- A aplicação executa este arquivo dentro de sql.begin().
-- Execução manual: usar uma transação única (psql --single-transaction).
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
-- Serializa inicializações simultâneas de mais de uma instância da aplicação.
SELECT pg_advisory_xact_lock(70320261029);
CREATE TABLE IF NOT EXISTS public.user_session_activity (
  session_id uuid PRIMARY KEY REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL,
  active_seconds integer NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
  tracked_from timestamptz NOT NULL
);
