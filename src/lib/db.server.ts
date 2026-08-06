import path from "node:path";
import fs from "node:fs";
import { scryptSync } from "node:crypto";
import Database from "better-sqlite3";
import postgres from "postgres";

// Determinar se estamos em modo produção (PostgreSQL) ou modo local de desenvolvimento (SQLite)
const isProd =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

let postgresClient: any = null;
let sqliteDb: any = null;

if (isProd) {
  const DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/knowledge_agri_hub";
  postgresClient = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
} else {
  // Inicialização do SQLite para desenvolvimento local
  const dbDir = path.resolve(process.cwd(), "database");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "dev.sqlite");
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma("journal_mode = WAL");

  // Criar estrutura de tabelas SQLite no ambiente de desenvolvimento
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      nome_completo TEXT,
      cargo TEXT,
      password_hash TEXT,
      status TEXT NOT NULL DEFAULT 'invited',
      email_verified_at TEXT,
      last_sign_in_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, role),
      FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_invites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES app_users(id) ON DELETE CASCADE
    );
  `);

  // Restauração / Seed do administrador principal no SQLite local
  const adminId = "00000000-0000-0000-0000-000000000001";
  const salt = "1234567890abcdef";
  const key = scryptSync("123456", salt, 64).toString("hex");
  const adminHash = `${salt}:${key}`;

  sqliteDb.prepare(`
    INSERT INTO app_users (id, email, nome_completo, cargo, password_hash, status, email_verified_at)
    VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      nome_completo = 'José Duque da Silva Neto',
      cargo = 'Administrador do Sistema',
      password_hash = excluded.password_hash,
      status = 'active'
  `).run(adminId, "joseduque@cooxupe.com.br", "José Duque da Silva Neto", "Administrador do Sistema", adminHash);

  sqliteDb.prepare(`
    INSERT INTO user_roles (id, user_id, role)
    VALUES (?, ?, 'admin')
    ON CONFLICT(user_id, role) DO NOTHING
  `).run("00000000-0000-0000-0000-000000000002", adminId);
}

/**
 * Função de consulta unificada que funciona tanto com SQLite (dev local) quanto com PostgreSQL (prod).
 */
export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  if (isProd && postgresClient) {
    return (postgresClient as any)(strings, ...values);
  }

  // Processamento local SQLite
  let queryStr = "";
  const params: any[] = [];

  for (let i = 0; i < strings.length; i++) {
    queryStr += strings[i];
    if (i < values.length) {
      const val = values[i];
      queryStr += "?";
      if (val instanceof Date) {
        params.push(val.toISOString());
      } else {
        params.push(val === undefined ? null : val);
      }
    }
  }

  // Limpar qualificadores e casting de tipos específicos do Postgres (como public., ::uuid, ::text, ::user_status, etc.)
  queryStr = queryStr
    .replace(/public\./g, "")
    .replace(/::[a-zA-Z0-9_.]+/gi, "")
    .replace(/now\(\)/gi, "CURRENT_TIMESTAMP");

  const trimmed = queryStr.trim();
  const isSelect = /^SELECT/i.test(trimmed);

  try {
    const stmt = sqliteDb.prepare(queryStr);
    if (isSelect) {
      return stmt.all(...params);
    } else {
      const info = stmt.run(...params);
      return [{ count: String(info.changes), id: String(info.lastInsertRowid) }];
    }
  } catch (err: any) {
    console.error("[SQLite Query Error]:", err.message, "Query:", queryStr, "Params:", params);
    throw err;
  }
}
