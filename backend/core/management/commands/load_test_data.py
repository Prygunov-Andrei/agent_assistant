"""
Management команда для загрузки тестовых данных
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from telegram_requests.models import Request
from projects.models import (
    Project, ProjectRole, ProjectType, Genre, RoleType,
    ShoeSize, Nationality
)
from people.models import Person
from companies.models import Company
from artists.models import Skill
from tests.factories.test_data_factory import ChekhovTestDataFactory

User = get_user_model()


class Command(BaseCommand):
    help = 'Загружает тестовые данные на основе рассказов Чехова'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить существующие тестовые данные перед загрузкой',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Очистка существующих тестовых данных...')
            Request.objects.filter(text__contains='Чехов').delete()
            Project.objects.filter(description__contains='Чехов').delete()
            self.stdout.write(self.style.SUCCESS('✓ Очищено'))

        self.stdout.write('Загрузка тестовых данных из рассказов Чехова...')
        
        # Создаем базовые справочные данные если их нет
        self._ensure_reference_data()
        
        # Создаем админа если нет
        admin_user = self._ensure_admin_user()
        
        # Загружаем проекты
        factory = ChekhovTestDataFactory()
        projects_data = factory.get_all_test_projects()
        
        created_count = 0
        for project_data in projects_data:
            try:
                self._create_project_from_data(project_data, admin_user)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Создан проект: {project_data["project_data"]["title"]}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Ошибка создания {project_data["project_data"]["title"]}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Загружено {created_count} тестовых проектов')
        )
        self.stdout.write(
            'Данные доступны для тестирования во вкладках "Запросы" и "Проекты"'
        )
    
    def _ensure_reference_data(self):
        """Создает базовые справочные данные"""
        # Типы проектов
        project_types = [
            'Фильм', 'Сериал', 'Короткометражный фильм', 'Реклама',
            'Клип', 'Театр', 'Документальный фильм'
        ]
        for pt in project_types:
            ProjectType.objects.get_or_create(name=pt)
        
        # Жанры
        genres = [
            'Драма', 'Комедия', 'Боевик', 'Триллер', 'Романтика',
            'Ужасы', 'Фантастика', 'Детектив'
        ]
        for g in genres:
            Genre.objects.get_or_create(name=g)
        
        # Типы ролей
        role_types = [
            'Актер', 'Актриса', 'Массовка', 'Дублер', 'Озвучка'
        ]
        for rt in role_types:
            RoleType.objects.get_or_create(name=rt)
        
        # Размеры обуви
        shoe_sizes = [str(i) for i in range(35, 46)]
        for ss in shoe_sizes:
            ShoeSize.objects.get_or_create(name=ss)
        
        # Национальности
        nationalities = [
            'Русский/Русская', 'Европеец/Европейка', 'Азиат/Азиатка',
            'Афроамериканец/Афроамериканка', 'Латиноамериканец/Латиноамериканка'
        ]
        for n in nationalities:
            Nationality.objects.get_or_create(name=n)
        
        # Навыки
        skills = [
            'Актерское мастерство', 'Комедия', 'Драма', 'Пение',
            'Танец', 'Вокал', 'Акробатика', 'Вождение', 'Верховая езда',
            'Фехтование', 'Боевые искусства'
        ]
        for s in skills:
            Skill.objects.get_or_create(name=s)
    
    def _ensure_admin_user(self):
        """Создает или получает админа"""
        from users.models import Agent
        
        # Agent уже является User (наследуется от AbstractUser)
        agent, created = Agent.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Админ',
                'last_name': 'Тестовый',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            agent.set_password('admin')
            agent.save()
        
        return agent
    
    def _create_project_from_data(self, data, agent):
        """Создает проект и запрос из тестовых данных"""
        # 1. Создаем запрос
        request = Request.objects.create(
            text=data['request_text'],
            author_name='Тестовый КД',
            author_username='test_cd',
            sender_telegram_id=999999999,  # Фейковый ID для тестов
            telegram_message_id=999999999,  # Фейковый ID сообщения
            telegram_chat_id=999999999,  # Фейковый ID чата
            status='pending',
            created_by=agent
        )
        
        # 2. Создаем проект
        project_data = data['project_data']
        
        # Получаем справочные данные
        project_type = ProjectType.objects.get(name=project_data['project_type'])
        genre = Genre.objects.get(name=project_data['genre'])
        
        # Создаем/получаем персон команды
        casting_director = None
        if 'casting_director' in data['contacts']:
            cd_name = data['contacts']['casting_director']['name']
            name_parts = cd_name.split(' ', 1)
            casting_director, _ = Person.objects.get_or_create(
                first_name=name_parts[0],
                last_name=name_parts[1] if len(name_parts) > 1 else '',
                person_type='casting_director'
            )
        
        director = None
        if 'director' in data['contacts']:
            dir_name = data['contacts']['director']['name']
            name_parts = dir_name.split(' ', 1)
            director, _ = Person.objects.get_or_create(
                first_name=name_parts[0],
                last_name=name_parts[1] if len(name_parts) > 1 else '',
                person_type='director'
            )
        
        # Создаем компанию если есть
        production_company = None
        if 'production_company' in data['contacts']:
            comp_name = data['contacts']['production_company']['name']
            production_company, _ = Company.objects.get_or_create(
                name=comp_name
            )
        
        # Создаем проект
        project = Project.objects.create(
            title=project_data['title'],
            project_type=project_type,
            genre=genre,
            description=project_data['description'],
            premiere_date=project_data.get('premiere_date'),
            casting_director=casting_director,
            director=director,
            production_company=production_company,
            request=request,
            created_by=agent,
            status='in_production'
        )
        
        # Добавляем продюсеров если есть
        if 'producers' in data['contacts']:
            for prod_data in data['contacts']['producers']:
                prod_name = prod_data['name']
                name_parts = prod_name.split(' ', 1)
                producer, _ = Person.objects.get_or_create(
                    first_name=name_parts[0],
                    last_name=name_parts[1] if len(name_parts) > 1 else '',
                    person_type='producer'
                )
                project.producers.add(producer)
        
        # 3. Создаем роли
        for role_data in data['roles']:
            role_type = RoleType.objects.get(name=role_data['role_type'])
            
            # Получаем размер обуви если указан
            shoe_size = None
            if 'shoe_size' in role_data:
                shoe_size, _ = ShoeSize.objects.get_or_create(
                    name=role_data['shoe_size']
                )
            
            # Получаем национальность если указана
            nationality = None
            if 'nationality' in role_data:
                nationality, _ = Nationality.objects.get_or_create(
                    name=role_data['nationality']
                )
            
            # Подготавливаем навыки
            skills_list = []
            if 'skills_required' in role_data:
                for skill_name in role_data['skills_required']:
                    skill, _ = Skill.objects.get_or_create(name=skill_name)
                    skills_list.append({'id': skill.id, 'name': skill.name})
            
            # Создаем роль
            role = ProjectRole.objects.create(
                project=project,
                name=role_data['character_name'],
                role_type=role_type,
                description=role_data.get('description', ''),
                age_min=role_data.get('age_min'),
                age_max=role_data.get('age_max'),
                gender=role_data.get('gender', 'doesnt_matter'),
                media_presence=role_data.get('media_presence', 'doesnt_matter'),
                height=role_data.get('height', ''),
                body_type=role_data.get('body_type', ''),
                hair_color=role_data.get('hair_color', ''),
                eye_color=role_data.get('eye_color', ''),
                hairstyle=role_data.get('hairstyle', ''),
                clothing_size=role_data.get('clothing_size', ''),
                shoe_size=shoe_size,
                nationality=nationality,
                rate_per_shift=role_data.get('rate_per_shift', ''),
                shooting_dates=role_data.get('shooting_dates', ''),
                shooting_location=role_data.get('shooting_location', ''),
                rate_conditions=role_data.get('rate_conditions', ''),
                reference_text=role_data.get('reference_text', ''),
                special_conditions=role_data.get('special_conditions', ''),
                audition_requirements=role_data.get('audition_requirements', ''),
                audition_text=role_data.get('audition_text', ''),
                notes=role_data.get('notes', ''),
                skills_required=skills_list,
                created_by=agent
            )
        
        # Обновляем статус запроса
        request.status = 'completed'
        request.save()
        
        return project

