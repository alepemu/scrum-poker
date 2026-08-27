# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /src

# Manifests first: a source-only change then reuses the install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# tsup bundles @poker/shared into the server output, so the runtime tree this
# produces is just express and socket.io. --legacy is required from pnpm 10
# for a workspace that does not inject its dependencies.
RUN pnpm deploy --filter @poker/server --prod --legacy /out

# ---- runtime --------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# index.ts resolves the client as ../../client/dist relative to its own
# directory, so these two have to keep their positions relative to each other.
COPY --from=build /out ./server
COPY --from=build /src/client/dist ./client/dist

USER node
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
