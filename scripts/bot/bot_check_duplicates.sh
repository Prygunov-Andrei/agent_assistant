#!/bin/bash

# Скрипт для проверки множественных экземпляров Telegram бота
# Помогает избежать конфликтов с Telegram API (один токен = один активный бот)

echo "🔍 Проверка дубликатов Telegram бота..."
echo "========================================"
echo ""

# Ищем все контейнеры с telegram в имени
BOTS=$(docker ps -a --filter "name=telegram" --format "{{.Names}}\t{{.Status}}")

if [ -z "$BOTS" ]; then
    echo "✅ Контейнеров бота не найдено"
    exit 0
fi

echo "📋 Найденные контейнеры бота:"
echo "$BOTS"
echo ""

# Проверяем запущенные боты
RUNNING=$(docker ps --filter "name=telegram" --format "{{.Names}}")

if [ -z "$RUNNING" ]; then
    echo "✅ Запущенных ботов нет"
    exit 0
fi

# Считаем запущенные боты
COUNT=$(echo "$RUNNING" | wc -l | tr -d ' ')

if [ "$COUNT" -gt 1 ]; then
    echo "⚠️  ⚠️  ⚠️  ВНИМАНИЕ! ⚠️  ⚠️  ⚠️"
    echo ""
    echo "Найдено $COUNT запущенных ботов одновременно!"
    echo ""
    echo "Запущенные боты:"
    echo "$RUNNING"
    echo ""
    echo "⚠️  Это вызовет конфликты с Telegram API!"
    echo "Telegram позволяет использовать только ОДИН активный бот на токен."
    echo ""
    echo "Рекомендуется остановить лишние экземпляры."
    echo ""
    read -p "Остановить ВСЕ боты сейчас? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Останавливаем все боты..."
        docker stop $(docker ps -q --filter "name=telegram") 2>/dev/null
        docker rm $(docker ps -aq --filter "name=telegram") 2>/dev/null
        echo "✅ Все боты остановлены и удалены"
        echo ""
        echo "💡 Теперь запустите нужного бота:"
        echo "   Для DEV:        ./scripts/bot/bot_dev_toggle.sh"
        echo "   Для PRODUCTION: см. документацию"
    else
        echo "⚠️  Оставляем боты как есть"
        echo "Убедитесь что только один из них должен быть запущен!"
    fi
elif [ "$COUNT" -eq 1 ]; then
    echo "✅ Запущен 1 бот (нормально):"
    echo "   $RUNNING"
    echo ""
    echo "📋 Для просмотра логов:"
    echo "   docker logs -f $RUNNING"
else
    echo "✅ Дубликатов не найдено"
fi

echo ""
echo "💡 Для управления ботом в DEV режиме:"
echo "   ./scripts/bot/bot_dev_toggle.sh"

