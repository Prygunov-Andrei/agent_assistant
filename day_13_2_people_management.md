# День 13.2: Управление персонами (КД, Продюсеры, Режиссеры)

## 🎯 Цель
Создать полнофункциональный интерфейс для управления персонами (Кастинг-директора, Продюсеры, Режиссеры) с использованием единого подхода DRY для всех CRUD операций.

## 📋 Анализ требований

### Функциональные требования:

**Таблица персон:**
- Колонка 1: Фото в кружочке (аватар)
- Колонка 2: ФИО (полное)
- Колонка 3: Контакты (телефон, ТГ, почта - друг под другом)
- Колонка 4: Проекты (последние 5, от новых к старым, кликабельные, обрезка если больше 5)
- Без шапки и заголовка таблицы
- Клик по строке → модальное окно просмотра

**Над таблицей:**
- Кнопка "Создать КД / Режиссера / Продюсера"
- Поле поиска (по ФИО, телефону, почте, ТГ, проектам)
- Сортировка (по дате добавления, ФИО, количеству проектов)

**Модальное окно просмотра:**
- Отображение всех полей персоны
- Кнопки: Редактировать / Удалить / Закрыть
- Редактирование и удаление только для автора

**Модальное окно создания/редактирования:**
- Форма со всеми полями модели Person
- Валидация полей
- Кнопки: Сохранить / Отмена

**Интеграция:**
- Маленькие кнопки создания персон в форме создания проекта должны открывать те же модальные окна
- После создания персоны через эти кнопки - автоматический выбор созданной персоны

### Технические требования:
- **DRY подход:** Единые компоненты для всех CRUD операций
- **Реиспользование:** Те же модальные окна для создания из формы проекта и из страницы персон
- **Защита данных:** Редактирование/удаление только для автора (created_by)
- **Тесты:** Полное покрытие тестами (unit + integration)
- **Никаких поломок:** Не затронуть существующий функционал

---

## 🏗️ Архитектура решения

### Backend (уже есть, нужны дополнения):

**Модель Person** (уже есть):
- Все необходимые поля уже есть
- person_type: 'director', 'producer', 'casting_director'
- created_by для проверки авторства

**API endpoints** (уже есть):
- `GET /api/people/` - список всех персон
- `POST /api/people/` - создание персоны
- `GET /api/people/{id}/` - получение персоны
- `PUT /api/people/{id}/` - обновление персоны
- `DELETE /api/people/{id}/` - удаление персоны
- `GET /api/people/directors/` - список режиссеров
- `GET /api/people/producers/` - список продюсеров
- `GET /api/people/casting_directors/` - список кастинг-директоров
- `GET /api/people/search/?name=...&person_type=...` - поиск персон

**Что нужно добавить:**
- Endpoint для получения проектов персоны с пагинацией (последние 5)
- Сортировка по количеству проектов (аннотация в queryset)
- Расширенный поиск (по телефону, почте, ТГ, проектам)

### Frontend (нужно создать):

**Страницы:**
1. `CastingDirectorsPage.tsx` - страница кастинг-директоров
2. `ProducersPage.tsx` - страница продюсеров
3. `DirectorsPage.tsx` - страница режиссеров

**Единые компоненты (DRY):**
1. `PersonTable.tsx` - универсальная таблица персон
2. `PersonModal.tsx` - модальное окно (просмотр/создание/редактирование)
3. `PersonForm.tsx` - форма персоны (используется в модальном окне)
4. `PersonDeleteConfirm.tsx` - подтверждение удаления
5. `PersonSearchBar.tsx` - поиск и сортировка

**Вспомогательные компоненты:**
1. `PersonAvatar.tsx` - аватар персоны в кружочке
2. `PersonContacts.tsx` - отображение контактов
3. `PersonProjects.tsx` - список проектов персоны (последние 5)

**Сервисы:**
- Расширение `peopleService.ts` с методами:
  - `getPersonProjects(id, limit=5)` - получить проекты персоны
  - `searchPeople(query, filters, sort)` - расширенный поиск
  - `deletePerson(id)` - удаление персоны

**Типы:**
- Расширение `types/people.ts` с интерфейсами для форм и фильтров

---

## 📅 План поэтапной реализации

### **Этап 1: Backend API расширение** (1-2 часа)

**Задачи:**

1. **Добавить метод получения проектов персоны:**
   ```python
   # backend/people/views.py
   @action(detail=True, methods=['get'])
   def projects(self, request, pk=None):
       """Получить проекты персоны (последние 5)"""
       person = self.get_object()
       limit = int(request.query_params.get('limit', 5))
       
       # Получаем проекты в зависимости от типа персоны
       if person.person_type == 'casting_director':
           projects = person.casting_projects.all()
       elif person.person_type == 'director':
           projects = person.directed_projects.all()
       elif person.person_type == 'producer':
           projects = person.produced_projects.all()
       
       projects = projects.order_by('-created_at')[:limit]
       serializer = ProjectListSerializer(projects, many=True)
       return Response(serializer.data)
   ```

2. **Добавить аннотацию количества проектов:**
   ```python
   # backend/people/views.py
   from django.db.models import Count, Q
   
   def get_queryset(self):
       queryset = super().get_queryset()
       
       # Аннотация количества проектов
       queryset = queryset.annotate(
           projects_count=Count('casting_projects') + 
                         Count('directed_projects') + 
                         Count('produced_projects')
       )
       
       return queryset
   ```

