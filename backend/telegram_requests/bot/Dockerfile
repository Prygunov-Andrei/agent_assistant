FROM python:3.11-slim

WORKDIR /app

# Устанавливаем только необходимые зависимости для бота
RUN pip install --no-cache-dir \
    python-telegram-bot==20.7 \
    python-dotenv==1.0.0 \
    requests==2.31.0

# Копируем только файлы бота
COPY telegram_requests/bot/ /app/

# Создаем директорию для логов
RUN mkdir -p /app/logs

# Указываем что бот не требует sudo
USER nobody

# Запускаем бота
CMD ["python", "-u", "bot.py"]

