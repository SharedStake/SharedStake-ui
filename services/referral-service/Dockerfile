FROM oven/bun:1.2.23 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run prisma generate && bun run build

FROM oven/bun:1.2.23
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["bun", "run", "start"]