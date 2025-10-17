"""
Сервис массового импорта персон
"""
import os
from typing import List, Dict
from django.core.files.storage import default_storage
from django.utils import timezone
from .models import Person, ImportSession
from .excel_parser import ExcelPersonParser
from .duplicate_finder import PersonDuplicateFinder


class BulkImportService:
    """Сервис для массового импорта персон из Excel"""
    
    def __init__(self):
        self.parser = ExcelPersonParser()
        self.duplicate_finder = PersonDuplicateFinder()
        self.validator = PersonDataValidator()
    
    def process_upload(self, file, user) -> ImportSession:
        """
        Обработка загруженного файла
        
        Args:
            file: Загруженный файл
            user: Пользователь, который загрузил
            
        Returns:
            ImportSession: Сессия импорта с результатами обработки
        """
        # 1. Создаем сессию импорта
        import_session = ImportSession.objects.create(
            user=user,
            file=file,
            original_filename=file.name,
            status='processing'
        )
        
        try:
            # 2. Сохраняем файл и получаем путь
            file_path = import_session.file.path
            
            # 3. Валидируем файл
            validation_result = self.parser.validate_file(file_path)
            if not validation_result['valid']:
                import_session.mark_failed(validation_result['error'])
                return import_session
            
            # 4. Парсим файл
            records = self.parser.parse_file(file_path)
            
            # 5. Валидируем и обрабатываем каждую запись
            preview_records = []
            error_records = []
            valid_count = 0
            invalid_count = 0
            
            for record in records:
                # Валидация данных
                validation_errors = self.validator.validate(record['data'])
                
                if validation_errors:
                    record['validation_errors'] = validation_errors
                    error_records.append({
                        'row_number': record['row_number'],
                        'errors': validation_errors
                    })
                    invalid_count += 1
                else:
                    # Поиск дубликатов только для валидных записей
                    try:
                        duplicates = self.duplicate_finder.find_duplicates(record['data'])
                        record['potential_duplicates'] = duplicates
                        valid_count += 1
                    except Exception as e:
                        record['validation_errors'] = [f'Ошибка поиска дубликатов: {str(e)}']
                        error_records.append({
                            'row_number': record['row_number'],
                            'errors': [str(e)]
                        })
                        invalid_count += 1
                
                preview_records.append(record)
            
            # 6. Сохраняем результаты в сессию
            import_session.records_data = {
                'preview': preview_records,
                'errors': error_records
            }
            import_session.total_rows = len(records)
            import_session.valid_rows = valid_count
            import_session.invalid_rows = invalid_count
            import_session.status = 'pending'
            import_session.save()
            
            return import_session
            
        except Exception as e:
            import_session.mark_failed(f'Ошибка обработки файла: {str(e)}')
            return import_session
    
    def execute_import(self, import_session: ImportSession, decisions: List[Dict]) -> Dict:
        """
        Выполнение импорта с учетом решений пользователя
        
        Args:
            import_session: Сессия импорта
            decisions: Список решений пользователя для каждой строки
            
        Returns:
            Dict: Результаты импорта
        """
        results = {
            'status': 'completed',
            'statistics': {
                'created': 0,
                'updated': 0,
                'skipped': 0,
                'errors': 0
            },
            'details': []
        }
        
        try:
            for decision in decisions:
                row_number = decision.get('row_number')
                action = decision.get('action')
                person_id = decision.get('person_id')
                
                # Получаем запись из сессии
                record = import_session.get_record(row_number)
                if not record:
                    results['statistics']['errors'] += 1
                    results['details'].append({
                        'row_number': row_number,
                        'action': 'error',
                        'error': 'Запись не найдена'
                    })
                    continue
                
                try:
                    if action == 'create':
                        person = self._create_person(record['data'], import_session.user)
                        results['statistics']['created'] += 1
                        results['details'].append({
                            'row_number': row_number,
                            'action': 'created',
                            'person_id': person.id,
                            'full_name': person.full_name
                        })
                        
                    elif action == 'update':
                        if not person_id:
                            raise ValueError('person_id обязателен для action=update')
                        
                        person = self._update_person(person_id, record['data'])
                        results['statistics']['updated'] += 1
                        results['details'].append({
                            'row_number': row_number,
                            'action': 'updated',
                            'person_id': person.id,
                            'full_name': person.full_name
                        })
                        
                    elif action == 'skip':
                        results['statistics']['skipped'] += 1
                        results['details'].append({
                            'row_number': row_number,
                            'action': 'skipped'
                        })
                    
                    else:
                        raise ValueError(f'Неизвестное действие: {action}')
                        
                except Exception as e:
                    results['statistics']['errors'] += 1
                    results['details'].append({
                        'row_number': row_number,
                        'action': 'error',
                        'error': str(e)
                    })
            
            # Обновляем статистику в сессии
            import_session.created_count = results['statistics']['created']
            import_session.updated_count = results['statistics']['updated']
            import_session.skipped_count = results['statistics']['skipped']
            import_session.error_count = results['statistics']['errors']
            import_session.mark_completed()
            
        except Exception as e:
            results['status'] = 'failed'
            import_session.mark_failed(str(e))
        
        return results
    
    def _create_person(self, data: Dict, user) -> Person:
        """
        Создание новой персоны с контактами
        
        Args:
            data: Данные персоны
            user: Пользователь, создающий персону
            
        Returns:
            Person: Созданная персона
        """
        # Создаем персону
        person = Person.objects.create(
            person_type=data.get('person_type'),
            last_name=data.get('last_name', ''),
            first_name=data.get('first_name', ''),
            phones=data.get('phones', []),
            emails=data.get('emails', []),
            telegram_usernames=data.get('telegrams', []),
            kinopoisk_url=data.get('kinopoisk_url'),
            created_by=user,
            is_active=True
        )
        
        return person
    
    def _update_person(self, person_id: int, data: Dict) -> Person:
        """
        Обновление существующей персоны (добавление новых контактов)
        
        Args:
            person_id: ID персоны для обновления
            data: Новые данные
            
        Returns:
            Person: Обновленная персона
        """
        person = Person.objects.get(id=person_id)
        
        updated = False
        
        # Обновляем kinopoisk_url если его нет
        if not person.kinopoisk_url and data.get('kinopoisk_url'):
            person.kinopoisk_url = data.get('kinopoisk_url')
            updated = True
        
        # Добавляем новые контакты
        phones = data.get('phones', [])
        for phone in phones:
            if person.add_contact('phone', phone):
                updated = True
        
        telegrams = data.get('telegrams', [])
        for telegram in telegrams:
            if person.add_contact('telegram', telegram):
                updated = True
        
        emails = data.get('emails', [])
        for email in emails:
            if person.add_contact('email', email):
                updated = True
        
        if updated:
            person.save()
        
        return person


