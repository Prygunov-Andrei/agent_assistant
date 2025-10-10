"""
Команда для добавления тестовых медиа к запросу
"""

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from telegram_requests.models import Request, RequestImage, RequestFile
from PIL import Image
import io
import json


class Command(BaseCommand):
    help = 'Добавляет тестовые изображения и файлы к запросу'

    def add_arguments(self, parser):
        parser.add_argument(
            'request_id',
            type=int,
            help='ID запроса для добавления медиа'
        )

    def handle(self, *args, **options):
        request_id = options['request_id']
        
        try:
            request = Request.objects.get(id=request_id)
        except Request.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Запрос #{request_id} не найден'))
            return
        
        self.stdout.write(f'Добавление медиа к запросу #{request_id}...')
        
        # Создаем тестовые изображения
        self._create_test_images(request)
        
        # Создаем тестовый файл (JSON с описанием роли)
        self._create_test_file(request)
        
        # Обновляем флаги
        request.has_images = True
        request.has_files = True
        request.save()
        
        self.stdout.write(self.style.SUCCESS(f'✅ Медиа успешно добавлено к запросу #{request_id}'))
        self.stdout.write(f'   Изображений: {request.images.count()}')
        self.stdout.write(f'   Файлов: {request.files.count()}')
    
    def _create_test_images(self, request):
        """Создание тестовых изображений"""
        
        # Создаем 2 тестовых изображения разных цветов
        colors = [
            ((100, 150, 200), 'reference_blue.jpg'),
            ((200, 150, 100), 'reference_brown.jpg')
        ]
        
        for color, filename in colors:
            # Создаем простое изображение с текстом
            img = Image.new('RGB', (400, 300), color=color)
            
            # Сохраняем в BytesIO
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            # Создаем RequestImage
            request_image = RequestImage.objects.create(
                request=request,
                caption=f'Референс изображение {filename}',
                telegram_file_id=f'test_file_id_{filename}',
                file_size=buffer.getbuffer().nbytes
            )
            
            # Сохраняем файл
            request_image.image.save(
                filename,
                ContentFile(buffer.read()),
                save=True
            )
            
            self.stdout.write(f'   ✅ Создано изображение: {filename}')
    
    def _create_test_file(self, request):
        """Создание тестового файла с описанием роли"""
        
        # Создаем JSON файл с примером описания роли
        test_data = {
            "role": "Главный герой",
            "age": "25-30 лет",
            "gender": "Мужчина",
            "description": "Харизматичный, спортивного телосложения, опыт в комедии",
            "rate": "15000-20000 руб/смена",
            "shooting_dates": "15-20 марта 2025",
            "location": "Москва"
        }
        
        json_content = json.dumps(test_data, ensure_ascii=False, indent=2)
        
        # Создаем RequestFile
        request_file = RequestFile.objects.create(
            request=request,
            original_filename='role_requirements.json',
            file_size=len(json_content.encode('utf-8')),
            mime_type='application/json',
            telegram_file_id='test_json_file_id'
        )
        
        # Сохраняем файл
        request_file.file.save(
            'role_requirements.json',
            ContentFile(json_content.encode('utf-8')),
            save=True
        )
        
        self.stdout.write(f'   ✅ Создан файл: role_requirements.json')

