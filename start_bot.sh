#!/bin/bash

# Останавливаем все процессы Python с bot.py
echo "Останавливаем все экземпляры бота..."
pkill -f "python3 bot.py"
pkill -f "bot.py"

# Ждем 3 секунды
sleep 3

# Проверяем, что процессы остановлены
if pgrep -f "bot.py" > /dev/null; then
    echo "Предупреждение: некоторые процессы бота все еще запущены"
    pkill -9 -f "bot.py"
    sleep 2
fi

# Запускаем новый экземпляр
echo "Запускаем бота..."
python3 bot.py
