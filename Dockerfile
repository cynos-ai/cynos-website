ARG NODE_IMAGE=docker.m.daocloud.io/library/node:24.14.1-bookworm-slim
FROM ${NODE_IMAGE} AS dependencies

WORKDIR /app

RUN apt-get update \
  && apt-get install --no-install-recommends -y ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

FROM dependencies AS build

COPY . .
RUN npm run build
RUN npm prune --omit=dev

ARG NODE_IMAGE=docker.m.daocloud.io/library/node:24.14.1-bookworm-slim
FROM ${NODE_IMAGE}

ENV NODE_ENV=production
ENV CYNOS_HOST=0.0.0.0
ENV CYNOS_PORT=3100
ENV CYNOS_DATA_DIR=/data
WORKDIR /app
RUN apt-get update \
  && apt-get install --no-install-recommends -y ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chown node:node /data
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3100
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:3100/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD ["node", "dist/server/main.js"]
