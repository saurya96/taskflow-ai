# syntax=docker/dockerfile:1

FROM node:22-alpine AS dependencies
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow
COPY --from=dependencies --chown=taskflow:taskflow /app/node_modules ./node_modules
COPY --chown=taskflow:taskflow backend/package*.json ./
COPY --chown=taskflow:taskflow backend/src ./src
USER taskflow
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
