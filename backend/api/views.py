from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def health_check(request):
    """Проверка здоровья API"""
    return Response({
        'status': 'ok',
        'message': 'API работает корректно',
        'service': 'Agent Assistant Backend'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def api_info(request):
    """Информация об API"""
    return Response({
        'name': 'Agent Assistant API',
        'version': '1.0.0',
        'description': 'API для автоматизации рабочего места актерского агента',
        'endpoints': {
            'health': '/api/health/',
            'info': '/api/info/'
        }
    }, status=status.HTTP_200_OK)