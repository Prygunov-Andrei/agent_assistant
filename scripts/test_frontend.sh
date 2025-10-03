#!/bin/bash
# Скрипт для запуска frontend тестов

set -e

echo "🚀 Запуск frontend тестов..."

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

# Переходим в директорию frontend
cd "$(dirname "$0")/../frontend"

# Проверяем аргументы
if [ "$1" = "unit" ]; then
    print_header "Frontend Unit тесты"
    npm test -- --testPathPattern="unit" --coverage --watchAll=false
    check_success "Frontend Unit тесты"
elif [ "$1" = "integration" ]; then
    print_header "Frontend Integration тесты"
    npm test -- --testPathPattern="integration" --coverage --watchAll=false
    check_success "Frontend Integration тесты"
elif [ "$1" = "components" ]; then
    print_header "Frontend Component тесты"
    npm test -- --testPathPattern="components" --coverage --watchAll=false
    check_success "Frontend Component тесты"
elif [ "$1" = "services" ]; then
    print_header "Frontend Service тесты"
    npm test -- --testPathPattern="services" --coverage --watchAll=false
    check_success "Frontend Service тесты"
else
    print_header "Все Frontend тесты"
    npm test -- --coverage --watchAll=false
    check_success "Все Frontend тесты"
fi

echo -e "${GREEN}Frontend тесты завершены успешно! 🎉${NC}"
