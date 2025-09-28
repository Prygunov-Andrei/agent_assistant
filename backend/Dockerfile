FROM python:3.9-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements.txt и устанавливаем Python зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код проекта
COPY . .

# Создаем пользователя для безопасности
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Открываем порт
EXPOSE 8000

# Команда для запуска Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
