from django.http import FileResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import os
import mimetypes
from .models import RequestFile


@csrf_exempt
def download_file(request, request_id, file_id):
    """Скачать файл с правильными заголовками для принудительного скачивания"""
    try:
        # Получаем файл
        try:
            file_obj = RequestFile.objects.get(id=file_id, request_id=request_id)
        except RequestFile.DoesNotExist:
            raise Http404('Файл не найден')
        
        # Проверяем, что файл существует
        file_path = os.path.join(settings.MEDIA_ROOT, file_obj.file.name)
        if not os.path.exists(file_path):
            raise Http404('Файл не найден на сервере')
        
        # Определяем MIME тип
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Для текстовых файлов принудительно устанавливаем правильную кодировку
        if mime_type.startswith('text/'):
            mime_type = 'text/plain; charset=utf-8'
        
        # Создаем ответ с правильными заголовками для скачивания
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=mime_type
        )
        
        # Устанавливаем заголовки для принудительного скачивания
        filename = file_obj.original_filename or os.path.basename(file_path)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = os.path.getsize(file_path)
        
        return response
        
    except Exception as e:
        raise Http404(f'Ошибка скачивания файла: {str(e)}')