3. **Расширить метод search для расширенного поиска:**
   ```python
   @action(detail=False, methods=['get'])
   def search(self, request):
       """Расширенный поиск персон"""
       queryset = self.get_queryset()
       
       # Поиск по имени
       name = request.query_params.get('name')
       if name:
           queryset = queryset.filter(
               Q(first_name__icontains=name) |
               Q(last_name__icontains=name) |
               Q(middle_name__icontains=name)
           )
       
       # Поиск по контактам
       phone = request.query_params.get('phone')
       if phone:
           queryset = queryset.filter(phone__icontains=phone)
       
       email = request.query_params.get('email')
       if email:
           queryset = queryset.filter(email__icontains=email)
       
       telegram = request.query_params.get('telegram')
       if telegram:
           queryset = queryset.filter(telegram_username__icontains=telegram)
       
       # Поиск по проектам
       project = request.query_params.get('project')
       if project:
           queryset = queryset.filter(
               Q(casting_projects__title__icontains=project) |
               Q(directed_projects__title__icontains=project) |
               Q(produced_projects__title__icontains=project)
           ).distinct()
       
       # Фильтр по типу
       person_type = request.query_params.get('person_type')
       if person_type:
           queryset = queryset.filter(person_type=person_type)
       
       # Сортировка
       sort_by = request.query_params.get('sort', '-created_at')
       if sort_by == 'projects_count':
           queryset = queryset.order_by('-projects_count')
       elif sort_by == 'full_name':
           queryset = queryset.order_by('last_name', 'first_name')
       else:
           queryset = queryset.order_by(sort_by)
       
       serializer = self.get_serializer(queryset, many=True)
       return Response(serializer.data)
   ```

4. **Обновить PersonSerializer для включения projects_count:**
   ```python
   # backend/people/serializers.py
   class PersonSerializer(serializers.ModelSerializer):
       projects_count = serializers.IntegerField(read_only=True)
       recent_projects = serializers.SerializerMethodField()
       
       def get_recent_projects(self, obj):
           # Получаем последние 5 проектов
           projects = []
           if obj.person_type == 'casting_director':
               projects = obj.casting_projects.all()
           elif obj.person_type == 'director':
               projects = obj.directed_projects.all()
           elif obj.person_type == 'producer':
               projects = obj.produced_projects.all()
           
           projects = projects.order_by('-created_at')[:5]
           return [{'id': p.id, 'title': p.title, 'created_at': p.created_at} for p in projects]
   ```

**Тестирование Этапа 1:**
- [ ] Протестировать API через curl/Postman
- [ ] Убедиться, что аннотация projects_count работает
- [ ] Проверить расширенный поиск по всем полям
- [ ] Проверить сортировку по всем вариантам

---

### **Этап 2: Frontend - Сервисы и типы** (1 час)

**Задачи:**

1. **Расширить `types/people.ts`:**
   ```typescript
   // frontend/src/types/people.ts
   
   export interface PersonProject {
     id: number;
     title: string;
     created_at: string;
   }
   
   export interface Person {
     id: number;
     person_type: 'director' | 'producer' | 'casting_director';
     first_name: string;
     last_name: string;
     middle_name?: string;
     full_name: string;
     short_name: string;
     photo?: string;
     bio?: string;
     birth_date?: string;
     nationality?: string;
     phone?: string;
     email?: string;
     website?: string;
     telegram_username?: string;
     kinopoisk_url?: string;
     social_media?: Record<string, string>;
     awards?: string;
     is_active: boolean;
     created_by: string;
     created_at: string;
     updated_at: string;
     projects_count?: number;
     recent_projects?: PersonProject[];
   }
   
   export interface PersonFormData {
     person_type: 'director' | 'producer' | 'casting_director';
     first_name: string;
     last_name: string;
     middle_name?: string;
     photo?: File | null;
     bio?: string;
     birth_date?: string;
     nationality?: string;
     phone?: string;
     email?: string;
     website?: string;
     telegram_username?: string;
     kinopoisk_url?: string;
     social_media?: Record<string, string>;
     awards?: string;
   }
   
   export interface PersonSearchParams {
     name?: string;
     phone?: string;
     email?: string;
     telegram?: string;
     project?: string;
     person_type?: 'director' | 'producer' | 'casting_director';
     sort?: 'created_at' | '-created_at' | 'full_name' | 'projects_count';
   }
   
   export type PersonModalMode = 'view' | 'create' | 'edit';
   ```

