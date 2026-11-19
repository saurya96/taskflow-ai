# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache wget
RUN addgroup -S taskflow && adduser -S taskflow -G taskflow
COPY --from=build --chown=taskflow:taskflow /app/dist /usr/share/nginx/html
COPY --chown=taskflow:taskflow frontend/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && chown -R taskflow:taskflow /tmp
USER taskflow
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/healthz || exit 1
