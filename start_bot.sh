#!/bin/bash

# Убиваем все существующие процессы bot.py
echo "Останавливаем все существующие экземпляры бота..."
pkill -f "python.*bot.py" 2>/dev/null || true
pkill -f "bot.py" 2>/dev/null || true

# Ждем немного, чтобы процессы завершились
sleep 2

# Проверяем, что все процессы остановлены
REMAINING=$(ps aux | grep -E "(python.*bot\.py|bot\.py)" | grep -v grep | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo "Предупреждение: остались запущенные процессы бота"
    ps aux | grep -E "(python.*bot\.py|bot\.py)" | grep -v grep
fi

# Запускаем новый экземпляр
echo "Запускаем новый экземпляр бота..."
python3 backend/telegram_requests/bot/bot.py &
BOT_PID=$!

echo "Бот запущен с PID: $BOT_PID"
echo "Для остановки используйте: kill $BOT_PID"