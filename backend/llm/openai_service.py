"""
Сервис для работы с OpenAI GPT-4o API
"""

import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
from django.conf import settings
from openai import OpenAI, OpenAIError
from openai.types.chat import ChatCompletion

from .validators import LLMResponseValidator
from .error_logging import error_logger, log_error

logger = logging.getLogger(__name__)


class OpenAIService:
    """
    Сервис для работы с OpenAI GPT-4o API
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Инициализация сервиса
        
        Args:
            api_key: API ключ OpenAI (если не указан, берется из settings)
        """
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', None)
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY не указан в настройках")
        
        self.client = OpenAI(api_key=self.api_key)
        self.prompt = self._load_prompt()
        self.schema = self._load_schema()
        
        # Параметры модели
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o')
        self.temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.3)
        self.max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 4000)
        self.max_retries = getattr(settings, 'OPENAI_MAX_RETRIES', 3)
        self.timeout = getattr(settings, 'OPENAI_TIMEOUT', 60)
        
        logger.info(f"OpenAI Service initialized with model: {self.model}")
    
    def _load_prompt(self) -> str:
        """Загрузка промпта из файла"""
        try:
            prompt_path = Path(__file__).parent / 'llm_prompt.txt'
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            logger.error("LLM prompt file not found")
            raise
    
    def _load_schema(self) -> Dict[str, Any]:
        """Загрузка JSON схемы"""
        try:
            schema_path = Path(__file__).parent / 'llm_schema.json'
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error("LLM schema file not found")
            raise
    
    def analyze_request(
        self, 
        request_data: Dict[str, Any], 
        artists_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Анализ запроса через GPT-4o
        
        Args:
            request_data: Данные запроса (текст, автор, медиа)
            artists_data: Список доступных артистов (не используется пока)
            
        Returns:
            Структурированный JSON ответ
            
        Raises:
            OpenAIError: При ошибке вызова API
            ValidationError: При ошибке валидации ответа
        """
        request_text = request_data.get('text', '')
        request_id = request_data.get('id', 'unknown')
        
        if not request_text:
            raise ValueError("Request text is empty")
        
        logger.info(f"Analyzing request #{request_id} with OpenAI GPT-4o")
        
        # Формируем полный промпт
        full_prompt = f"{self.prompt}\n\n{request_text}"
        
        # Вызываем GPT-4o с JSON mode
        try:
            response = self._call_openai_with_retry(full_prompt)
            
            # Парсим JSON ответ
            result = self._parse_response(response)
            
            # Валидируем ответ
            validator = LLMResponseValidator()
            validated_result = result  # Валидатор возвращает bool, используем исходный result
            
            # Добавляем метаданные
            validated_result['processing_time'] = getattr(response, 'processing_time', 0)
            validated_result['used_emulator'] = False
            validated_result['model'] = self.model
            
            logger.info(f"Successfully analyzed request #{request_id}")
            return validated_result
            
        except OpenAIError as e:
            log_error('openai_api', e, {'request_id': request_id})
            raise
        except json.JSONDecodeError as e:
            log_error('json_parse', e, {'request_id': request_id, 'response': str(response)})
            raise
        except Exception as e:
            log_error('llm_analysis', e, {'request_id': request_id})
            raise
    
    def _call_openai_with_retry(self, prompt: str, retry_count: int = 0) -> ChatCompletion:
        """
        Вызов OpenAI API с retry логикой и Structured Outputs
        
        Args:
            prompt: Промпт для GPT-4o
            retry_count: Текущая попытка (для рекурсии)
            
        Returns:
            ChatCompletion ответ от API
        """
        try:
            # Используем Structured Outputs с JSON schema для строгого соответствия формату
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "Ты профессиональный ассистент кастинг-директора. Анализируй запросы и извлекай информацию строго по указанной JSON схеме. Всегда возвращай валидный JSON."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                timeout=self.timeout,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "casting_request_analysis",
                        "strict": False,
                        "schema": self.schema
                    }
                }
            )
            
            return response
            
        except OpenAIError as e:
            if retry_count < self.max_retries:
                logger.warning(f"OpenAI API error, retrying ({retry_count + 1}/{self.max_retries}): {e}")
                return self._call_openai_with_retry(prompt, retry_count + 1)
            else:
                logger.error(f"OpenAI API error after {self.max_retries} retries: {e}")
                raise
    
    def _parse_response(self, response: ChatCompletion) -> Dict[str, Any]:
        """
        Парсинг ответа от OpenAI
        
        Args:
            response: ChatCompletion ответ от API
            
        Returns:
            Распарсенный JSON объект
        """
        try:
            # Извлекаем текст ответа
            content = response.choices[0].message.content
            
            if not content:
                raise ValueError("Empty response from OpenAI")
            
            # Парсим JSON
            result = json.loads(content)
            
            return result
            
        except (IndexError, KeyError, json.JSONDecodeError) as e:
            logger.error(f"Error parsing OpenAI response: {e}")
            logger.error(f"Response: {response}")
            raise
    
    def test_connection(self) -> bool:
        """
        Тестирование подключения к OpenAI API
        
        Returns:
            True если подключение успешно
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Test connection"}],
                max_tokens=10,
                timeout=10
            )
            logger.info("OpenAI API connection test successful")
            return True
        except OpenAIError as e:
            logger.error(f"OpenAI API connection test failed: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Получение информации о текущей модели
        
        Returns:
            Словарь с информацией о модели
        """
        return {
            'model': self.model,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'max_retries': self.max_retries,
            'timeout': self.timeout
        }

