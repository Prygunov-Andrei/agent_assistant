# Development Dockerfile для фронтенда
FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --silent

# Копируем исходники
COPY . .

# Expose порт для dev server
EXPOSE 3000

# Healthcheck для dev server
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Запускаем dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
