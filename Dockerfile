# Flow and Projects — build the React SPA, then serve it from FastAPI (which also
# runs Google auth + the central SQLite state API).

# ---- stage 1: build the static frontend ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- stage 2: FastAPI app server ----
FROM python:3.12-slim
WORKDIR /app
# git is needed to pip-install shared-auth from GitHub
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=build /app/dist ./dist
EXPOSE 8000
CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000"]
