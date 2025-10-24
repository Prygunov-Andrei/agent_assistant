FROM python:3.11-slim

# Устанавливаем системные утилиты (pgrep для healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Устанавливаем только необходимые зависимости для бота
RUN pip install --no-cache-dir \
    python-telegram-bot==20.7 \
    python-dotenv==1.0.0 \
    requests==2.31.0 \
    telethon==1.41.2

# Копируем файлы бота и MTProto клиент
COPY telegram_requests/bot/ /app/
COPY telegram_requests/mtproto_client.py /app/
COPY telegram_requests/agent_assistant_session.session /app/

# Устанавливаем права на файл сессии и создаем директорию для сессий
RUN mkdir -p /app/sessions && \
    chmod 777 /app/sessions && \
    chown 1000:1000 /app/sessions && \
    cp /app/agent_assistant_session.session /app/sessions/agent_assistant_session.session && \
    chmod 777 /app/sessions/agent_assistant_session.session && \
    chown 1000:1000 /app/sessions/agent_assistant_session.session

# Создаем директорию для логов
RUN mkdir -p /app/logs

# Указываем что бот не требует sudo
USER nobody

# Запускаем бота
CMD ["python", "-u", "bot.py"]
