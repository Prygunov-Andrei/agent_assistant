"""
Management команда для добавления дополнительных тестовых данных
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from people.models import Person
from projects.models import Project, ProjectType, Genre
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Добавляет дополнительных кастинг-директоров и проекты для тестирования'

    def handle(self, *args, **options):
        # Получаем пользователя
        try:
            user = User.objects.get(username='testuser')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Пользователь testuser не найден. Сначала запустите create_test_people'))
            return

        # Получаем типы проектов и жанры
        project_type_film, _ = ProjectType.objects.get_or_create(
            name='Полнометражный фильм',
            defaults={'is_active': True}
        )
        project_type_series, _ = ProjectType.objects.get_or_create(
            name='Сериал',
            defaults={'is_active': True}
        )
        
        genre_drama, _ = Genre.objects.get_or_create(name='Драма', defaults={'is_active': True})
        genre_comedy, _ = Genre.objects.get_or_create(name='Комедия', defaults={'is_active': True})
        genre_thriller, _ = Genre.objects.get_or_create(name='Триллер', defaults={'is_active': True})
        genre_detective, _ = Genre.objects.get_or_create(name='Детектив', defaults={'is_active': True})

        # Получаем существующих режиссеров и продюсеров
        director = Person.objects.filter(person_type='director').first()
        producer = Person.objects.filter(person_type='producer').first()

        if not director or not producer:
            self.stdout.write(self.style.ERROR('Не найдены режиссеры или продюсеры. Сначала запустите create_test_people'))
            return

        # Создаем дополнительных кастинг-директоров
        new_casting_directors_data = [
            {
                'person_type': 'casting_director',
                'first_name': 'Ирина',
                'last_name': 'Волкова',
                'middle_name': 'Сергеевна',
                'phone': '+7 (999) 777-77-77',
                'email': 'irina.volkova@casting.ru',
                'telegram_username': '@irina_volkova',
                'bio': 'Специализируется на сериалах и многосерийных проектах. Имеет богатый опыт работы с молодыми актерами.',
                'birth_date': date(1988, 5, 20),
                'nationality': 'Россия',
                'awards': 'Лауреат премии "Золотой Орел" (2022)\nПремия Гильдии кастинг-директоров за сериал года (2021)',
            },
            {
                'person_type': 'casting_director',
                'first_name': 'Анна',
                'last_name': 'Дмитриева',
                'phone': '+7 (999) 888-88-88',
                'email': 'anna.dmitrieva@cast.ru',
                'telegram_username': '@anna_dm',
                'bio': 'Кастинг-директор с международным опытом. Работала над совместными российско-европейскими проектами.',
                'birth_date': date(1992, 11, 8),
                'nationality': 'Россия',
                'website': 'https://anna-casting.com',
                'awards': 'Премия "ТЭФИ" за лучший кастинг (2023)',
            },
        ]

        created_casting_directors = []
        for data in new_casting_directors_data:
            person, created = Person.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'created_by': user}
            )
            if created:
                created_casting_directors.append(person)
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Создана персона: {person.full_name}'
                ))
            else:
                created_casting_directors.append(person)
                self.stdout.write(self.style.WARNING(
                    f'⚠️  Персона уже существует: {person.full_name}'
                ))

        # Получаем всех кастинг-директоров
        all_casting_directors = list(Person.objects.filter(person_type='casting_director'))
        
        self.stdout.write(self.style.SUCCESS(f'\nВсего КД в базе: {len(all_casting_directors)}'))

        # Создаем проекты для каждого кастинг-директора
        projects_per_cd = [
            # Проекты для первого КД (Петрова Мария)
            [
                ('Тихий Дон', 'Экранизация романа Шолохова о судьбах казаков в годы революции', date(2015, 5, 9), project_type_series, genre_drama),
                ('Москва слезам не верит', 'Ремейк классического фильма о судьбах трех подруг', date(2016, 3, 15), project_type_film, genre_drama),
                ('Служебный роман', 'Современная интерпретация известной комедии', date(2017, 2, 14), project_type_film, genre_comedy),
                ('Иван Васильевич меняет профессию 2', 'Продолжение культовой комедии Гайдая', date(2018, 1, 1), project_type_film, genre_comedy),
                ('Место встречи изменить нельзя', 'Ремейк легендарного детектива', date(2019, 5, 9), project_type_series, genre_detective),
                ('17 мгновений весны', 'Современный взгляд на историю Штирлица', date(2020, 5, 9), project_type_series, genre_thriller),
                ('Операция Ы', 'Новая версия классической комедии', date(2021, 6, 1), project_type_film, genre_comedy),
            ],
            # Проекты для второго КД (Соколова Елена)
            [
                ('Брат 3', 'Продолжение культовой франшизы о Данилe Багрове', date(2016, 12, 25), project_type_film, genre_thriller),
                ('Особенности национальной охоты', 'Ремейк комедии Рогожкина', date(2017, 6, 12), project_type_film, genre_comedy),
                ('Ночной дозор 2', 'Продолжение фантастического блокбастера', date(2018, 1, 1), project_type_film, genre_thriller),
                ('Дневной дозор 2', 'Вторая часть саги о Дозорах', date(2019, 1, 1), project_type_film, genre_thriller),
                ('Сталкер: Возвращение', 'Новая история в мире Тарковского', date(2020, 5, 5), project_type_film, genre_drama),
                ('Калина красная', 'Ремейк фильма Шукшина', date(2021, 3, 25), project_type_film, genre_drama),
                ('Белое солнце пустыни 2', 'Новые приключения в песках', date(2022, 5, 9), project_type_film, genre_comedy),
                ('Москва-Петушки', 'Экранизация культовой поэмы Ерофеева', date(2023, 11, 1), project_type_film, genre_drama),
            ],
            # Проекты для третьего КД (Волкова Ирина) - если создана
            [
                ('Метод 3', 'Продолжение детективного сериала', date(2018, 10, 18), project_type_series, genre_detective),
                ('Мажор 5', 'Новый сезон популярного сериала', date(2019, 9, 9), project_type_series, genre_detective),
                ('Содержанки 2', 'Продолжение истории о богатой жизни', date(2020, 2, 14), project_type_series, genre_drama),
                ('Непокорная', 'Драматический сериал о сильной женщине', date(2021, 3, 8), project_type_series, genre_drama),
                ('Триггер 2', 'Новые расследования психотерапевта', date(2021, 10, 1), project_type_series, genre_thriller),
                ('Слово пацана', 'История о подростках 90-х', date(2022, 11, 15), project_type_series, genre_drama),
                ('Контейнер 2', 'Продолжение триллера о контрабанде', date(2023, 3, 3), project_type_series, genre_thriller),
                ('Побег 3', 'Финальный сезон про беглеца', date(2023, 9, 1), project_type_series, genre_thriller),
            ],
            # Проекты для четвертого КД (Дмитриева Анна) - если создана
            [
                ('Анна Каренина', 'Современная экранизация романа Толстого', date(2019, 2, 14), project_type_series, genre_drama),
                ('Война и мир: XXI век', 'Современный взгляд на эпопею', date(2020, 5, 9), project_type_series, genre_drama),
                ('Преступление и наказание', 'Новая версия романа Достоевского', date(2021, 1, 15), project_type_series, genre_drama),
                ('Мастер и Маргарита', 'Очередная экранизация Булгакова', date(2021, 12, 31), project_type_series, genre_drama),
                ('Идиот', 'Современная интерпретация Достоевского', date(2022, 3, 15), project_type_series, genre_drama),
                ('Братья Карамазовы', 'Масштабная экранизация романа', date(2023, 5, 1), project_type_series, genre_drama),
                ('Евгений Онегин', 'Пушкин в XXI веке', date(2023, 10, 10), project_type_film, genre_drama),
                ('Отцы и дети', 'Тургенев сегодня', date(2024, 3, 1), project_type_film, genre_drama),
            ],
        ]

        # Создаем проекты
        total_projects = 0
        for idx, casting_director in enumerate(all_casting_directors):
            if idx < len(projects_per_cd):
                project_list = projects_per_cd[idx]
                created_count = 0
                
                for title, description, premiere, proj_type, genre in project_list:
                    project, created = Project.objects.get_or_create(
                        title=title,
                        defaults={
                            'description': description,
                            'premiere_date': premiere,
                            'project_type': proj_type,
                            'genre': genre,
                            'casting_director': casting_director,
                            'director': director,
                            'status': 'completed',
                            'created_by': user,
                        }
                    )
                    
                    if created:
                        project.producers.add(producer)
                        project.save()
                        created_count += 1
                        total_projects += 1
                
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Для {casting_director.full_name} создано проектов: {created_count}'
                ))

        self.stdout.write(self.style.SUCCESS(f'\n🎬 Всего создано новых проектов: {total_projects}'))
        self.stdout.write(self.style.SUCCESS('\n✅ Дополнительные тестовые данные успешно добавлены!'))

