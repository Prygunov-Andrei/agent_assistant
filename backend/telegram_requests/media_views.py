from django.http import FileResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import os
import mimetypes


@csrf_exempt
def serve_media_file(request, path):
    """Обслуживание медиафайлов с принудительным скачиванием"""
    try:
        # Полный путь к файлу
        file_path = os.path.join(settings.MEDIA_ROOT, path)
        
        # Проверяем, что файл существует
        if not os.path.exists(file_path):
            raise Http404('Файл не найден')
        
        # Определяем MIME тип
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Для текстовых файлов принудительно устанавливаем правильную кодировку
        if mime_type.startswith('text/'):
            mime_type = 'text/plain; charset=utf-8'
        
        # Создаем ответ с правильными заголовками для принудительного скачивания
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=mime_type
        )
        
        # Устанавливаем заголовки для принудительного скачивания
        filename = os.path.basename(file_path)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = os.path.getsize(file_path)
        
        return response
        
    except Exception as e:
        raise Http404(f'Ошибка обслуживания файла: {str(e)}')
