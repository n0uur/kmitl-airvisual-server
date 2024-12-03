FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb /app/
RUN bun install --frozen-lockfile

FROM base AS production
COPY . /app
COPY --from=install /app/node_modules /app/node_modules

# Copy if there is .env file
COPY .en[v] /app

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["bun", "server.js"]
