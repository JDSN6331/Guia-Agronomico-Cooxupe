# Dockerfile para implantação no Easypanel / Hostinger KVM2 VPS
FROM node:22-slim AS builder

WORKDIR /app

# Instalar ferramentas de compilação para módulos nativos (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte da aplicação
COPY . .

# Build da aplicação TanStack Start / Vite / Nitro
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Imagem final de execução (Debian Slim com glibc nativo)
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Copiar build, dependências de produção e pasta database do estágio anterior
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/database ./database

EXPOSE 3000

# Executar a aplicação via Nitro server entry point
CMD ["node", ".output/server/index.mjs"]
