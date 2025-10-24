"""
Поиск дубликатов персон для импорта
"""
from typing import List, Dict, Optional
from rapidfuzz import fuzz
from .models import Person


class PersonDuplicateFinder:
    """Поиск похожих персон в базе данных"""
    
    # Пороги совпадения
    EXACT_MATCH_THRESHOLD = 100
    HIGH_MATCH_THRESHOLD = 85
    MEDIUM_MATCH_THRESHOLD = 70
    MIN_MATCH_THRESHOLD = 60
    
    def find_duplicates(self, person_data: Dict, limit: int = 5) -> List[Dict]:
        """
        Поиск похожих персон в БД
        
        Args:
            person_data: Данные персоны из импорта
            limit: Максимальное количество результатов
            
        Returns:
            List[Dict]: Список похожих персон с оценкой совпадения
        """
        candidates = []
        
        last_name = person_data.get('last_name', '').strip()
        first_name = person_data.get('first_name', '').strip()
        phones = person_data.get('phones', [])
        telegrams = person_data.get('telegrams', [])
        emails = person_data.get('emails', [])
        
        # Если нет фамилии, не можем искать
        if not last_name:
            return []
        
        # 1. Поиск по точному совпадению ФИО
        exact_matches = self._find_by_exact_name(last_name, first_name)
        for person in exact_matches:
            match_info = self._calculate_match_score(person, person_data)
            if match_info['match_score'] >= self.MIN_MATCH_THRESHOLD:
                candidates.append(match_info)
        
        # 2. Поиск по fuzzy совпадению ФИО
        fuzzy_matches = self._find_by_fuzzy_name(last_name, first_name)
        for person in fuzzy_matches:
            # Проверяем, что не добавляем дубликат
            if not any(c['person_id'] == person.id for c in candidates):
                match_info = self._calculate_match_score(person, person_data)
                if match_info['match_score'] >= self.MIN_MATCH_THRESHOLD:
                    candidates.append(match_info)
        
        # 3. Поиск по контактам
        contact_matches = self._find_by_contacts(phones, telegrams, emails)
        for person in contact_matches:
            # Проверяем, что не добавляем дубликат
            if not any(c['person_id'] == person.id for c in candidates):
                match_info = self._calculate_match_score(person, person_data)
                if match_info['match_score'] >= self.MIN_MATCH_THRESHOLD:
                    candidates.append(match_info)
        
        # Сортируем по score (убывание)
        candidates.sort(key=lambda x: x['match_score'], reverse=True)
        
        return candidates[:limit]
    
    def _find_by_exact_name(self, last_name: str, first_name: str) -> List[Person]:
        """Поиск по точному совпадению ФИО"""
        query = Person.objects.filter(
            last_name__iexact=last_name,
            is_active=True
        )
        
        if first_name:
            query = query.filter(first_name__iexact=first_name)
        
        return list(query[:10])
    
    def _find_by_fuzzy_name(self, last_name: str, first_name: str) -> List[Person]:
        """Поиск по нечеткому совпадению ФИО"""
        # Ищем всех с похожей фамилией
        all_persons = Person.objects.filter(
            is_active=True
        ).values('id', 'last_name', 'first_name')[:1000]
        
        matches = []
        for person_dict in all_persons:
            # Сравниваем фамилии
            last_name_score = fuzz.ratio(
                last_name.lower(),
                person_dict['last_name'].lower()
            )
            
            # Если фамилия совпадает достаточно хорошо
            if last_name_score >= 75:
                person = Person.objects.get(id=person_dict['id'])
                matches.append(person)
                
                if len(matches) >= 10:
                    break
        
        return matches
    
    def _find_by_contacts(
        self, 
        phones: List[str], 
        telegrams: List[str], 
        emails: List[str]
    ) -> List[Person]:
        """Поиск по совпадению контактов"""
        from django.db.models import Q
        
        query = Q()
        
        # Поиск по телефонам (старое и новое поле)
        for phone in phones:
            if phone:
                query |= Q(phone=phone)
                query |= Q(phones__contains=[phone])
        
        # Поиск по telegram (старое и новое поле)
        for telegram in telegrams:
            if telegram:
                # Убираем @ если есть
                telegram_clean = telegram.lstrip('@')
                query |= Q(telegram_username=telegram_clean)
                query |= Q(telegram_username=f'@{telegram_clean}')
                query |= Q(telegram_usernames__contains=[telegram_clean])
                query |= Q(telegram_usernames__contains=[f'@{telegram_clean}'])
        
        # Поиск по email (старое и новое поле)
        for email in emails:
            if email:
                query |= Q(email=email)
                query |= Q(emails__contains=[email])
        
        if not query:
            return []
        
        return list(Person.objects.filter(query, is_active=True).distinct()[:10])
    
    def _calculate_match_score(self, person: Person, person_data: Dict) -> Dict:
        """
        Рассчитывает оценку совпадения персоны с данными из импорта
        
        Args:
            person: Существующая персона из БД
            person_data: Данные из импорта
            
        Returns:
            Dict: Информация о совпадении с оценкой
        """
        scores = {
            'name_score': 0,
            'contact_score': 0,
            'total_score': 0
        }
        
        match_reasons = []
        
        # 1. Оценка совпадения имени
        last_name = person_data.get('last_name', '').strip()
        first_name = person_data.get('first_name', '').strip()
        
        if last_name:
            last_name_ratio = fuzz.ratio(
                person.last_name.lower(),
                last_name.lower()
            )
            scores['name_score'] += last_name_ratio * 0.6  # 60% веса на фамилию
            
            if last_name_ratio == 100:
                match_reasons.append('Точное совпадение фамилии')
            elif last_name_ratio >= 85:
                match_reasons.append(f'Похожая фамилия ({last_name_ratio}%)')
        
        if first_name and person.first_name:
            first_name_ratio = fuzz.ratio(
                person.first_name.lower(),
                first_name.lower()
            )
            scores['name_score'] += first_name_ratio * 0.4  # 40% веса на имя
            
            if first_name_ratio == 100:
                match_reasons.append('Точное совпадение имени')
            elif first_name_ratio >= 85:
                match_reasons.append(f'Похожее имя ({first_name_ratio}%)')
        
        # 2. Оценка совпадения контактов
        phones = person_data.get('phones', [])
        telegrams = person_data.get('telegrams', [])
        emails = person_data.get('emails', [])
        
        # Получаем все контакты существующей персоны
        existing_phones = person.phones if isinstance(person.phones, list) else []
        if person.phone:  # Старое поле
            existing_phones.append(person.phone)
        
        existing_telegrams = person.telegram_usernames if isinstance(person.telegram_usernames, list) else []
        if person.telegram_username:  # Старое поле
            existing_telegrams.append(person.telegram_username)
        
        existing_emails = person.emails if isinstance(person.emails, list) else []
        if person.email:  # Старое поле
            existing_emails.append(person.email)
        
        # Проверяем совпадения
        matched_phones = self._find_matching_contacts(phones, existing_phones)
        matched_telegrams = self._find_matching_contacts(
            [t.lstrip('@') for t in telegrams],
            [t.lstrip('@') for t in existing_telegrams]
        )
        matched_emails = self._find_matching_contacts(emails, existing_emails)
        
        total_contacts_checked = len(phones) + len(telegrams) + len(emails)
        total_contacts_matched = len(matched_phones) + len(matched_telegrams) + len(matched_emails)
        
        if total_contacts_checked > 0:
            scores['contact_score'] = (total_contacts_matched / total_contacts_checked) * 100
        
        # Добавляем причины совпадения контактов
        if matched_phones:
            match_reasons.append(f"Совпадают телефоны: {', '.join(matched_phones)}")
        if matched_telegrams:
            match_reasons.append(f"Совпадают Telegram: {', '.join(matched_telegrams)}")
        if matched_emails:
            match_reasons.append(f"Совпадают Email: {', '.join(matched_emails)}")
        
        # 3. Итоговая оценка (взвешенная сумма)
        # Если есть совпадение контактов, это очень важно
        if total_contacts_matched > 0:
            scores['total_score'] = (
                scores['name_score'] * 0.5 +
                scores['contact_score'] * 0.5
            )
        else:
            # Если контактов нет, оценка только по имени
            scores['total_score'] = scores['name_score']
        
        # Если нет причин совпадения, добавляем общую
        if not match_reasons:
            match_reasons.append('Частичное совпадение данных')
        
        return {
            'person_id': person.id,
            'match_score': int(scores['total_score']),
            'match_reasons': match_reasons,
            'existing_data': {
                'full_name': person.full_name,
                'person_type': person.get_person_type_display(),
                'person_type_code': person.person_type,
                'phones': existing_phones,
                'telegrams': existing_telegrams,
                'emails': existing_emails,
                'kinopoisk_url': person.kinopoisk_url,
                'photo_url': person.photo.url if person.photo else None,
            }
        }
    
    def _find_matching_contacts(
        self, 
        new_contacts: List[str], 
        existing_contacts: List[str]
    ) -> List[str]:
        """
        Находит совпадающие контакты
        
        Args:
            new_contacts: Новые контакты из импорта
            existing_contacts: Существующие контакты в БД
            
        Returns:
            List[str]: Список совпадающих контактов
        """
        matched = []
        
        for new_contact in new_contacts:
            new_clean = str(new_contact).strip().lower()
            for existing_contact in existing_contacts:
                existing_clean = str(existing_contact).strip().lower()
                if new_clean == existing_clean:
                    matched.append(new_contact)
                    break
        
        return matched
    
    def has_exact_match(self, person_data: Dict) -> Optional[Person]:
        """
        Проверяет наличие точного совпадения (100%)
        
        Args:
            person_data: Данные персоны из импорта
            
        Returns:
            Person или None
        """
        duplicates = self.find_duplicates(person_data, limit=1)
        
        if duplicates and duplicates[0]['match_score'] == 100:
            return Person.objects.get(id=duplicates[0]['person_id'])
        
        return None

