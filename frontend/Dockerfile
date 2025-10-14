# Multi-stage build для production

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Build argument для API URL
ARG VITE_API_URL=http://localhost:8000

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --silent

# Копируем исходники
COPY . .

# Устанавливаем переменную окружения для vite build
ENV VITE_API_URL=${VITE_API_URL}

# Собираем production build
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Устанавливаем serve для раздачи статики
RUN npm install -g serve

# Копируем собранные файлы из builder
COPY --from=builder /app/dist ./dist

# Expose порт
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Запускаем приложение
CMD ["serve", "-s", "dist", "-l", "3000"]