2. **Расширить `services/people.ts`:**
   ```typescript
   // frontend/src/services/people.ts
   import api from './api';
   import { Person, PersonFormData, PersonSearchParams } from '../types/people';
   
   export const peopleService = {
     // Существующие методы...
     
     // Получить персону по ID
     async getPersonById(id: number): Promise<Person> {
       const response = await api.get(`/people/${id}/`);
       return response.data;
     },
     
     // Получить проекты персоны
     async getPersonProjects(id: number, limit: number = 5): Promise<PersonProject[]> {
       const response = await api.get(`/people/${id}/projects/`, {
         params: { limit }
       });
       return response.data;
     },
     
     // Создать персону
     async createPerson(data: PersonFormData): Promise<Person> {
       const formData = new FormData();
       
       Object.entries(data).forEach(([key, value]) => {
         if (value !== undefined && value !== null) {
           if (key === 'photo' && value instanceof File) {
             formData.append(key, value);
           } else if (key === 'social_media') {
             formData.append(key, JSON.stringify(value));
           } else {
             formData.append(key, String(value));
           }
         }
       });
       
       const response = await api.post('/people/', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
       return response.data;
     },
     
     // Обновить персону
     async updatePerson(id: number, data: Partial<PersonFormData>): Promise<Person> {
       const formData = new FormData();
       
       Object.entries(data).forEach(([key, value]) => {
         if (value !== undefined && value !== null) {
           if (key === 'photo' && value instanceof File) {
             formData.append(key, value);
           } else if (key === 'social_media') {
             formData.append(key, JSON.stringify(value));
           } else {
             formData.append(key, String(value));
           }
         }
       });
       
       const response = await api.put(`/people/${id}/`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
       return response.data;
     },
     
     // Удалить персону
     async deletePerson(id: number): Promise<void> {
       await api.delete(`/people/${id}/`);
     },
     
     // Расширенный поиск
     async searchPeople(params: PersonSearchParams): Promise<Person[]> {
       const response = await api.get('/people/search/', { params });
       return response.data;
     },
     
     // Получить персон по типу
     async getByType(personType: 'director' | 'producer' | 'casting_director'): Promise<Person[]> {
       const response = await api.get(`/people/${personType}s/`);
       return response.data;
     }
   };
   ```

**Тестирование Этапа 2:**
- [ ] Создать unit-тесты для peopleService
- [ ] Проверить корректность типов TypeScript
- [ ] Протестировать все методы сервиса с mock данными

---

### **Этап 3: Frontend - Базовые компоненты** (2-3 часа)

**Задачи:**

1. **Создать `PersonAvatar.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonAvatar.tsx
   import React from 'react';
   
   interface PersonAvatarProps {
     photo?: string;
     fullName: string;
     size?: 'sm' | 'md' | 'lg';
   }
   
   export const PersonAvatar: React.FC<PersonAvatarProps> = ({ 
     photo, 
     fullName,
     size = 'md' 
   }) => {
     const sizeClasses = {
       sm: 'w-8 h-8 text-xs',
       md: 'w-12 h-12 text-sm',
       lg: 'w-16 h-16 text-base'
     };
     
     const initials = fullName
       .split(' ')
       .map(word => word[0])
       .join('')
       .toUpperCase()
       .slice(0, 2);
     
     return (
       <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}>
         {photo ? (
           <img 
             src={photo} 
             alt={fullName}
             className="w-full h-full object-cover"
           />
         ) : (
           <span className="font-medium text-gray-600">{initials}</span>
         )}
       </div>
     );
   };
   ```

