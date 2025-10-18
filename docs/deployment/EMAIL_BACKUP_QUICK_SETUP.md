# Быстрая настройка Email для системы резервного копирования

## 🚀 Быстрый старт (5 минут)

### 1. Настройте SMTP в Django
Добавьте в ваш `.env` файл настройки для отправки email:

```bash
# ==============================
# EMAIL BACKUP SETTINGS
# ==============================

# Email Configuration for Backup
EMAIL_BACKUP_ENABLED=True
EMAIL_BACKUP_RECIPIENT=your-email@example.com
EMAIL_BACKUP_SUBJECT_PREFIX=[AgentAssistant] Backup

# Local Backup Settings
LOCAL_BACKUP_DIR=/app/backups
LOCAL_BACKUP_FILENAME=latest_backup.sql.gz

# Database backup timeout (seconds)
DB_BACKUP_TIMEOUT=300
```

### 2. Настройте SMTP сервер
Добавьте настройки SMTP в ваш `.env` файл:

**Для Gmail:**
```bash
# SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Для Yandex:**
```bash
# SMTP Configuration
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@yandex.ru
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@yandex.ru
```

**Для Mail.ru:**
```bash
# SMTP Configuration
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@mail.ru
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@mail.ru
```

### 3. Перезапустите контейнеры
```bash
./scripts/deploy/stop_all.sh
./scripts/deploy/start_all.sh
```

### 4. Протестируйте
1. Откройте веб-интерфейс
2. Перейдите в **"Настройки" → "Резервные копии"**
3. Нажмите **"Создать новый бэкап"**
4. Проверьте почту - должен прийти файл бэкапа

## ✅ Готово!

Теперь система резервного копирования будет:
- ✅ **Сохранять** последний бэкап локально на сервере
- ✅ **Отправлять** бэкап на вашу почту
- ✅ **Перезаписывать** старый бэкап новым

## 🔧 Устранение неполадок

### "SMTP Authentication failed"
- Проверьте правильность email и пароля
- Для Gmail используйте App Password вместо обычного пароля
- Убедитесь, что включена двухфакторная аутентификация

### "Connection refused"
- Проверьте правильность SMTP сервера и порта
- Убедитесь, что сервер доступен из контейнера

### "Email not sent"
- Проверьте настройки `EMAIL_BACKUP_ENABLED=True`
- Убедитесь, что указан `EMAIL_BACKUP_RECIPIENT`
- Проверьте логи Django на наличие ошибок

## 📋 Что происходит автоматически

- ✅ **Создание папки** `/app/backups` на сервере
- ✅ **Сохранение бэкапа** как `latest_backup.sql.gz`
- ✅ **Отправка email** с прикрепленным файлом бэкапа
- ✅ **Логирование** всех операций в Django logs
