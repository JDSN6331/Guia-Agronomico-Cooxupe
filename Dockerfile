# Dockerfile para implantação no Easypanel / Hostinger KVM2 VPS
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte da aplicação
COPY . .

# Build da aplicação TanStack Start / Vite / Nitro
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Imagem final de execução
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar build e dependências de produção do estagio anterior
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Executar a aplicação via Nitro server entry point
CMD ["node", ".output/server/index.mjs"]
