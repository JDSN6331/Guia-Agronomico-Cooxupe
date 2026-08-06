# Dockerfile para implantação no Easypanel / Hostinger KVM2 VPS
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pacotes de compilação C++ para módulos nativos (better-sqlite3 / node-gyp)
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte da aplicação
COPY . .

# Build da aplicação TanStack Start / Vite / Nitro
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Imagem final de execução
FROM node:22-alpine AS runner

WORKDIR /app

# Instalar biblioteca de runtime libstdc++ para rodar modulos C++ (better-sqlite3) em Alpine Linux
RUN apk add --no-cache libstdc++

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
