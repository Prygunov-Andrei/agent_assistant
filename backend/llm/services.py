"""
LLM сервисы для анализа запросов
"""

import json
import random
import yaml
from typing import Dict, List, Any, Optional
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
import logging

from .validators import LLMResponseValidator, LLMRetryHandler
from .error_logging import error_logger, error_metrics, log_error

logger = logging.getLogger(__name__)


class LLMEmulatorService:
    """
    Эмулятор LLM для тестирования без реального API
    """
    
    def __init__(self):
        self.config = self._load_config()
        self.test_scenarios = self._load_test_scenarios()
    
    def _load_config(self) -> Dict[str, Any]:
        """Загрузка конфигурации LLM"""
        try:
            config_path = settings.BASE_DIR / 'llm_config.yaml'
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning("LLM config file not found, using defaults")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading LLM config: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Конфигурация по умолчанию"""
        return {
            'llm': {
                'model': 'gpt-4o',
                'temperature': 0.3,
                'max_tokens': 2000,
                'max_retries': 3,
                'timeout': 30
            },
            'validation': {
                'required_fields': [
                    'project_analysis.project_title',
                    'project_analysis.project_type',
                    'project_analysis.roles'
                ],
                'json_schema_strict': True,
                'retry_on_invalid_json': True,
                'max_retry_attempts': 3
            }
        }
    
    def _load_test_scenarios(self) -> List[Dict[str, Any]]:
        """Загрузка тестовых сценариев для эмуляции"""
        return [
            {
                'keywords': ['драма', 'драматический', 'серьезный'],
                'project_type': 'Фильм',
                'genre': 'Драма',
                'template': 'drama'
            },
            {
                'keywords': ['комедия', 'комедийный', 'смешной', 'юмор'],
                'project_type': 'Фильм',
                'genre': 'Комедия',
                'template': 'comedy'
            },
            {
                'keywords': ['сериал', 'многосерийный', 'эпизоды'],
                'project_type': 'Сериал',
                'genre': 'Драма',
                'template': 'series'
            },
            {
                'keywords': ['реклама', 'ролик', 'коммерческий'],
                'project_type': 'Реклама',
                'genre': 'Коммерческий',
                'template': 'commercial'
            },
            {
                'keywords': ['клип', 'музыкальный', 'песня'],
                'project_type': 'Клип',
                'genre': 'Музыкальный',
                'template': 'music_video'
            },
            {
                'keywords': ['театр', 'спектакль', 'постановка'],
                'project_type': 'Театр',
                'genre': 'Драма',
                'template': 'theater'
            },
            {
                'keywords': ['документальный', 'документалка', 'реальная история'],
                'project_type': 'Документальный фильм',
                'genre': 'Документальный',
                'template': 'documentary'
            },
            {
                'keywords': ['короткометражный', 'короткий метр', 'короткометражка'],
                'project_type': 'Короткометражный фильм',
                'genre': 'Драма',
                'template': 'short_film'
            }
        ]
    
    def analyze_request(self, request_data: Dict[str, Any], artists_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Эмуляция анализа запроса с валидацией
        
        Args:
            request_data: Данные запроса (текст, автор и т.д.)
            artists_data: Список доступных артистов
            
        Returns:
            Структурированный JSON ответ для создания проекта
        """
        try:
            error_metrics.increment_metric('total_requests')
            
            # Простая заглушка - всегда возвращаем одни и те же данные для тестирования
            result = {
                'project_analysis': {
                    'project_title': 'Друзья навсегда',
                    'project_type': 'Фильм',
                    'project_type_raw': 'Фильм',
                    'genre': 'Комедия',
                    'description': 'Комедийный фильм о дружбе с элементами романтики',
                    'premiere_date': '2025-03-15',
                    'roles': [
                        {
                            'role_type': 'Актер',
                            'character_name': 'Главный герой',
                            'description': 'Максим, мужчина 25-30 лет, харизматичный, умеет играть комедию. Спортивного телосложения, энергичный.',
                            'age_range': '25-30',
                            'age_min': 25,
                            'age_max': 30,
                            'gender': 'male',
                            'gender_display': 'Мужчина',
                            'media_presence': 'doesnt_matter',
                            'height': '175-185 см',
                            'body_type': 'Спортивное',
                            'hair_color': 'Темный',
                            'eye_color': 'Карие',
                            'hairstyle': 'Короткая стрижка',
                            'clothing_size': '48',
                            'shoe_size': '42',
                            'nationality': 'Русский/Русская',
                            'rate_per_shift': '15000-20000 руб',
                            'shooting_dates': '15-20 марта 2025',
                            'shooting_location': 'Москва',
                            'rate_conditions': 'Оплата по факту съемки, 50% предоплата',
                            'reference_text': 'Образ похож на героя из "Друзья" - Чендлер Бинг',
                            'special_conditions': 'Требуется опыт работы в комедии',
                            'audition_requirements': 'Подготовить 2 монолога: комедийный и драматический',
                            'audition_text': 'Монолог из сцены знакомства с главной героиней',
                            'notes': 'Предпочтительно актер с опытом в театре',
                            'suggested_artists': [],
                            'skills_required': {
                                'acting_skills': ['Актерское мастерство', 'Комедия'],
                                'special_skills': []
                            },
                            'special_requirements': [],
                            'confidence': 0.9
                        },
                        {
                            'role_type': 'Актриса',
                            'character_name': 'Подруга главного героя',
                            'description': 'Анна, женщина 23-28 лет, красивая, умеет петь и танцевать. Яркая внешность, жизнерадостная.',
                            'age_range': '23-28',
                            'age_min': 23,
                            'age_max': 28,
                            'gender': 'female',
                            'gender_display': 'Женщина',
                            'media_presence': 'yes',
                            'height': '165-175 см',
                            'body_type': 'Стройное',
                            'hair_color': 'Светлый',
                            'eye_color': 'Голубые',
                            'hairstyle': 'Длинные волосы',
                            'clothing_size': '42',
                            'shoe_size': '37',
                            'nationality': 'Европеец/Европейка',
                            'rate_per_shift': '18000-25000 руб',
                            'shooting_dates': '22-28 марта 2025',
                            'shooting_location': 'Москва, Санкт-Петербург',
                            'rate_conditions': 'Оплата по договоренности, возможны бонусы',
                            'reference_text': 'Похожа на Рейчел из "Друзья" - жизнерадостная блондинка',
                            'special_conditions': 'Обязательно умение петь и танцевать',
                            'audition_requirements': 'Подготовить песню и танец',
                            'audition_text': 'Песня из мюзикла + импровизация',
                            'notes': 'Желательно опыт в мюзиклах',
                            'suggested_artists': [],
                            'skills_required': {
                                'acting_skills': ['Актерское мастерство', 'Пение', 'Танец'],
                                'special_skills': []
                            },
                            'special_requirements': [],
                            'confidence': 0.85
                        }
                    ],
                    'confidence': 0.85
                },
                # Команда проекта для поиска совпадений
                'contacts': {
                    'casting_director': {
                        'name': 'Иван Петров',
                        'email': 'ivan.petrov@casting.com',
                        'phone': '+7-900-123-45-67',
                        'telegram': '@ivan_petrov',
                        'confidence': 0.9
                    },
                    'director': {
                        'name': 'Анна Козлова',
                        'email': 'anna.kozlova@director.ru',
                        'phone': '+7-900-234-56-78',
                        'telegram': '@anna_kozlova',
                        'confidence': 0.9
                    },
                    'producers': [{
                        'name': 'Дмитрий Волков',
                        'email': 'dmitry.volkov@producer.com',
                        'phone': '+7-900-345-67-89',
                        'telegram': '@dmitry_volkov',
                        'confidence': 0.9
                    }],
                    'production_company': {
                        'name': 'Студия Звезда',
                        'phone': '+7-495-123-45-67',
                        'email': 'info@zvezda.ru',
                        'website': 'https://zvezda.ru',
                        'confidence': 0.85
                    }
                },
                'confidence': 0.85,
                'processing_time': 0.001,
                'used_emulator': True,
                'errors': []
            }
            
            logger.info("LLM Stub: Returning test data for request analysis")
            return result
            
        except ValidationError as e:
            log_error('validation', e, {'request_id': request_data.get('id')})
            raise
        except Exception as e:
            log_error('llm_request', e, {'request_id': request_data.get('id')})
            raise
    
    def _detect_project_type(self, text: str) -> Dict[str, str]:
        """Определение типа проекта по ключевым словам"""
        text_lower = text.lower()
        
        # Проверяем сценарии в порядке приоритета
        for scenario in self.test_scenarios:
            for keyword in scenario['keywords']:
                if keyword in text_lower:
                    return {
                        'project_type': scenario['project_type'],
                        'genre': scenario['genre'],
                        'template': scenario['template']
                    }
        
        # Если не найдено совпадений, возвращаем дефолтный тип
        return {
            'project_type': 'Фильм',
            'genre': 'Драма',
            'template': 'default'
        }
    
    def _generate_roles(self, text: str, artists_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Генерация ролей на основе текста запроса"""
        import re
        roles = []
        
        # Извлекаем роли из текста запроса (формат: "1. Название роли - описание")
        role_pattern = r'(\d+)\.\s*([^-]+?)\s*-\s*([^,\n]+)'
        role_matches = re.findall(role_pattern, text)
        
        for match in role_matches:
            role_number = match[0]
            role_name = match[1].strip()
            role_description = match[2].strip()
            
            # Определяем пол роли
            gender = 'any'
            if any(word in role_description.lower() for word in ['мужчина', 'парень', 'мальчик']):
                gender = 'male'
            elif any(word in role_description.lower() for word in ['женщина', 'девушка', 'девочка']):
                gender = 'female'
            
            # Определяем возраст
            age_range = '25-35'
            age_match = re.search(r'(\d+)-(\d+)\s*лет', role_description)
            if age_match:
                age_range = f"{age_match.group(1)}-{age_match.group(2)}"
            
            roles.append({
                'role_type': 'Актер',
                'character_name': role_name,
                'description': role_description,
                'age_range': age_range,
                'gender': gender,
                'suggested_artists': [],
                'skills_required': {
                    'acting_skills': ['Актерское мастерство'],
                    'special_skills': []
                },
                'special_requirements': [],
                'confidence': 0.9
            })
        
        # Если роли не найдены в тексте, используем старую логику
        if not roles:
            if any(word in text.lower() for word in ['главный', 'ведущий', 'протагонист']):
                roles.append(self._create_role('Главный герой', 'male', artists_data))
            
            if any(word in text.lower() for word in ['женщина', 'девушка', 'героиня']):
                roles.append(self._create_role('Героиня', 'female', artists_data))
            
            if any(word in text.lower() for word in ['злодей', 'антагонист', 'плохой']):
                roles.append(self._create_role('Антагонист', 'male', artists_data))
            
            if any(word in text.lower() for word in ['поддержка', 'второстепенный', 'эпизод']):
                roles.append(self._create_role('Второстепенная роль', 'any', artists_data))
            
            # Если роли все еще не найдены, создаем дефолтную
            if not roles:
                roles.append(self._create_role('Актер', 'any', artists_data))
        
        return roles
    
    def _create_role(self, role_name: str, gender: str, artists_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Создание роли с предложенными артистами"""
        # Фильтруем артистов по полу (если указан)
        suitable_artists = artists_data
        if gender != 'any':
            suitable_artists = [
                artist for artist in artists_data 
                if artist.get('gender', '').lower() == gender.lower()
            ]
        
        # Если нет подходящих артистов, берем всех
        if not suitable_artists:
            suitable_artists = artists_data
        
        # Выбираем случайных артистов (до 3)
        suggested_artists = random.sample(
            suitable_artists, 
            min(3, len(suitable_artists))
        )
        
        return {
            'role_type': 'Актер',
            'character_name': role_name,
            'description': f'Роль: {role_name}',
            'age_range': f'{random.randint(20, 50)}-{random.randint(30, 60)}',
            'gender': gender,
            'suggested_artists': [artist['id'] for artist in suggested_artists],
            'skills_required': {
                'acting_skills': ['драма', 'комедия'],
                'physical_skills': [],
                'languages': ['русский'],
                'special_requirements': []
            },
            'confidence': random.uniform(0.6, 0.9)
        }
    
    def _extract_contacts(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Извлечение контактной информации из запроса"""
        import re
        
        text = request_data.get('text', '')
        author_name = request_data.get('author_name', 'Не определен')
        
        # Извлекаем контакты из текста запроса
        contacts = {
            'casting_director': {
                'name': author_name,
                'phone': 'Не определен',
                'email': 'Не определен',
                'telegram': 'Не определен',
                'confidence': 0.5
            },
            'director': {
                'name': 'Не определен',
                'phone': 'Не определен',
                'email': 'Не определен',
                'telegram': 'Не определен',
                'confidence': 0.0
            },
            'producers': [],
            'production_company': {
                'name': 'Не определен',
                'phone': 'Не определен',
                'email': 'Не определен',
                'website': 'Не определен',
                'confidence': 0.0
            }
        }
        
        # Извлекаем кастинг-директора
        casting_match = re.search(r'Кастинг-директор:\s*([^(]+)\s*\(([^)]+)\)', text, re.IGNORECASE)
        if casting_match:
            contacts['casting_director'] = {
                'name': casting_match.group(1).strip(),
                'email': casting_match.group(2).strip(),
                'phone': 'Не определен',
                'telegram': 'Не определен',
                'confidence': 0.9
            }
        
        # Извлекаем режиссера
        director_match = re.search(r'Режиссер:\s*([^(]+)\s*\(([^)]+)\)', text, re.IGNORECASE)
        if director_match:
            contacts['director'] = {
                'name': director_match.group(1).strip(),
                'email': director_match.group(2).strip(),
                'phone': 'Не определен',
                'telegram': 'Не определен',
                'confidence': 0.9
            }
        
        # Извлекаем продюсера
        producer_match = re.search(r'Продюсер:\s*([^(]+)\s*\(([^)]+)\)', text, re.IGNORECASE)
        if producer_match:
            contacts['producers'] = [{
                'name': producer_match.group(1).strip(),
                'email': producer_match.group(2).strip(),
                'phone': 'Не определен',
                'telegram': 'Не определен',
                'confidence': 0.9
            }]
        
        # Извлекаем продюсерскую компанию
        company_match = re.search(r'(?:Продюсерская компания|Кинокомпания|Компания):\s*([^\n]+)', text, re.IGNORECASE)
        if company_match:
            contacts['production_company'] = {
                'name': company_match.group(1).strip(),
                'phone': 'Не определен',
                'email': 'Не определен',
                'website': 'Не определен',
                'confidence': 0.9
            }
        
        return contacts
        
        # Попытка извлечь контакты из текста (базовая логика)
        if '@' in text:
            # Ищем email
            import re
            emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
            if emails:
                contacts['casting_director']['email'] = emails[0]
                contacts['casting_director']['confidence'] = 0.8
        
        if any(word in text.lower() for word in ['+7', '8(', 'телефон', 'тел']):
            # Ищем телефон
            import re
            phones = re.findall(r'[\+]?[1-9]?[0-9\(\)\-\s]{7,20}', text)
            if phones:
                contacts['casting_director']['phone'] = phones[0]
                contacts['casting_director']['confidence'] = 0.7
        
        return contacts
    
    def _generate_project_title(self, template: str) -> str:
        """Генерация названия проекта"""
        titles = {
            'drama': ['Тени прошлого', 'Последний шанс', 'Разбитые мечты', 'Тихий голос'],
            'comedy': ['Смешные истории', 'Веселые приключения', 'Комедия положений', 'Юмор и смех'],
            'series': ['Долгая дорога', 'Семейные тайны', 'Городские истории', 'Жизнь как она есть'],
            'commercial': ['Новый продукт', 'Рекламный ролик', 'Коммерческое предложение', 'Бренд-кампания'],
            'music_video': ['Музыкальный клип', 'Песня о любви', 'Ритм города', 'Мелодия души'],
            'theater': ['Театральная постановка', 'Спектакль', 'Сценическое искусство', 'Театральная драма'],
            'documentary': ['Реальная история', 'Документальный фильм', 'Жизнь как она есть', 'Правда о...'],
            'short_film': ['Короткая история', 'Момент жизни', 'Короткометражный фильм', 'Быстрая история'],
            'default': ['Новый проект', 'Творческий проект', 'Кинопроект', 'Проект']
        }
        
        return random.choice(titles.get(template, titles['default']))
    
    def _generate_description(self, text: str, template: str) -> str:
        """Генерация описания проекта"""
        base_description = f"Проект создан на основе запроса: {text[:100]}..."
        
        descriptions = {
            'drama': f"{base_description} Драматическая история о человеческих отношениях и жизненных испытаниях.",
            'comedy': f"{base_description} Комедийная постановка с элементами юмора и веселых ситуаций.",
            'series': f"{base_description} Многосерийный проект с развивающимся сюжетом и интересными персонажами.",
            'commercial': f"{base_description} Рекламный проект для продвижения продукта или услуги.",
            'music_video': f"{base_description} Музыкальный клип с визуальным сопровождением песни.",
            'theater': f"{base_description} Театральная постановка для сценического исполнения.",
            'documentary': f"{base_description} Документальный фильм о реальных событиях и людях.",
            'short_film': f"{base_description} Короткометражный фильм с лаконичным сюжетом.",
            'default': f"{base_description} Творческий проект для кинематографа."
        }
        
        return descriptions.get(template, descriptions['default'])
    
    def _generate_premiere_date(self) -> str:
        """Генерация даты премьеры"""
        from datetime import datetime, timedelta
        
        # Генерируем дату от 1 до 12 месяцев в будущем
        days_ahead = random.randint(30, 365)
        premiere_date = datetime.now() + timedelta(days=days_ahead)
        return premiere_date.strftime('%Y-%m-%d')
    
    def _get_fallback_response(self) -> Dict[str, Any]:
        """Fallback ответ при ошибке"""
        return {
            'project_analysis': {
                'project_title': 'Проект по запросу',
                'project_type': 'Фильм',
                'project_type_raw': 'Фильм',
                'genre': 'Драма',
                'description': 'Проект создан на основе запроса пользователя',
                'premiere_date': '2024-12-31',
                'roles': [
                    {
                        'role_type': 'Актер',
                        'character_name': 'Главный герой',
                        'description': 'Основная роль в проекте',
                        'age_range': '25-40',
                        'gender': 'any',
                        'suggested_artists': [],
                        'skills_required': {
                            'acting_skills': ['драма'],
                            'physical_skills': [],
                            'languages': ['русский'],
                            'special_requirements': []
                        },
                        'confidence': 0.5
                    }
                ],
                'contacts': {
                    'casting_director': {
                        'name': 'Не определен',
                        'phone': 'Не определен',
                        'email': 'Не определен',
                        'telegram': 'Не определен',
                        'confidence': 0.0
                    },
                    'director': {
                        'name': 'Не определен',
                        'phone': 'Не определен',
                        'email': 'Не определен',
                        'telegram': 'Не определен',
                        'confidence': 0.0
                    },
                    'producers': [],
                    'production_company': {
                        'name': 'Не определен',
                        'phone': 'Не определен',
                        'email': 'Не определен',
                        'website': 'Не определен',
                        'confidence': 0.0
                    }
                },
                'confidence': 0.3
            }
        }


class LLMService:
    """
    Основной сервис для работы с LLM
    
    Автоматически выбирает между OpenAI GPT-4o и эмулятором
    в зависимости от настроек
    """
    
    def __init__(self):
        print("=" * 80)
        print("🚀 LLMService.__init__ ВЫЗВАН!")
        self.config = self._load_config()
        print(f"📋 Конфиг загружен: use_emulator = {self.config.get('llm', {}).get('use_emulator')}")
        self.emulator = LLMEmulatorService()
        self.openai_service = None
        
        # Попытка инициализации OpenAI сервиса
        should_use = self._should_use_openai()
        print(f"🔍 Должен использовать OpenAI: {should_use}")
        
        if should_use:
            try:
                print("⏳ Попытка инициализации OpenAI...")
                logger.info("Attempting to initialize OpenAI service...")
                from .openai_service import OpenAIService
                self.openai_service = OpenAIService()
                print("✅ OpenAI service initialized successfully")
                logger.info("✅ OpenAI service initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize OpenAI: {e}")
                logger.error(f"❌ Failed to initialize OpenAI service: {e}")
                logger.exception("Full error traceback:")
                logger.warning("⚠️  Falling back to emulator mode")
                self.openai_service = None
        else:
            print("ℹ️  OpenAI disabled, using emulator")
            logger.info("ℹ️  OpenAI disabled, using emulator")
        
        print(f"🎯 ИТОГ: OpenAI сервис = {self.openai_service is not None}")
        print("=" * 80)
    
    def _load_config(self) -> Dict[str, Any]:
        """Загрузка конфигурации LLM"""
        try:
            config_path = settings.BASE_DIR / 'llm_config.yaml'
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning("LLM config file not found, using defaults")
            return {}
        except Exception as e:
            logger.error(f"Error loading LLM config: {e}")
            return {}
    
    def _should_use_openai(self) -> bool:
        """
        Определяет нужно ли использовать OpenAI API
        
        Returns:
            True если настроен API ключ и не включен режим эмулятора
        """
        # Проверяем наличие API ключа
        api_key = getattr(settings, 'OPENAI_API_KEY', None)
        if not api_key:
            return False
        
        # Проверяем флаг use_emulator в конфиге
        use_emulator = self.config.get('llm', {}).get('use_emulator', True)
        return not use_emulator
    
    def analyze_request(self, request_data: Dict[str, Any], artists_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Анализ запроса через LLM или эмулятор
        
        Args:
            request_data: Данные запроса
            artists_data: Список доступных артистов
            
        Returns:
            Структурированный JSON ответ
        """
        # Выбираем сервис для анализа
        logger.info(f"🔍 analyze_request called. OpenAI service available: {self.openai_service is not None}")
        
        if self.openai_service:
            try:
                logger.info("🤖 Using OpenAI GPT-4o for request analysis")
                result = self.openai_service.analyze_request(request_data, artists_data)
                logger.info(f"✅ OpenAI analysis completed. Model: {result.get('model')}")
                return result
            except Exception as e:
                logger.error(f"❌ OpenAI analysis failed: {e}")
                logger.exception("Full error traceback:")
                logger.warning("⚠️  Falling back to emulator")
                return self.emulator.analyze_request(request_data, artists_data)
        else:
            logger.info("🧪 Using LLM Emulator for request analysis")
            return self.emulator.analyze_request(request_data, artists_data)
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Тестирование подключения к LLM сервису
        
        Returns:
            Словарь со статусом подключения
        """
        result = {
            'emulator_available': True,
            'openai_available': False,
            'current_mode': 'emulator'
        }
        
        if self.openai_service:
            try:
                result['openai_available'] = self.openai_service.test_connection()
                result['current_mode'] = 'openai'
            except Exception as e:
                logger.error(f"OpenAI connection test failed: {e}")
        
        return result
    
    def get_service_info(self) -> Dict[str, Any]:
        """
        Получение информации о текущем сервисе
        
        Returns:
            Словарь с информацией о сервисе
        """
        info = {
            'service': 'emulator',
            'config': self.config
        }
        
        if self.openai_service:
            info['service'] = 'openai'
            info['model_info'] = self.openai_service.get_model_info()
        
        return info
