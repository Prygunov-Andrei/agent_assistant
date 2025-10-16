#!/bin/bash
# Скрипт для запуска backend тестов

set -e

echo "🚀 Запуск backend тестов..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Функция для проверки успешности выполнения
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 успешно завершено${NC}"
    else
        echo -e "${RED}❌ $1 завершилось с ошибкой${NC}"
        exit 1
    fi
}

# Переходим в директорию backend
cd "$(dirname "$0")/../backend"
source venv/bin/activate

# Проверяем аргументы
if [ "$1" = "unit" ]; then
    print_header "Backend Unit тесты"
    python -m pytest tests/unit/ -v --tb=short
    check_success "Backend Unit тесты"
elif [ "$1" = "integration" ]; then
    print_header "Backend Integration тесты"
    python -m pytest tests/integration/ -v --tb=short
    check_success "Backend Integration тесты"
elif [ "$1" = "models" ]; then
    print_header "Backend Model тесты"
    python -m pytest tests/unit/ -k "test_models" -v --tb=short
    check_success "Backend Model тесты"
elif [ "$1" = "views" ]; then
    print_header "Backend View тесты"
    python -m pytest tests/unit/ -k "test_views" -v --tb=short
    check_success "Backend View тесты"
elif [ "$1" = "services" ]; then
    print_header "Backend Service тесты"
    python -m pytest tests/unit/ -k "test_services" -v --tb=short
    check_success "Backend Service тесты"
elif [ "$1" = "api" ]; then
    print_header "Backend API тесты"
    python -m pytest tests/integration/ -k "api" -v --tb=short
    check_success "Backend API тесты"
else
    print_header "Все Backend тесты"
    python -m pytest tests/ -v --tb=short
    check_success "Все Backend тесты"
fi

echo -e "${GREEN}Backend тесты завершены успешно! 🎉${NC}"
