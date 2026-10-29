# Monitoramento de acessos

Acesse Gestão do Sistema → Monitoramento de Acessos com uma conta de administrador.
O servidor verifica a sessão e o papel antes de retornar dados, inclusive no histórico individual.

## O que é registrado

- Quantidade: uma sessão criada representa um login bem-sucedido. Inclui login por senha, ativação e definição de senha com login automático. Atualizar páginas e abrir abas não cria outro login.
- Último login: maior data de criação de sessão; usa o último login já armazenado no usuário quando não há sessões preservadas.
- Última atividade: último sinal recebido da aba visível.
- Presença online: sinal nos últimos 90 segundos em sessão não revogada nem expirada.
- Uso estimado: soma de intervalos entre sinais consecutivos, enviados a cada 60 segundos com a aba visível. Não mede atenção. Intervalos superiores a 90 segundos, falhas de rede e retornos de aba oculta não são somados. Requisições simultâneas da mesma sessão não duplicam o tempo.
- Histórico individual paginado: início, estado, saída registrada, última atividade e uso estimado. Saída registrada representa revogação (logout, inatividade ou substituição pelo próximo login), não necessariamente fechamento do navegador.

Horários exibidos em America/Sao_Paulo. Não são coletados senha, token, IP nem localização.
O tempo anterior à implantação não pode ser reconstruído; sessões antigas aparecem sem medição até receberem o primeiro sinal. Uma sessão antiga retomada mede apenas a partir desse sinal.
Fechar o navegador, suspensão, falha de conexão e o último intervalo antes de sair podem deixar até cerca de um minuto sem medição. A validade do cookie (12 horas ou 30 dias) não representa tempo de uso.
A soma é por sessão: dispositivos diferentes podem ter períodos sobrepostos. Quantidades dependem das sessões preservadas; não apagar user_sessions caso se deseje manter todo o histórico.

## Implantação preservando o banco existente

Esta entrega não executou comandos no banco de produção.

1. Antes da implantação, gere um backup do PostgreSQL existente e confira sua restauração em um banco separado. Mantenha o mesmo DATABASE_URL e o volume persistente.
2. Publique o código mantendo a pasta database/migrations na imagem (o Dockerfile já copia database).
3. Na inicialização, a aplicação executa a migração 003_session_activity.sql por sql.begin(), em uma conexão reservada do pool. Apenas as operações de monitoramento aguardam sua conclusão. Ela cria somente user_session_activity com CREATE TABLE IF NOT EXISTS. Não altera ou preenche registros de usuários, senhas ou sessões. A mudança é transacional e repetível.
4. Se o usuário da aplicação não tiver permissão para criar tabelas, aplique esse arquivo previamente com o usuário de manutenção no mesmo banco, dentro de uma transação (psql --single-transaction --set ON_ERROR_STOP=1 --file database/migrations/003_session_activity.sql). Em falha de migração, somente o monitoramento apresenta erro; as consultas de autenticação continuam independentes. Verifique os logs para corrigir o monitoramento.
5. Confira login de um técnico, sinal no painel administrativo, incremento após outro login e revogação no logout. Confira que o técnico não acessa o relatório.

A inicialização da aplicação deixou de reaplicar 001_postgres_base.sql e 002_dev_seed.sql em produção. O seed alterava dados do administrador e o último acesso a cada reinício. O schema base de instalações novas deve ser provisionado separadamente; o seed é exclusivo de desenvolvimento.
Não recrie o banco, não remova volumes e não use docker compose down -v para esta atualização.
Em reversão, publique a versão anterior do código sem apagar a nova tabela; as tabelas anteriores permanecem intactas. Atenção: a versão anterior reaplica o seed no início.

## Validação local

npm run test:monitoramento usa SQLite em memória e não lê DATABASE_URL nem abre o banco da aplicação. Requer Node 22.13+ (APIs experimentais do Node). Cobre preservação de registros, sessões anteriores, contagem, abas simultâneas, intervalos sem conexão, logout, expiração, usuários sem acessos, paginação e autorização administrativa.

Também executar npm run build e npx tsc --noEmit com as dependências instaladas. Validar a implantação em PostgreSQL de homologação antes de produção.

## Correção de UNSAFE_TRANSACTION

O pool PostgreSQL com max: 10 exige sql.begin() para transações. O arquivo SQL contém apenas o corpo da migração; o driver controla BEGIN, COMMIT e ROLLBACK na conexão reservada. Uma falha de monitoramento não bloqueia as consultas de login. Após publicar a correção, reimplante somente o serviço da aplicação no Easypanel, mantendo DATABASE_URL e o volume do PostgreSQL. Não é necessário recriar nem restaurar o banco para corrigir esse erro.
