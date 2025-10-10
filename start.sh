#!/bin/bash

# Скрипт запуска Agent Assistant в Docker контейнерах

echo "🚀 Запуск Agent Assistant..."
echo ""

# Проверяем Docker
echo "1️⃣  Проверка Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен!"
    echo "   Запустите Docker Desktop и повторите попытку."
    exit 1
fi
echo "✅ Docker работает"
echo ""

# Проверяем .env файл
echo "2️⃣  Проверка .env файла..."
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден!"
    echo "   Создаем из .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Файл .env создан. ОБЯЗАТЕЛЬНО ДОБАВЬТЕ API КЛЮЧИ!"
    else
        echo "❌ .env.example не найден!"
        exit 1
    fi
else
    echo "✅ Файл .env существует"
fi
echo ""

# Останавливаем старые контейнеры
echo "3️⃣  Остановка старых контейнеров..."
docker-compose down > /dev/null 2>&1
echo "✅ Старые контейнеры остановлены"
echo ""

# Запускаем базу данных и Redis
echo "4️⃣  Запуск PostgreSQL и Redis..."
docker-compose up -d db redis
echo "⏳ Ожидание готовности базы данных..."
sleep 5

# Проверяем готовность БД
until docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Ожидание PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL готов"
echo ""

# Применяем миграции
echo "5️⃣  Применение миграций..."
docker-compose run --rm backend python manage.py migrate
echo "✅ Миграции применены"
echo ""

# Загружаем тестовые данные (опционально)
read -p "6️⃣  Загрузить тестовые данные? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose run --rm backend python manage.py load_test_data --clear
    echo "✅ Тестовые данные загружены"
fi
echo ""

# Запускаем все сервисы
echo "7️⃣  Запуск всех сервисов..."
docker-compose up -d
echo "✅ Все сервисы запущены"
echo ""

# Показываем статус
echo "8️⃣  Статус сервисов:"
docker-compose ps
echo ""

echo "✅ Agent Assistant запущен!"
echo ""
echo "📱 Доступные URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/api/docs/"
echo "   Admin:     http://localhost:8000/admin/"
echo "   Nginx:     http://localhost"
echo ""
echo "📊 Просмотр логов:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 Остановка:"
echo "   docker-compose down"
echo ""
echo "💾 Полная остановка с удалением данных:"
echo "   docker-compose down -v"
echo ""

