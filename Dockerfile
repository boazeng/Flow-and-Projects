# Flow and Projects — static Vite/React site, built then served by nginx.
# Multi-stage so the image is self-contained: it builds from source, no
# committed dist/ needed.

# ---- build the static site ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- serve it with nginx ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx-container.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
