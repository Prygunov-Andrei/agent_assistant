"""
Django команда для управления настройками обнаружения дубликатов
"""
from django.core.management.base import BaseCommand, CommandError
from telegram_requests.duplicate_config import DuplicateDetectionConfig


class Command(BaseCommand):
    help = 'Управление настройками обнаружения дубликатов запросов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--show',
            action='store_true',
            help='Показать текущие настройки',
        )
        parser.add_argument(
            '--preset',
            type=str,
            choices=['strict', 'balanced', 'loose'],
            help='Применить предустановленные настройки',
        )
        parser.add_argument(
            '--test',
            type=str,
            nargs=2,
            metavar=('TEXT1', 'TEXT2'),
            help='Протестировать сравнение двух текстов',
        )

    def handle(self, *args, **options):
        if options['show']:
            self.show_settings()
        elif options['preset']:
            self.apply_preset(options['preset'])
        elif options['test']:
            self.test_comparison(options['test'][0], options['test'][1])
        else:
            self.show_help()

    def show_settings(self):
        """Показать текущие настройки"""
        self.stdout.write(self.style.SUCCESS('Текущие настройки обнаружения дубликатов:'))
        self.stdout.write(f"  Порог схожести: {DuplicateDetectionConfig.SIMILARITY_THRESHOLD:.1%}")
        self.stdout.write(f"  Временное окно: {DuplicateDetectionConfig.TIME_WINDOW_DAYS} дней")
        self.stdout.write(f"  Метод сравнения: {DuplicateDetectionConfig.COMPARISON_METHOD}")
        self.stdout.write(f"  Нормализация регистра: {DuplicateDetectionConfig.NORMALIZE_CASE}")
        self.stdout.write(f"  Нормализация пробелов: {DuplicateDetectionConfig.NORMALIZE_WHITESPACE}")
        self.stdout.write(f"  Удаление пунктуации: {DuplicateDetectionConfig.REMOVE_PUNCTUATION}")
        self.stdout.write(f"  Минимальная длина текста: {DuplicateDetectionConfig.MIN_TEXT_LENGTH}")
        self.stdout.write(f"  Отладочное логирование: {DuplicateDetectionConfig.ENABLE_DEBUG_LOGGING}")
        
        self.stdout.write('\nИсключения:')
        for pattern in DuplicateDetectionConfig.EXCLUDE_PATTERNS:
            self.stdout.write(f"  - {pattern}")

    def apply_preset(self, preset_name):
        """Применить предустановленные настройки"""
        presets = DuplicateDetectionConfig.get_recommended_settings()
        
        if preset_name not in presets:
            raise CommandError(f"Неизвестный пресет: {preset_name}")
        
        preset = presets[preset_name]
        self.stdout.write(self.style.WARNING(f"Внимание: Эта команда только показывает рекомендуемые настройки."))
        self.stdout.write(f"Для применения настройки нужно изменить файл settings.py:")
        self.stdout.write(f"")
        self.stdout.write(f"# {preset['description']}")
        self.stdout.write(f"DUPLICATE_SIMILARITY_THRESHOLD = {preset['similarity_threshold']}")
        self.stdout.write(f"DUPLICATE_TIME_WINDOW_DAYS = {preset['time_window_days']}")
        self.stdout.write(f"DUPLICATE_COMPARISON_METHOD = '{preset['comparison_method']}'")

    def test_comparison(self, text1, text2):
        """Протестировать сравнение двух текстов"""
        from telegram_requests.duplicate_detection import duplicate_detector
        
        self.stdout.write(f"Тестирование сравнения:")
        self.stdout.write(f"  Текст 1: '{text1}'")
        self.stdout.write(f"  Текст 2: '{text2}'")
        self.stdout.write(f"")
        
        similarity = duplicate_detector.calculate_similarity(text1, text2)
        is_duplicate = duplicate_detector.is_duplicate(text1)
        
        self.stdout.write(f"Результат:")
        self.stdout.write(f"  Схожесть: {similarity:.2%}")
        self.stdout.write(f"  Является дубликатом: {'Да' if is_duplicate else 'Нет'}")
        self.stdout.write(f"  Порог схожести: {duplicate_detector.similarity_threshold:.1%}")

    def show_help(self):
        """Показать справку"""
        self.stdout.write(self.style.SUCCESS('Доступные команды:'))
        self.stdout.write('  --show                    Показать текущие настройки')
        self.stdout.write('  --preset {strict|balanced|loose}  Показать рекомендуемые настройки')
        self.stdout.write('  --test "текст1" "текст2"  Протестировать сравнение двух текстов')
        self.stdout.write('')
        self.stdout.write('Примеры:')
        self.stdout.write('  python manage.py duplicate_config --show')
        self.stdout.write('  python manage.py duplicate_config --preset balanced')
        self.stdout.write('  python manage.py duplicate_config --test "Привет мир" "Привет, мир!"')