2. **Создать `PersonContacts.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonContacts.tsx
   import React from 'react';
   
   interface PersonContactsProps {
     phone?: string;
     email?: string;
     telegram?: string;
   }
   
   export const PersonContacts: React.FC<PersonContactsProps> = ({
     phone,
     email,
     telegram
   }) => {
     return (
       <div className="flex flex-col space-y-1 text-sm text-gray-600">
         {phone && (
           <div className="flex items-center space-x-1">
             <span>📞</span>
             <a href={`tel:${phone}`} className="hover:text-blue-600">
               {phone}
             </a>
           </div>
         )}
         {telegram && (
           <div className="flex items-center space-x-1">
             <span>✈️</span>
             <a 
               href={`https://t.me/${telegram.replace('@', '')}`}
               target="_blank"
               rel="noopener noreferrer"
               className="hover:text-blue-600"
             >
               {telegram}
             </a>
           </div>
         )}
         {email && (
           <div className="flex items-center space-x-1">
             <span>📧</span>
             <a href={`mailto:${email}`} className="hover:text-blue-600">
               {email}
             </a>
           </div>
         )}
       </div>
     );
   };
   ```

3. **Создать `PersonProjects.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonProjects.tsx
   import React from 'react';
   import { Link } from 'react-router-dom';
   import { PersonProject } from '../../types/people';
   
   interface PersonProjectsProps {
     projects: PersonProject[];
     maxVisible?: number;
   }
   
   export const PersonProjects: React.FC<PersonProjectsProps> = ({ 
     projects,
     maxVisible = 5
   }) => {
     const visibleProjects = projects.slice(0, maxVisible);
     const hiddenCount = projects.length - maxVisible;
     
     return (
       <div className="flex flex-col space-y-1">
         {visibleProjects.map(project => (
           <Link
             key={project.id}
             to={`/projects/${project.id}`}
             className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
           >
             {project.title}
           </Link>
         ))}
         {hiddenCount > 0 && (
           <span className="text-xs text-gray-500 italic">
             +{hiddenCount} еще...
           </span>
         )}
         {projects.length === 0 && (
           <span className="text-sm text-gray-400 italic">
             Нет проектов
           </span>
         )}
       </div>
     );
   };
   ```

4. **Создать `PersonSearchBar.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonSearchBar.tsx
   import React, { useState } from 'react';
   import { PersonSearchParams } from '../../types/people';
   
   interface PersonSearchBarProps {
     onSearch: (params: PersonSearchParams) => void;
     personType: 'director' | 'producer' | 'casting_director';
   }
   
   export const PersonSearchBar: React.FC<PersonSearchBarProps> = ({
     onSearch,
     personType
   }) => {
     const [searchQuery, setSearchQuery] = useState('');
     const [sortBy, setSortBy] = useState<'-created_at' | 'full_name' | 'projects_count'>('-created_at');
     
     const handleSearch = () => {
       onSearch({
         name: searchQuery,
         person_type: personType,
         sort: sortBy
       });
     };
     
     const handleSortChange = (newSort: '-created_at' | 'full_name' | 'projects_count') => {
       setSortBy(newSort);
       onSearch({
         name: searchQuery,
         person_type: personType,
         sort: newSort
       });
     };
     
     return (
       <div className="flex items-center space-x-4 mb-6">
         {/* Поле поиска */}
         <div className="flex-1 relative">
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
             placeholder="Поиск по ФИО, телефону, почте, ТГ, проектам..."
             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           />
           <button
             onClick={handleSearch}
             className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
           >
             🔍
           </button>
         </div>
         
         {/* Сортировка */}
         <div className="flex items-center space-x-2">
           <span className="text-sm text-gray-600">Сортировка:</span>
           <select
             value={sortBy}
             onChange={(e) => handleSortChange(e.target.value as any)}
             className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           >
             <option value="-created_at">По дате (новые)</option>
             <option value="full_name">По ФИО (А-Я)</option>
             <option value="projects_count">По кол-ву проектов</option>
           </select>
         </div>
       </div>
     );
   };
   ```

**Тестирование Этапа 3:**
- [ ] Создать unit-тесты для каждого компонента
- [ ] Проверить отображение компонентов с различными данными
- [ ] Протестировать интерактивность (клики, изменения)

---

### **Этап 4: Frontend - Форма персоны** (2-3 часа)

**Задачи:**

1. **Создать `PersonForm.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonForm.tsx
   import React, { useState, useEffect } from 'react';
   import { Person, PersonFormData } from '../../types/people';
   
   interface PersonFormProps {
     initialData?: Person;
     personType: 'director' | 'producer' | 'casting_director';
     onSubmit: (data: PersonFormData) => void;
     onCancel: () => void;
     mode: 'create' | 'edit';
   }
   
   export const PersonForm: React.FC<PersonFormProps> = ({
     initialData,
     personType,
     onSubmit,
     onCancel,
     mode
   }) => {
     const [formData, setFormData] = useState<PersonFormData>({
       person_type: personType,
       first_name: initialData?.first_name || '',
       last_name: initialData?.last_name || '',
       middle_name: initialData?.middle_name || '',
       phone: initialData?.phone || '',
       email: initialData?.email || '',
       telegram_username: initialData?.telegram_username || '',
       bio: initialData?.bio || '',
       birth_date: initialData?.birth_date || '',
       nationality: initialData?.nationality || '',
       website: initialData?.website || '',
       kinopoisk_url: initialData?.kinopoisk_url || '',
       awards: initialData?.awards || '',
       social_media: initialData?.social_media || {}
     });
     
     const [photoPreview, setPhotoPreview] = useState<string | null>(
       initialData?.photo || null
     );
     
     const handleInputChange = (
       e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
     ) => {
       const { name, value } = e.target;
       setFormData(prev => ({ ...prev, [name]: value }));
     };
     
     const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
       if (file) {
         setFormData(prev => ({ ...prev, photo: file }));
         const reader = new FileReader();
         reader.onloadend = () => {
           setPhotoPreview(reader.result as string);
         };
         reader.readAsDataURL(file);
       }
     };
     
     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       onSubmit(formData);
     };
     
     const getPersonTypeLabel = () => {
       const labels = {
         director: 'Режиссера',
         producer: 'Продюсера',
         casting_director: 'Кастинг-директора'
       };
       return labels[personType];
     };
     
     return (
       <form onSubmit={handleSubmit} className="space-y-6">
         <div className="text-center mb-4">
           <h2 className="text-2xl font-bold text-gray-900">
             {mode === 'create' ? `Создать ${getPersonTypeLabel()}` : `Редактировать ${getPersonTypeLabel()}`}
           </h2>
         </div>
         
         {/* Фото */}
         <div className="flex flex-col items-center">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Фотография
           </label>
           <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-2">
             {photoPreview ? (
               <img src={photoPreview} alt="Превью" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400">
                 Нет фото
               </div>
             )}
           </div>
           <input
             type="file"
             accept="image/*"
             onChange={handlePhotoChange}
             className="text-sm"
           />
         </div>
         
         {/* ФИО */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Фамилия *
             </label>
             <input
               type="text"
               name="last_name"
               value={formData.last_name}
               onChange={handleInputChange}
               required
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Имя *
             </label>
             <input
               type="text"
               name="first_name"
               value={formData.first_name}
               onChange={handleInputChange}
               required
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Отчество
             </label>
             <input
               type="text"
               name="middle_name"
               value={formData.middle_name}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
         </div>
         
         {/* Контакты */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Телефон
             </label>
             <input
               type="tel"
               name="phone"
               value={formData.phone}
               onChange={handleInputChange}
               placeholder="+7 (999) 123-45-67"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Email
             </label>
             <input
               type="email"
               name="email"
               value={formData.email}
               onChange={handleInputChange}
               placeholder="email@example.com"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Telegram
             </label>
             <input
               type="text"
               name="telegram_username"
               value={formData.telegram_username}
               onChange={handleInputChange}
               placeholder="@username"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
         </div>
         
         {/* Дополнительные поля */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Дата рождения
             </label>
             <input
               type="date"
               name="birth_date"
               value={formData.birth_date}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Национальность
             </label>
             <input
               type="text"
               name="nationality"
               value={formData.nationality}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
         </div>
         
         {/* Ссылки */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Личный сайт
             </label>
             <input
               type="url"
               name="website"
               value={formData.website}
               onChange={handleInputChange}
               placeholder="https://example.com"
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Кинопоиск
             </label>
             <input
               type="url"
               name="kinopoisk_url"
               value={formData.kinopoisk_url}
               onChange={handleInputChange}
               placeholder="https://kinopoisk.ru/..."
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             />
           </div>
         </div>
         
         {/* Биография */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Биография
           </label>
           <textarea
             name="bio"
             value={formData.bio}
             onChange={handleInputChange}
             rows={4}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
           />
         </div>
         
         {/* Награды */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Награды и достижения
           </label>
           <textarea
             name="awards"
             value={formData.awards}
             onChange={handleInputChange}
             rows={3}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
           />
         </div>
         
         {/* Кнопки */}
         <div className="flex justify-end space-x-4 pt-4 border-t">
           <button
             type="button"
             onClick={onCancel}
             className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
           >
             Отмена
           </button>
           <button
             type="submit"
             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
           >
             {mode === 'create' ? 'Создать' : 'Сохранить'}
           </button>
         </div>
       </form>
     );
   };
   ```

**Тестирование Этапа 4:**
- [ ] Создать unit-тесты для PersonForm
- [ ] Проверить валидацию полей
- [ ] Протестировать загрузку фото
- [ ] Проверить отправку данных

---

### **Этап 5: Frontend - Модальное окно** (2 часа)

**Задачи:**

1. **Создать `PersonModal.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonModal.tsx
   import React, { useState, useEffect } from 'react';
   import { Person, PersonFormData, PersonModalMode } from '../../types/people';
   import { PersonForm } from './PersonForm';
   import { PersonAvatar } from './PersonAvatar';
   import { PersonContacts } from './PersonContacts';
   import { PersonProjects } from './PersonProjects';
   import { peopleService } from '../../services/people';
   import { useAuth } from '../../contexts/AuthContext';
   
   interface PersonModalProps {
     isOpen: boolean;
     onClose: () => void;
     personId?: number;
     personType: 'director' | 'producer' | 'casting_director';
     mode: PersonModalMode;
     onSuccess?: (person: Person) => void;
   }
   
   export const PersonModal: React.FC<PersonModalProps> = ({
     isOpen,
     onClose,
     personId,
     personType,
     mode: initialMode,
     onSuccess
   }) => {
     const { user } = useAuth();
     const [mode, setMode] = useState<PersonModalMode>(initialMode);
     const [person, setPerson] = useState<Person | null>(null);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
     
     useEffect(() => {
       if (isOpen && personId && mode !== 'create') {
         loadPerson();
       }
     }, [isOpen, personId, mode]);
     
     const loadPerson = async () => {
       if (!personId) return;
       
       setLoading(true);
       try {
         const data = await peopleService.getPersonById(personId);
         setPerson(data);
       } catch (err) {
         setError('Ошибка загрузки данных');
       } finally {
         setLoading(false);
       }
     };
     
     const handleSubmit = async (data: PersonFormData) => {
       setLoading(true);
       setError(null);
       
       try {
         let result: Person;
         if (mode === 'create') {
           result = await peopleService.createPerson(data);
         } else {
           result = await peopleService.updatePerson(personId!, data);
         }
         
         onSuccess?.(result);
         onClose();
       } catch (err: any) {
         setError(err.response?.data?.message || 'Ошибка сохранения');
       } finally {
         setLoading(false);
       }
     };
     
     const handleDelete = async () => {
       if (!personId) return;
       
       setLoading(true);
       try {
         await peopleService.deletePerson(personId);
         onSuccess?.(null as any); // Notify parent to refresh
         onClose();
       } catch (err: any) {
         setError(err.response?.data?.message || 'Ошибка удаления');
       } finally {
         setLoading(false);
         setShowDeleteConfirm(false);
       }
     };
     
     const canEdit = person && user && person.created_by === user.username;
     
     if (!isOpen) return null;
     
     return (
       <div className="fixed inset-0 z-50 overflow-y-auto">
         <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
           {/* Overlay */}
           <div 
             className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
             onClick={onClose}
           />
           
           {/* Modal */}
           <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
             {/* Заголовок с кнопкой закрытия */}
             <div className="absolute top-4 right-4">
               <button
                 onClick={onClose}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <span className="text-2xl">×</span>
               </button>
             </div>
             
             <div className="p-6">
               {loading && (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                   <p className="mt-4 text-gray-600">Загрузка...</p>
                 </div>
               )}
               
               {error && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                   <p className="text-red-800">{error}</p>
                 </div>
               )}
               
               {!loading && (mode === 'create' || mode === 'edit') && (
                 <PersonForm
                   initialData={person || undefined}
                   personType={personType}
                   onSubmit={handleSubmit}
                   onCancel={onClose}
                   mode={mode}
                 />
               )}
               
               {!loading && mode === 'view' && person && (
                 <div className="space-y-6">
                   {/* Заголовок */}
                   <div className="text-center border-b pb-4">
                     <PersonAvatar 
                       photo={person.photo} 
                       fullName={person.full_name}
                       size="lg"
                     />
                     <h2 className="text-2xl font-bold text-gray-900 mt-4">
                       {person.full_name}
                     </h2>
                     <p className="text-gray-600">
                       {person.person_type === 'director' && 'Режиссер'}
                       {person.person_type === 'producer' && 'Продюсер'}
                       {person.person_type === 'casting_director' && 'Кастинг-директор'}
                     </p>
                   </div>
                   
                   {/* Контакты */}
                   <div>
                     <h3 className="text-lg font-semibold mb-2">Контакты</h3>
                     <PersonContacts
                       phone={person.phone}
                       email={person.email}
                       telegram={person.telegram_username}
                     />
                   </div>
                   
                   {/* Проекты */}
                   {person.recent_projects && person.recent_projects.length > 0 && (
                     <div>
                       <h3 className="text-lg font-semibold mb-2">
                         Проекты ({person.projects_count})
                       </h3>
                       <PersonProjects projects={person.recent_projects} />
                     </div>
                   )}
                   
                   {/* Биография */}
                   {person.bio && (
                     <div>
                       <h3 className="text-lg font-semibold mb-2">Биография</h3>
                       <p className="text-gray-700 whitespace-pre-line">{person.bio}</p>
                     </div>
                   )}
                   
                   {/* Награды */}
                   {person.awards && (
                     <div>
                       <h3 className="text-lg font-semibold mb-2">Награды</h3>
                       <p className="text-gray-700 whitespace-pre-line">{person.awards}</p>
                     </div>
                   )}
                   
                   {/* Дополнительная информация */}
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     {person.birth_date && (
                       <div>
                         <p className="text-gray-600">Дата рождения:</p>
                         <p className="font-medium">{person.birth_date}</p>
                       </div>
                     )}
                     {person.nationality && (
                       <div>
                         <p className="text-gray-600">Национальность:</p>
                         <p className="font-medium">{person.nationality}</p>
                       </div>
                     )}
                     {person.website && (
                       <div>
                         <p className="text-gray-600">Сайт:</p>
                         <a 
                           href={person.website}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:underline"
                         >
                           Перейти
                         </a>
                       </div>
                     )}
                     {person.kinopoisk_url && (
                       <div>
                         <p className="text-gray-600">Кинопоиск:</p>
                         <a 
                           href={person.kinopoisk_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:underline"
                         >
                           Перейти
                         </a>
                       </div>
                     )}
                   </div>
                   
                   {/* Кнопки действий */}
                   <div className="flex justify-end space-x-4 pt-4 border-t">
                     {canEdit && !showDeleteConfirm && (
                       <>
                         <button
                           onClick={() => setMode('edit')}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                         >
                           Редактировать
                         </button>
                         <button
                           onClick={() => setShowDeleteConfirm(true)}
                           className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                         >
                           Удалить
                         </button>
                       </>
                     )}
                     {showDeleteConfirm && (
                       <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
                         <p className="text-red-800 mb-4">
                           Вы уверены, что хотите удалить эту персону? Это действие нельзя отменить.
                         </p>
                         <div className="flex justify-end space-x-2">
                           <button
                             onClick={() => setShowDeleteConfirm(false)}
                             className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                           >
                             Отмена
                           </button>
                           <button
                             onClick={handleDelete}
                             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                           >
                             Да, удалить
                           </button>
                         </div>
                       </div>
                     )}
                     <button
                       onClick={onClose}
                       className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                     >
                       Закрыть
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     );
   };
   ```

**Тестирование Этапа 5:**
- [ ] Создать unit-тесты для PersonModal
- [ ] Проверить все режимы (view, create, edit)
- [ ] Протестировать права доступа (редактирование только для автора)
- [ ] Проверить удаление с подтверждением

---

### **Этап 6: Frontend - Таблица персон** (2-3 часа)

**Задачи:**

1. **Создать `PersonTable.tsx`:**
   ```typescript
   // frontend/src/components/people/PersonTable.tsx
   import React, { useState, useEffect } from 'react';
   import { Person, PersonSearchParams } from '../../types/people';
   import { PersonAvatar } from './PersonAvatar';
   import { PersonContacts } from './PersonContacts';
   import { PersonProjects } from './PersonProjects';
   import { peopleService } from '../../services/people';
   import { PersonSearchBar } from './PersonSearchBar';
   import { PersonModal } from './PersonModal';
   
   interface PersonTableProps {
     personType: 'director' | 'producer' | 'casting_director';
   }
   
   export const PersonTable: React.FC<PersonTableProps> = ({ personType }) => {
     const [people, setPeople] = useState<Person[]>([]);
     const [loading, setLoading] = useState(false);
     const [modalOpen, setModalOpen] = useState(false);
     const [selectedPersonId, setSelectedPersonId] = useState<number | undefined>();
     const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
     
     useEffect(() => {
       loadPeople();
     }, [personType]);
     
     const loadPeople = async (searchParams?: PersonSearchParams) => {
       setLoading(true);
       try {
         const data = await peopleService.searchPeople({
           person_type: personType,
           sort: '-created_at',
           ...searchParams
         });
         setPeople(data);
       } catch (error) {
         console.error('Ошибка загрузки персон:', error);
       } finally {
         setLoading(false);
       }
     };
     
     const handleRowClick = (person: Person) => {
       setSelectedPersonId(person.id);
       setModalMode('view');
       setModalOpen(true);
     };
     
     const handleCreateNew = () => {
       setSelectedPersonId(undefined);
       setModalMode('create');
       setModalOpen(true);
     };
     
     const handleModalSuccess = () => {
       loadPeople();
     };
     
     const getPersonTypeLabel = () => {
       const labels = {
         director: 'Режиссера',
         producer: 'Продюсера',
         casting_director: 'Кастинг-директора'
       };
       return labels[personType];
     };
     
     return (
       <div className="space-y-6">
         {/* Заголовок и кнопка создания */}
         <div className="flex items-center justify-between">
           <button
             onClick={handleCreateNew}
             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
           >
             + Создать {getPersonTypeLabel()}
           </button>
         </div>
         
         {/* Поиск и сортировка */}
         <PersonSearchBar
           personType={personType}
           onSearch={loadPeople}
         />
         
         {/* Таблица */}
         {loading ? (
           <div className="text-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
             <p className="mt-4 text-gray-600">Загрузка...</p>
           </div>
         ) : people.length === 0 ? (
           <div className="text-center py-12 bg-gray-50 rounded-lg">
             <p className="text-gray-600">Нет данных</p>
           </div>
         ) : (
           <div className="space-y-2">
             {people.map(person => (
               <div
                 key={person.id}
                 onClick={() => handleRowClick(person)}
                 className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-all"
               >
                 {/* Колонка 1: Фото */}
                 <div className="flex-shrink-0">
                   <PersonAvatar 
                     photo={person.photo}
                     fullName={person.full_name}
                     size="md"
                   />
                 </div>
                 
                 {/* Колонка 2: ФИО */}
                 <div className="flex-1 min-w-0">
                   <p className="text-base font-medium text-gray-900 truncate">
                     {person.full_name}
                   </p>
                   {person.nationality && (
                     <p className="text-sm text-gray-500">{person.nationality}</p>
                   )}
                 </div>
                 
                 {/* Колонка 3: Контакты */}
                 <div className="flex-1">
                   <PersonContacts
                     phone={person.phone}
                     email={person.email}
                     telegram={person.telegram_username}
                   />
                 </div>
                 
                 {/* Колонка 4: Проекты */}
                 <div className="flex-1">
                   <PersonProjects projects={person.recent_projects || []} />
                 </div>
               </div>
             ))}
           </div>
         )}
         
         {/* Модальное окно */}
         <PersonModal
           isOpen={modalOpen}
           onClose={() => setModalOpen(false)}
           personId={selectedPersonId}
           personType={personType}
           mode={modalMode}
           onSuccess={handleModalSuccess}
         />
       </div>
     );
   };
   ```

**Тестирование Этапа 6:**
- [ ] Создать unit-тесты для PersonTable
- [ ] Проверить отображение всех колонок
- [ ] Протестировать клик по строке
- [ ] Проверить создание новой персоны
- [ ] Протестировать обновление списка после изменений

---

### **Этап 7: Frontend - Страницы** (1 час)

**Задачи:**

1. **Создать `CastingDirectorsPage.tsx`:**
   ```typescript
   // frontend/src/pages/CastingDirectors.tsx
   import React from 'react';
   import { PersonTable } from '../components/people/PersonTable';
   
   const CastingDirectors: React.FC = () => {
     return (
       <div className="container mx-auto px-4 py-6">
         <PersonTable personType="casting_director" />
       </div>
     );
   };
   
   export default CastingDirectors;
   ```

2. **Создать `ProducersPage.tsx`:**
   ```typescript
   // frontend/src/pages/Producers.tsx
   import React from 'react';
   import { PersonTable } from '../components/people/PersonTable';
   
   const Producers: React.FC = () => {
     return (
       <div className="container mx-auto px-4 py-6">
         <PersonTable personType="producer" />
       </div>
     );
   };
   
   export default Producers;
   ```

3. **Создать `DirectorsPage.tsx`:**
   ```typescript
   // frontend/src/pages/Directors.tsx
   import React from 'react';
   import { PersonTable } from '../components/people/PersonTable';
   
   const Directors: React.FC = () => {
     return (
       <div className="container mx-auto px-4 py-6">
         <PersonTable personType="director" />
       </div>
     );
   };
   
   export default Directors;
   ```

4. **Обновить `App.tsx` для использования новых страниц:**
   ```typescript
   // frontend/src/App.tsx
   import CastingDirectors from './pages/CastingDirectors';
   import Producers from './pages/Producers';
   import Directors from './pages/Directors';
   
   // ...
   
   <Route
     path="/casting-directors"
     element={
       <ProtectedRoute>
         <Layout>
           <CastingDirectors />
         </Layout>
       </ProtectedRoute>
     }
   />
   
   <Route
     path="/persons/producers"
     element={
       <ProtectedRoute>
         <Layout>
           <Producers />
         </Layout>
       </ProtectedRoute>
     }
   />
   
   <Route
     path="/persons/directors"
     element={
       <ProtectedRoute>
         <Layout>
           <Directors />
         </Layout>
       </ProtectedRoute>
     }
   />
   ```

**Тестирование Этапа 7:**
- [ ] Проверить навигацию между страницами
- [ ] Протестировать отображение каждой страницы
- [ ] Убедиться, что таблицы показывают правильный тип персон

---

### **Этап 8: Интеграция с формой создания проекта** (2 часа)

**Задачи:**

1. **Обновить `TeamMemberSelector.tsx` для открытия модального окна:**
   ```typescript
   // frontend/src/components/projects/creation/TeamMemberSelector.tsx
   import { PersonModal } from '../../people/PersonModal';
   
   export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
     // ... props
   }) => {
     const [showCreateModal, setShowCreateModal] = useState(false);
     
     const handleCreateNew = () => {
       setShowCreateModal(true);
     };
     
     const handleModalSuccess = (person: Person) => {
       // Автоматически выбрать созданную персону
       onSelectionChange(person.id, person.full_name);
       setShowCreateModal(false);
     };
     
     return (
       <div>
         {/* ... существующий код ... */}
         
         <button
           type="button"
           onClick={handleCreateNew}
           className="..."
         >
           Создать нового {type === 'person' ? 'человека' : 'компанию'}
         </button>
         
         {/* Модальное окно создания */}
         {type === 'person' && (
           <PersonModal
             isOpen={showCreateModal}
             onClose={() => setShowCreateModal(false)}
             personType={getPersonTypeFromLabel(label)} // Определить тип по label
             mode="create"
             onSuccess={handleModalSuccess}
           />
         )}
       </div>
     );
   };
   ```

2. **Добавить хелпер для определения типа персоны:**
   ```typescript
   const getPersonTypeFromLabel = (label: string): 'director' | 'producer' | 'casting_director' => {
     if (label.includes('Кастинг-директор')) return 'casting_director';
     if (label.includes('Режиссер')) return 'director';
     if (label.includes('Продюсер')) return 'producer';
     return 'casting_director'; // default
   };
   ```

**Тестирование Этапа 8:**
- [ ] Протестировать открытие модального окна из формы проекта
- [ ] Проверить автоматический выбор созданной персоны
- [ ] Убедиться, что тип персоны определяется правильно

---

### **Этап 9: Тестирование** (3-4 часа)

**Задачи:**

1. **Unit-тесты компонентов:**
   - [ ] PersonAvatar.test.tsx
   - [ ] PersonContacts.test.tsx
   - [ ] PersonProjects.test.tsx
   - [ ] PersonSearchBar.test.tsx
   - [ ] PersonForm.test.tsx
   - [ ] PersonModal.test.tsx
   - [ ] PersonTable.test.tsx

2. **Интеграционные тесты:**
   - [ ] Полный цикл CRUD операций
   - [ ] Поиск и фильтрация
   - [ ] Сортировка
   - [ ] Интеграция с формой создания проекта

3. **Browser тесты:**
   - [ ] Создание персоны через страницу КД
   - [ ] Просмотр персоны (клик по строке)
   - [ ] Редактирование персоны (только автор)
   - [ ] Удаление персоны (только автор)
   - [ ] Создание персоны через форму проекта
   - [ ] Поиск персон по различным критериям
   - [ ] Сортировка по всем вариантам

4. **Backend тесты:**
   - [ ] Тесты для новых API endpoints
   - [ ] Тесты прав доступа (редактирование/удаление только для автора)
   - [ ] Тесты аннотации projects_count
   - [ ] Тесты расширенного поиска

---

## 📊 Критерии успеха

### Функциональность:
- [ ] Все CRUD операции работают корректно
- [ ] Поиск находит персон по всем критериям
- [ ] Сортировка работает правильно
- [ ] Права доступа соблюдаются (редактирование/удаление только для автора)
- [ ] Интеграция с формой создания проекта работает
- [ ] Таблица отображает все необходимые колонки

### Технические:
- [ ] Код следует DRY принципу
- [ ] Все компоненты переиспользуемые
- [ ] Тесты покрывают весь функционал
- [ ] Не затронут существующий функционал
- [ ] Нет TypeScript ошибок
- [ ] Нет linter ошибок

### UX/UI:
- [ ] Интерфейс интуитивно понятный
- [ ] Модальные окна открываются/закрываются плавно
- [ ] Загрузка отображается корректно
- [ ] Ошибки показываются пользователю
- [ ] Адаптивность на разных экранах

---

## ⏱️ Общая оценка времени

| Этап | Описание | Время |
|------|----------|-------|
| 1 | Backend API расширение | 1-2 часа |
| 2 | Frontend - Сервисы и типы | 1 час |
| 3 | Frontend - Базовые компоненты | 2-3 часа |
| 4 | Frontend - Форма персоны | 2-3 часа |
| 5 | Frontend - Модальное окно | 2 часа |
| 6 | Frontend - Таблица персон | 2-3 часа |
| 7 | Frontend - Страницы | 1 час |
| 8 | Интеграция с формой проекта | 2 часа |
| 9 | Тестирование | 3-4 часа |
| **ВСЕГО** | | **16-22 часа** |

---

## 🚀 Готовность к работе

Этот план можно начать реализовывать прямо сейчас. Все этапы расписаны детально с примерами кода. 

**Рекомендация:** Работать последовательно, этап за этапом, тестируя каждый этап перед переходом к следующему.

**Вопросы для уточнения перед началом:**
1. Есть ли дополнительные требования к форме персоны?
2. Нужны ли дополнительные фильтры в поиске?
3. Какие поля обязательные при создании персоны?
4. Нужна ли пагинация для таблицы персон?
5. Нужна ли возможность экспорта списка персон?

