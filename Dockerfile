ARG NODE_IMAGE=docker.m.daocloud.io/library/node:24.14.1-bookworm-slim
FROM ${NODE_IMAGE} AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

ARG NODE_IMAGE=docker.m.daocloud.io/library/node:24.14.1-bookworm-slim
FROM ${NODE_IMAGE}

ENV NODE_ENV=production
ENV CYNOS_HOST=0.0.0.0
ENV CYNOS_PORT=3100
ENV CYNOS_DATA_DIR=/data
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev && mkdir -p /data && chown -R node:node /app /data
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3100
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:3100/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD ["node", "dist/server/main.js"]
