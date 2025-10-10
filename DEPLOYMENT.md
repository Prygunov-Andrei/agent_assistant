# 🚀 Деплой Agent Assistant

Полная инструкция по развертыванию проекта в Docker контейнерах.

---

## 📋 **Требования:**

- Docker Desktop (Mac/Windows) или Docker Engine (Linux)
- Docker Compose V2
- Минимум 4GB RAM
- 10GB свободного места на диске

---

## ⚡ **Быстрый старт:**

### **1. Клонировать репозиторий (если еще не сделано)**
```bash
git clone <your-repo-url>
cd agent_assistant
```

### **2. Создать .env файл**
```bash
cp .env.example .env
# Отредактируйте .env и добавьте API ключи
```

### **3. Запустить через скрипт**
```bash
chmod +x start.sh
./start.sh
```

Скрипт автоматически:
- Проверит Docker
- Создаст .env если нужно
- Запустит PostgreSQL и Redis
- Применит миграции
- Предложит загрузить тестовые данные
- Запустит все сервисы

### **4. Открыть приложение**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/

---

## 🛠️ **Ручной запуск:**

### **Шаг 1: Запустить базу данных**
```bash
docker-compose up -d db redis
```

Подождать пока PostgreSQL будет готов:
```bash
docker-compose exec db pg_isready -U postgres
```

### **Шаг 2: Применить миграции**
```bash
docker-compose run --rm backend python manage.py migrate
```

### **Шаг 3: Создать суперпользователя**
```bash
docker-compose run --rm backend python manage.py createsuperuser
```

### **Шаг 4: Загрузить тестовые данные (опционально)**
```bash
docker-compose run --rm backend python manage.py load_test_data
```

### **Шаг 5: Запустить все сервисы**
```bash
docker-compose up -d
```

### **Шаг 6: Просмотр логов**
```bash
# Все сервисы
docker-compose logs -f

# Только бэкенд
docker-compose logs -f backend

# Только фронтенд
docker-compose logs -f frontend
```

---

## 📦 **Структура сервисов:**

| Сервис | Порт | Описание |
|--------|------|----------|
| **db** | 5432 | PostgreSQL 14 |
| **redis** | 6379 | Redis для кэширования |
| **backend** | 8000 | Django + Gunicorn |
| **frontend** | 3000 | React + Vite |
| **nginx** | 80, 443 | Reverse proxy |

---

## ⚙️ **Переменные окружения (.env):**

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DB_NAME=agent_assistant_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/1

# OpenAI
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=4000

# SORA (для генерации фото/видео)
SORA_API_KEY=sk-your-sora-key
SORA_MODEL=sora-1.0
SORA_VIDEO_QUALITY=720p

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

---

## 🔧 **Полезные команды:**

### **Просмотр статуса**
```bash
docker-compose ps
```

### **Перезапуск сервиса**
```bash
docker-compose restart backend
docker-compose restart frontend
```

### **Просмотр логов**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend --tail=100
```

### **Вход в контейнер**
```bash
# Backend shell
docker-compose exec backend python manage.py shell

# Backend bash
docker-compose exec backend bash

# Database
docker-compose exec db psql -U postgres agent_assistant_db
```

### **Остановка**
```bash
# Остановить все
docker-compose down

# Остановить и удалить volumes (УДАЛИТ ДАННЫЕ!)
docker-compose down -v
```

### **Пересборка образов**
```bash
# Пересобрать все
docker-compose build

# Пересобрать конкретный сервис
docker-compose build backend
docker-compose build frontend

