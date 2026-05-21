FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine

RUN apk add --no-cache tini && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --chown=app:app package*.json ./
COPY --chown=app:app server ./server
COPY --chown=app:app public ./public

USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/index.js"]
