import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { DatabaseSync } from "node:sqlite";

const dbSource = readFileSync(new URL("../src/lib/db.server.ts", import.meta.url), "utf8");
const schema = dbSource.match(/sqliteDb.exec\(`([\s\S]*?)`\);/)[1];
const source = stripTypeScriptTypes(
  readFileSync(new URL("../src/lib/access-monitoring.server.ts", import.meta.url), "utf8"),
)
  .replace(/^import .*;$/gm, "")
  .replace(/^export /gm, "");
const createService = new Function(
  "sql",
  "getSessionUser",
  "Date",
  "ensureMonitoringReady",
  source + "\nreturn { registrarPresenca, listarMonitoramento, listarSessoes, utcIso };",
);
const user = "10000000-0000-0000-0000-000000000001";
function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(schema);
  let now = Date.parse("2026-10-29T12:00:00Z");
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  }
  const sql = async (strings, ...values) => {
    const query = strings
      .join("?")
      .replace(/public\./g, "")
      .replace(/::[a-zA-Z0-9_.]+/g, "");
    const stmt = db.prepare(query);
    const params = values.map((v) => (v instanceof Date ? v.toISOString() : v));
    return /^\s*SELECT/i.test(query) ? stmt.all(...params) : [stmt.run(...params)];
  };
  db.prepare(
    "INSERT INTO app_users(id,email,nome_completo,status) VALUES (?,?,'Técnico','active')",
  ).run(user, "tecnico@teste.local");
  const session = (id, created = "2026-10-29 12:00:00", expires = "2026-11-01T12:00:00.000Z") =>
    db
      .prepare(
        "INSERT INTO user_sessions(id,user_id,session_token_hash,created_at,expires_at) VALUES (?,?,?,?,?)",
      )
      .run(id, user, "hash-" + id, created, expires);
  session("s1");
  let current = "s1";
  const auth = async () => {
    const row = db
      .prepare("SELECT * FROM user_sessions WHERE id = ? AND revoked_at IS NULL")
      .get(current);
    return row && Date.parse(row.expires_at) > now ? { id: user, sessionId: current } : null;
  };
  return {
    db,
    session,
    service: createService(sql, auth, Clock, async () => {}),
    advance: (seconds) => {
      now += seconds * 1000;
    },
    select: (id) => {
      current = id;
    },
  };
}

test("preserva usuários e sessões anteriores; histórico sem duração inventada; datas UTC", async () => {
  const f = fixture();
  const before = f.db.prepare("SELECT * FROM app_users").all();
  f.db.exec(schema); // inicialização aditiva repetida
  const [u] = await f.service.listarMonitoramento();
  assert.equal(u.logins, 1);
  assert.equal(u.ultimoLogin, "2026-10-29T12:00:00.000Z");
  assert.equal(u.online, false);
  const history = await f.service.listarSessoes(user, 0);
  assert.equal(history.sessoes[0].segundosAtivos, null);
  assert.deepEqual(f.db.prepare("SELECT * FROM app_users").all(), before);
  f.db.close();
});

test("heartbeats não aumentam logins; múltiplas abas não duplicam tempo", async () => {
  const f = fixture();
  await f.service.registrarPresenca(false);
  f.advance(60);
  await Promise.all([f.service.registrarPresenca(true), f.service.registrarPresenca(true)]);
  const [u] = await f.service.listarMonitoramento();
  assert.equal(u.logins, 1);
  assert.equal(u.segundosAtivos, 60);
  assert.equal(u.online, true);
  f.advance(91);
  assert.equal((await f.service.listarMonitoramento())[0].online, false);
  await f.service.registrarPresenca(true);
  assert.equal((await f.service.listarMonitoramento())[0].segundosAtivos, 60);
  f.advance(30);
  await f.service.registrarPresenca(false); // retorno de aba oculta não conta intervalo
  assert.equal((await f.service.listarMonitoramento())[0].segundosAtivos, 60);
  f.db.close();
});

test("logout e expiração impedem nova coleta; novos logins são contados", async () => {
  const f = fixture();
  await f.service.registrarPresenca(false);
  f.db.exec("UPDATE user_sessions SET revoked_at = '2026-10-29 12:00:01' WHERE id = 's1'");
  assert.equal((await f.service.listarMonitoramento())[0].online, false);
  await assert.rejects(() => f.service.registrarPresenca(true), /Sessão expirada/);
  f.session("s2");
  f.select("s2");
  await f.service.registrarPresenca(false);
  assert.equal((await f.service.listarMonitoramento())[0].logins, 2);
  f.advance(4 * 86400);
  await assert.rejects(() => f.service.registrarPresenca(true), /Sessão expirada/);
  assert.equal((await f.service.listarMonitoramento())[0].online, false);
  f.db.close();
});