# Пересобрать и запустить
docker-compose up -d --build
```

---

## 🗄️ **Управление базой данных:**

### **Бэкап**
```bash
docker-compose exec db pg_dump -U postgres agent_assistant_db > backup.sql
```

### **Восстановление**
```bash
docker-compose exec -T db psql -U postgres agent_assistant_db < backup.sql
```

### **Сброс базы (УДАЛИТ ВСЕ ДАННЫЕ!)**
```bash
docker-compose down -v
docker-compose up -d db redis
docker-compose run --rm backend python manage.py migrate
docker-compose run --rm backend python manage.py createsuperuser
docker-compose run --rm backend python manage.py load_test_data
```

---

## 🌐 **Деплой на удаленный сервер:**

### **Шаг 1: Подготовка сервера**
```bash
# SSH в сервер
ssh user@your-server.com

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
sudo apt-get install docker-compose-plugin
```

### **Шаг 2: Клонирование проекта**
```bash
git clone <your-repo-url>
cd agent_assistant
```

### **Шаг 3: Настройка .env**
```bash
cp .env.example .env
nano .env  # Добавить продакшн настройки
```

**Важно изменить:**
- `DEBUG=False`
- `SECRET_KEY=` - сгенерировать новый
- `ALLOWED_HOSTS=your-domain.com`
- `DB_PASSWORD=` - сильный пароль
- API ключи

### **Шаг 4: Запуск**
```bash
chmod +x start.sh
./start.sh
```

### **Шаг 5: Настройка домена**

Настройте DNS записи:
- A запись: `your-domain.com` → IP сервера
- CNAME: `www.your-domain.com` → `your-domain.com`

### **Шаг 6: SSL сертификат (HTTPS)**
```bash
# Установка Certbot
sudo apt-get install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Копирование сертификатов в nginx
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Перезапуск nginx
docker-compose restart nginx
```

---

## 📊 **Мониторинг:**

### **Использование ресурсов**
```bash
docker stats
```

### **Логи в реальном времени**
```bash
docker-compose logs -f --tail=100
```

### **Проверка здоровья сервисов**
```bash
docker-compose ps
curl http://localhost:8000/api/health/
```

---

## 🐛 **Troubleshooting:**

### **Проблема: "Port already in use"**
```bash
# Найти процесс
lsof -ti:8000
lsof -ti:3000

# Убить процесс
kill -9 <PID>
```

### **Проблема: "Cannot connect to database"**
```bash
# Проверить статус PostgreSQL
docker-compose ps db

# Проверить логи
docker-compose logs db

# Перезапустить
docker-compose restart db
```

### **Проблема: "Migration failed"**
```bash
# Посмотреть какие миграции применены
docker-compose exec backend python manage.py showmigrations

# Применить конкретную миграцию
docker-compose exec backend python manage.py migrate app_name migration_name

# Откатить миграцию
docker-compose exec backend python manage.py migrate app_name migration_name --fake
```

### **Проблема: "Static files not found"**
```bash
# Собрать статику заново
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose restart nginx
```

---

## 🔄 **Обновление проекта:**

```bash
# Получить последние изменения
git pull

# Пересобрать и перезапустить
docker-compose down
docker-compose build
docker-compose up -d

# Применить миграции
docker-compose exec backend python manage.py migrate

# Собрать статику
docker-compose exec backend python manage.py collectstatic --noinput
```

---

## 💾 **Бэкапы:**

### **Автоматический бэкап (cron)**
```bash
# Создать скрипт бэкапа
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Бэкап базы данных
docker-compose exec -T db pg_dump -U postgres agent_assistant_db > $BACKUP_DIR/db_$DATE.sql

# Бэкап media файлов
tar -czf $BACKUP_DIR/media_$DATE.tar.gz media/

# Удалить старые бэкапы (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# Добавить в crontab (каждый день в 3:00)
crontab -e
0 3 * * * /path/to/backup.sh
```

---

## ✅ **Checklist готовности к продакшену:**

- [ ] `.env` файл настроен с продакшн значениями
- [ ] `DEBUG=False` в .env
- [ ] Сильный `SECRET_KEY` сгенерирован
- [ ] Сильный `DB_PASSWORD` установлен
- [ ] `ALLOWED_HOSTS` содержит домен
- [ ] API ключи добавлены (OpenAI, SORA)
- [ ] SSL сертификат настроен
- [ ] Домен направлен на сервер
- [ ] Firewall настроен (порты 80, 443, 22)
- [ ] Автоматические бэкапы настроены
- [ ] Мониторинг настроен
- [ ] Логи ротируются
- [ ] Тестовые данные загружены (опционально)

---

## 🎉 **Готово!**

Проект развернут и готов к использованию!