class PersonDataValidator:
    """Валидатор данных персоны из импорта"""
    
    VALID_PERSON_TYPES = ['director', 'producer', 'casting_director']
    
    def validate(self, data: Dict) -> List[str]:
        """
        Валидирует данные персоны
        
        Args:
            data: Данные персоны
            
        Returns:
            List[str]: Список ошибок валидации (пустой если все ок)
        """
        errors = []
        
        # Проверка обязательных полей
        if not data.get('last_name') or not data.get('last_name').strip():
            errors.append('Не указана фамилия')
        
        if not data.get('first_name') or not data.get('first_name').strip():
            errors.append('Не указано имя')
        
        person_type = data.get('person_type')
        if not person_type or not person_type.strip():
            errors.append('Не указан тип персоны')
        elif person_type not in self.VALID_PERSON_TYPES:
            errors.append(f'Неверный тип персоны: {person_type}. Допустимые: КД, Режиссер, Продюсер')
        
        # Валидация email
        emails = data.get('emails', [])
        for email in emails:
            if email and not self._is_valid_email(email):
                errors.append(f'Неверный формат email: {email}')
        
        # Валидация телефонов
        phones = data.get('phones', [])
        for phone in phones:
            if phone and not self._is_valid_phone(phone):
                errors.append(f'Неверный формат телефона: {phone}')
        
        # Валидация URL
        kinopoisk_url = data.get('kinopoisk_url')
        if kinopoisk_url and not self._is_valid_url(kinopoisk_url):
            errors.append(f'Неверный формат URL: {kinopoisk_url}')
        
        # Проверка максимального количества контактов
        if len(phones) > 5:
            errors.append('Слишком много телефонов (максимум 5)')
        
        if len(emails) > 5:
            errors.append('Слишком много email адресов (максимум 5)')
        
        telegrams = data.get('telegrams', [])
        if len(telegrams) > 5:
            errors.append('Слишком много Telegram аккаунтов (максимум 5)')
        
        return errors
    
    def _is_valid_email(self, email: str) -> bool:
        """Проверка формата email"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _is_valid_phone(self, phone: str) -> bool:
        """Проверка формата телефона"""
        import re
        # Простая проверка: должны быть цифры и длина >= 10
        digits = re.sub(r'\D', '', phone)
        return len(digits) >= 10
    
    def _is_valid_url(self, url: str) -> bool:
        """Проверка формата URL"""
        import re
        pattern = r'^https?://[^\s]+$'
        return bool(re.match(pattern, url))

