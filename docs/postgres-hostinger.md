# Postgres para VPS Hostinger + Easypanel

## O que foi estruturado

Esta base prepara a aplicacao para sair do modelo dependente de Supabase e operar com Postgres proprio, mantendo o mesmo fluxo de negocio:

- administrador cria o usuario;
- usuario recebe convite;
- usuario define a senha no primeiro acesso;
- papeis `admin` e `tecnico`;
- recuperacao de senha;
- sessoes persistidas;
- trilha de auditoria.

Arquivos principais:

- `docker-compose.yml`: Postgres local para desenvolvimento e testes.
- `database/init/001_postgres_base.sql`: schema principal.
- `database/init/002_dev_seed.sql`: usuario administrador local.
- `.env.example`: variaveis de ambiente de referencia.

## Modelo de dados

### `app_users`

Substitui a dupla `auth.users` + `profiles` do Supabase. Centraliza:

- identificacao do usuario;
- perfil basico (`nome_completo`, `cargo`);
- status da conta;
- hash da senha;
- datas de verificacao e ultimo acesso.

### `user_roles`

Mantem o mesmo conceito atual de papeis da aplicacao. Hoje os valores sao:

- `admin`
- `tecnico`

### `user_invites`

Registra os convites criados por administradores para o primeiro acesso.

### `password_reset_tokens`

Armazena tokens de redefinicao de senha com expiracao e uso unico.

### `user_sessions`

Permite controlar sessoes da aplicacao sem depender do Supabase Auth.

### `audit_log`

Guarda eventos administrativos e operacionais importantes.

## Banco local para testes

1. Copie `.env.example` para `.env.local` ou ajuste seu `.env` com as variaveis de Postgres.
2. Suba o banco:

```sh
npm run db:up
```

3. O banco sera iniciado com:

- database: `guia_agronomico`
- usuario: `postgres`
- senha: `postgres`
- porta: `5432`

4. Usuario inicial de desenvolvimento:

- e-mail: `admin@local.test`
- senha: `Alterar123!`

Troque essa senha assim que começar a usar o ambiente.

Para acompanhar logs:

```sh
npm run db:logs
```

Para desligar:

```sh
npm run db:down
```

Se voce alterar os scripts SQL depois do primeiro start, remova o volume do Docker antes de subir novamente para recriar o banco do zero.

## Estrutura recomendada no Easypanel

Na VPS Hostinger, a recomendacao e:

1. Criar um servico `Postgres 16`.
2. Associar volume persistente dedicado.
3. Restringir acesso externo ao minimo necessario.
4. Conectar a aplicacao via rede interna do Easypanel.
5. Configurar backups automaticos.
6. Publicar apenas a aplicacao, nao o banco diretamente na internet.

Variaveis esperadas em producao:

```env
DATABASE_URL=postgresql://usuario:senha@host-interno:5432/guia_agronomico
POSTGRES_DB=guia_agronomico
POSTGRES_USER=usuario
POSTGRES_PASSWORD=senha-forte
POSTGRES_PORT=5432
```

## Proximo passo da migracao

Hoje a aplicacao ainda usa Supabase para autenticacao e operacoes administrativas. Entao esta entrega deixa o banco pronto, mas a migracao completa exige trocar:

- `supabase.auth.signInWithPassword`
- `supabase.auth.resetPasswordForEmail`
- `supabase.auth.updateUser`
- middleware de autenticacao baseado em token do Supabase
- funcoes administrativas que hoje usam `auth.admin`

Sugestao de sequencia:

1. Implementar camada de acesso ao Postgres no servidor.
2. Migrar login, convite e redefinicao de senha para sessoes proprias.
3. Substituir as consultas de papeis e usuarios.
4. Desligar as dependencias do Supabase.
