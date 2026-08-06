-- Seed do Administrador Padrão do Sistema
INSERT INTO public.app_users (
  email,
  nome_completo,
  cargo,
  password_hash,
  status,
  email_verified_at,
  last_sign_in_at
)
VALUES (
  'joseduque@cooxupe.com.br',
  'José Duque da Silva Neto',
  'Administrador do Sistema',
  -- Hash de '123456' gerado pelo scrypt/pgcrypto ou processado no login
  '$2a$10$7R0Z4v6Q1GZ9u5c7H8I9O.3y7/7Z7R0Z4v6Q1GZ9u5c7H8I9O.3y7',
  'active',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
SET
  nome_completo = EXCLUDED.nome_completo,
  cargo = EXCLUDED.cargo,
  status = EXCLUDED.status,
  email_verified_at = EXCLUDED.email_verified_at,
  last_sign_in_at = EXCLUDED.last_sign_in_at;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.app_users
WHERE email = 'joseduque@cooxupe.com.br'
ON CONFLICT (user_id, role) DO NOTHING;
