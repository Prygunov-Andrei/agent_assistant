# 🚀 Production Deployment Guide

## Автоматический деплой настроен и работает!

### 📋 Что настроено:

- ✅ **Сервер**: `188.225.75.124`
- ✅ **Docker Compose**: `docker-compose.prod.yml`
- ✅ **Автоматический деплой**: При каждом `git push origin main`
- ✅ **Сохранение данных**: База данных и media файлы не удаляются
- ✅ **Все сервисы**: Backend + Frontend + Telegram Bot

---

## 🌐 Доступ к приложению:

- **Frontend**: http://188.225.75.124/
- **Backend API**: http://188.225.75.124/api/
- **Django Admin**: http://188.225.75.124/admin/

---

## ⚙️ Настройка на новом сервере:

### 1. Подготовка сервера

```bash
# Подключение к серверу
ssh root@YOUR_SERVER_IP

# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install -y docker-compose

# Установка дополнительных пакетов
apt-get install -y git nginx sshpass
```

### 2. Клонирование проекта

```bash
# Создание директории
mkdir -p /opt/agent_assistant
cd /opt/agent_assistant

# Клонирование репозитория
git clone https://github.com/Prygunov-Andrei/agent_assistant.git .
```

### 3. Настройка переменных окружения

```bash
# Создание .env файла
cp env.example .env
nano .env
```

**Важные переменные для production:**

```env
# Django
SECRET_KEY=generate_new_secret_key_here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,YOUR_SERVER_IP,backend

# Database
DB_PASSWORD=create_strong_password

# API Keys
OPENAI_API_KEY=your_real_openai_key
BOT_TOKEN=your_telegram_bot_token

# Frontend
REACT_APP_API_URL=http://YOUR_SERVER_IP
```

### 4. Настройка Nginx

```bash
# Создание конфигурации
cat > /etc/nginx/sites-available/agent_assistant << 'EOF'
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    client_max_body_size 100M;

    # GitHub Webhook
    location /webhook/deploy {
        proxy_pass http://127.0.0.1:9000/deploy;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        proxy_pass http://127.0.0.1:8000/static/;
    }

    # Media files
    location /media/ {
        proxy_pass http://127.0.0.1:8000/media/;
    }
}
EOF

# Активация конфигурации
ln -sf /etc/nginx/sites-available/agent_assistant /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. Настройка webhook сервиса

```bash
# Создание systemd сервиса
cat > /etc/systemd/system/webhook.service << 'EOF'
[Unit]
Description=GitHub Webhook for Agent Assistant
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/agent_assistant
ExecStart=/usr/bin/python3 /opt/agent_assistant/webhook.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Активация сервиса
systemctl daemon-reload
systemctl enable webhook.service
systemctl start webhook.service
```

### 6. Первый запуск

```bash
cd /opt/agent_assistant
chmod +x deploy.sh
./deploy.sh
```

### 7. Настройка GitHub Webhook

1. Откройте: `https://github.com/YOUR_USERNAME/agent_assistant/settings/hooks`
2. Нажмите **"Add webhook"**
3. Заполните:
   - **Payload URL**: `http://YOUR_SERVER_IP/webhook/deploy`
   - **Content type**: `application/json`
   - **Which events**: "Just the push event"
   - **Active**: ✅
4. Сохраните

---

## 🔄 Автоматический деплой

После настройки webhook каждый `git push origin main` автоматически:

1. Получает изменения из GitHub
2. Пересобирает контейнеры
3. **Сохраняет базу данных** (не удаляет!)
4. Выполняет миграции
5. Перезапускает сервисы

---

## 📊 Мониторинг

```bash
# Статус контейнеров
docker-compose -f /opt/agent_assistant/docker-compose.prod.yml ps

# Логи сервисов
docker-compose -f /opt/agent_assistant/docker-compose.prod.yml logs backend
docker-compose -f /opt/agent_assistant/docker-compose.prod.yml logs frontend
docker-compose -f /opt/agent_assistant/docker-compose.prod.yml logs telegram-bot

# Статус webhook
systemctl status webhook.service
tail -f /opt/agent_assistant/webhook.log
```

---

## 🛠️ Ручной деплой

Если нужно запустить деплой вручную:

```bash
ssh root@YOUR_SERVER_IP
cd /opt/agent_assistant
./deploy.sh
```

---

## ⚠️ Важно

### Переменные для production:

В `.env` на сервере должны быть:

```env
ALLOWED_HOSTS=localhost,127.0.0.1,YOUR_SERVER_IP,backend
REACT_APP_API_URL=http://YOUR_SERVER_IP
```

### Локальная разработка:

Используйте оригинальный `docker-compose.yml` для локальной работы:

```bash
docker-compose up -d
```

### Остановка локального бота:

**Важно!** Один токен = один активный бот. Если работаете с ботом на сервере, остановите локального:

```bash
docker-compose -f docker-compose.bot.yml stop telegram-bot
```

---

## 🔍 Troubleshooting

### Ошибка "Address already in use" для webhook:

```bash
# Найти процесс
lsof -i :9000

# Убить процесс
kill PROCESS_ID

# Перезапустить сервис
systemctl restart webhook.service
```

### Ошибка "ALLOWED_HOSTS" в backend:

Добавьте все необходимые хосты в `.env`:
```env
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com,backend
```

### Telegram bot не видит запросы:

Проверьте что в `.env`:
```env
API_BASE_URL=http://backend:8000/api
```

(Используйте имя сервиса `backend`, НЕ `localhost`)

---

**Деплой настроен и готов к работе!** 🎉