test("inclui usuários sem acesso e pagina sem repetir sessões", async () => {
  const f = fixture();
  f.db.exec("INSERT INTO app_users(id,email) VALUES ('other','semacesso@teste.local')");
  for (let i = 2; i <= 23; i++) f.session("s" + i);
  const users = await f.service.listarMonitoramento();
  assert.equal(users.find((u) => u.id === "other").logins, 0);
  const first = await f.service.listarSessoes(user, 0);
  const next = await f.service.listarSessoes(user, 1);
  assert.equal(first.total, 23);
  assert.equal(first.sessoes.length, 20);
  assert.equal(next.sessoes.length, 3);
  assert.equal(new Set([...first.sessoes, ...next.sessoes].map((s) => s.id)).size, 23);
  f.db.close();
});

test("relatórios exigem sessão de administrador antes de consultar dados", async () => {
  const adminSource = stripTypeScriptTypes(
    readFileSync(new URL("../src/lib/admin.functions.ts", import.meta.url), "utf8"),
  )
    .replace(/^import[\s\S]*?from ["'][^"']+["'];/gm, "")
    .replace(/^export /gm, "");
  const createServerFn = () => ({
    validator() {
      return this;
    },
    handler(fn) {
      return fn;
    },
  });
  let identity = null;
  let queries = 0;
  const service = new Function(
    "createServerFn",
    "getSessionUser",
    "listarMonitoramento",
    "listarSessoes",
    adminSource + "\nreturn { listarMonitoramentoFn, listarSessoesFn };",
  )(
    createServerFn,
    async () => identity,
    async () => {
      queries++;
      return [];
    },
    async () => {
      queries++;
      return { sessoes: [], total: 0 };
    },
  );
  for (const session of [null, { id: user, papeis: ["tecnico"] }]) {
    identity = session;
    await assert.rejects(() => service.listarMonitoramentoFn(), /restrito a administradores/);
    await assert.rejects(
      () => service.listarSessoesFn({ data: { userId: user, page: 0 } }),
      /restrito a administradores/,
    );
  }
  assert.equal(queries, 0);
  identity = { id: user, papeis: ["admin"] };
  await service.listarMonitoramentoFn();
  await service.listarSessoesFn({ data: { userId: user, page: 0 } });
  assert.equal(queries, 2);
});

// Exercita a inicialização real do módulo com um pool simulado, sem DATABASE_URL real.
const databaseModule = stripTypeScriptTypes(dbSource)
  .replace(/^import .*;$/gm, "")
  .replace(/^export /gm, "");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const loadDatabase = new AsyncFunction(
  "postgres",
  "path",
  "fs",
  "process",
  "scryptSync",
  "console",
  databaseModule + "\nreturn { sql, ensureMonitoringReady };",
);
const migration = readFileSync(
  new URL("../database/migrations/003_session_activity.sql", import.meta.url),
  "utf8",
);
async function productionFixture(failure) {
  const events = [];
  const pool = async () => {
    events.push("query");
    return [{ id: user, email: "usuario-existente@teste.local" }];
  };
  pool.unsafe = () => {
    throw new Error("UNSAFE_TRANSACTION: pool não reservado");
  };
  pool.begin = async (callback) => {
    events.push("begin");
    try {
      await callback({
        unsafe: async (query) => {
          const statements = query.replace(/--.*$/gm, "");
          assert.doesNotMatch(
            statements,
            /(?:^|;)\s*(BEGIN|COMMIT|ROLLBACK|DELETE|UPDATE|INSERT|DROP|TRUNCATE|ALTER)\b/i,
          );
          assert.match(statements, /CREATE TABLE IF NOT EXISTS public.user_session_activity/);
          if (failure) throw failure;
          events.push("migration");
        },
      });
      events.push("commit");
    } catch (error) {
      events.push("rollback");
      throw error;
    }
  };
  const database = await loadDatabase(
    (_url, options) => {
      assert.equal(options.max, 10);
      return pool;
    },
    { join: (...parts) => parts.join("/") },
    { readFileSync: () => migration },
    {
      env: { NODE_ENV: "production", DATABASE_URL: "postgres://unused.invalid/test" },
      cwd: () => "/app",
    },
    () => {
      throw new Error("seed não deve executar");
    },
    { error: () => {} },
  );
  return { database, events };
}

test("migração usa conexão reservada por begin() sem BEGIN manual no pool", async () => {
  const { database, events } = await productionFixture();
  await database.ensureMonitoringReady();
  assert.deepEqual(events, ["begin", "migration", "commit"]);
  const rows = await database.sql`SELECT id, email FROM public.app_users`;
  assert.equal(rows[0].id, user);
});

test("falha na migração causa rollback e não bloqueia consultas de autenticação", async () => {
  const { database, events } = await productionFixture(
    new Error("permission denied for schema public"),
  );
  await assert.rejects(() => database.ensureMonitoringReady(), /permission denied/);
  assert.deepEqual(events, ["begin", "rollback"]);
  const rows = await database.sql`SELECT id, email FROM public.app_users`;
  assert.equal(rows[0].email, "usuario-existente@teste.local");
  assert.equal(events.at(-1), "query");
});
