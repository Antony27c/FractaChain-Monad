# Imagen de producción del frontend (Next.js standalone). Pensada para Railway con
# "Root Directory" = frontend.

FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las variables NEXT_PUBLIC_* se incrustan en el bundle durante el build. Railway las
# pasa como build args solo si están declaradas acá.
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_NETWORK
ARG NEXT_PUBLIC_DEV_MODE
ARG NEXT_PUBLIC_RPC_URL
ARG NEXT_PUBLIC_FACTORY
ARG NEXT_PUBLIC_KYC
ARG NEXT_PUBLIC_USDC
ARG NEXT_PUBLIC_USDC_MINTABLE
ARG NEXT_PUBLIC_REDEMPTION

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
# Railway define PORT; el server de Next lo respeta.
CMD ["node", "server.js"]
