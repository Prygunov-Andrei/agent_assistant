"""
Management команда для создания тестовых персон и проектов
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from people.models import Person
from projects.models import Project, ProjectType, Genre
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Создает тестовые персоны и проекты для демонстрации'

    def handle(self, *args, **options):
        # Получаем или создаем пользователя
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@test.com',
                'first_name': 'Тест',
                'last_name': 'Тестов'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Создан пользователь: {user.username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Пользователь уже существует: {user.username}'))

        # Получаем или создаем тип проекта и жанр
        project_type, _ = ProjectType.objects.get_or_create(
            name='Полнометражный фильм',
            defaults={'is_active': True}
        )
        genre, _ = Genre.objects.get_or_create(
            name='Драма',
            defaults={'is_active': True}
        )

        # Создаем кастинг-директоров
        casting_directors_data = [
            {
                'person_type': 'casting_director',
                'first_name': 'Мария',
                'last_name': 'Петрова',
                'middle_name': 'Ивановна',
                'phone': '+7 (999) 111-11-11',
                'email': 'maria.petrova@casting.ru',
                'telegram_username': '@maria_casting',
                'bio': 'Опытный кастинг-директор с 15-летним стажем работы в киноиндустрии. Участвовала в подборе актеров для более 50 проектов.',
                'birth_date': date(1985, 3, 15),
                'nationality': 'Россия',
                'website': 'https://maria-casting.ru',
                'kinopoisk_url': 'https://www.kinopoisk.ru/name/123456/',
                'awards': 'Премия "Золотой Орел" за лучший кастинг (2020)\nПремия Гильдии кастинг-директоров (2019)',
            },
            {
                'person_type': 'casting_director',
                'first_name': 'Елена',
                'last_name': 'Соколова',
                'phone': '+7 (999) 222-22-22',
                'email': 'elena.sokolova@cast.ru',
                'telegram_username': '@elena_cast',
                'bio': 'Специализируется на подборе актеров для драматических фильмов и сериалов. Работала с ведущими российскими режиссерами.',
                'birth_date': date(1990, 7, 22),
                'nationality': 'Россия',
                'awards': 'Номинация на премию "Ника" (2021)',
            },
        ]

        # Создаем режиссеров
        directors_data = [
            {
                'person_type': 'director',
                'first_name': 'Андрей',
                'last_name': 'Звягинцев',
                'middle_name': 'Петрович',
                'phone': '+7 (999) 333-33-33',
                'email': 'andrey.zvyagintsev@film.ru',
                'telegram_username': '@zvyagintsev',
                'bio': 'Известный российский режиссер, обладатель множества международных наград. Фильмы участвовали в Каннском кинофестивале.',
                'birth_date': date(1964, 2, 6),
                'nationality': 'Россия',
                'website': 'https://zvyagintsev-films.ru',
                'kinopoisk_url': 'https://www.kinopoisk.ru/name/277895/',
                'awards': '«Золотая пальмовая ветвь» Каннского кинофестиваля (2014)\n«Золотой глобус» (2015)\nПремия «Оскар» - номинация (2015)',
            },
            {
                'person_type': 'director',
                'first_name': 'Кира',
                'last_name': 'Муратова',
                'phone': '+7 (999) 444-44-44',
                'email': 'kira.muratova@cinema.ru',
                'bio': 'Выдающийся режиссер авторского кино. Работы отличаются уникальным стилем и глубиной психологизма.',
                'birth_date': date(1934, 11, 5),
                'nationality': 'Россия',
                'kinopoisk_url': 'https://www.kinopoisk.ru/name/40213/',
                'awards': 'Народная артистка Украины\nПремия «Ника» (многократно)',
            },
        ]

        # Создаем продюсеров
        producers_data = [
            {
                'person_type': 'producer',
                'first_name': 'Александр',
                'last_name': 'Роднянский',
                'phone': '+7 (999) 555-55-55',
                'email': 'alex.rodnyansky@production.ru',
                'telegram_username': '@rodnyansky',
                'bio': 'Основатель продюсерской компании "Non-Stop Production". Продюсер более 100 художественных фильмов и сериалов.',
                'birth_date': date(1961, 1, 1),
                'nationality': 'Россия',
                'website': 'https://non-stop-production.com',
                'kinopoisk_url': 'https://www.kinopoisk.ru/name/278103/',
                'awards': 'Премия «Золотой Орел» за лучший фильм (многократно)',
            },
            {
                'person_type': 'producer',
                'first_name': 'Сергей',
                'last_name': 'Сельянов',
                'phone': '+7 (999) 666-66-66',
                'email': 'sergey.selyanov@ctb.ru',
                'telegram_username': '@selyanov',
                'bio': 'Генеральный директор киностудии СТВ. Один из самых успешных российских продюсеров.',
                'birth_date': date(1955, 9, 7),
                'nationality': 'Россия',
                'website': 'https://ctbfilm.com',
                'kinopoisk_url': 'https://www.kinopoisk.ru/name/278267/',
                'awards': 'Государственная премия РФ\nПремия «Ника» (многократно)',
            },
        ]

        # Создаем персон
        created_people = []
        
        for data in casting_directors_data + directors_data + producers_data:
            person, created = Person.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'created_by': user}
            )
            if created:
                created_people.append(person)
                self.stdout.write(self.style.SUCCESS(
                    f'Создана персона: {person.full_name} ({person.get_person_type_display()})'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'Персона уже существует: {person.full_name}'
                ))

        # Создаем проекты с этими персонами
        if len(created_people) >= 3:
            casting_director = Person.objects.filter(person_type='casting_director').first()
            director = Person.objects.filter(person_type='director').first()
            producer = Person.objects.filter(person_type='producer').first()

            if casting_director and director and producer:
                projects_data = [
                    {
                        'title': 'Левиафан',
                        'description': 'Драма о простом человеке, противостоящем коррумпированной власти. История разворачивается на фоне сурового северного пейзажа.',
                        'premiere_date': date(2014, 5, 23),
                        'status': 'completed',
                    },
                    {
                        'title': 'Нелюбовь',
                        'description': 'История о разводящейся паре, в центре которой - поиски пропавшего сына. Фильм исследует темы отчуждения и равнодушия.',
                        'premiere_date': date(2017, 6, 1),
                        'status': 'completed',
                    },
                    {
                        'title': 'Возвращение',
                        'description': 'Дебютный фильм о двух братьях и их отце, внезапно вернувшемся после долгого отсутствия.',
                        'premiere_date': date(2003, 9, 1),
                        'status': 'completed',
                    },
                ]

                for proj_data in projects_data:
                    project, created = Project.objects.get_or_create(
                        title=proj_data['title'],
                        defaults={
                            **proj_data,
                            'project_type': project_type,
                            'genre': genre,
                            'casting_director': casting_director,
                            'director': director,
                            'created_by': user,
                        }
                    )
                    
                    if created:
                        # Добавляем продюсера через ManyToMany
                        project.producers.add(producer)
                        project.save()
                        self.stdout.write(self.style.SUCCESS(
                            f'Создан проект: {project.title}'
                        ))
                    else:
                        self.stdout.write(self.style.WARNING(
                            f'Проект уже существует: {project.title}'
                        ))

        self.stdout.write(self.style.SUCCESS('\n✅ Тестовые данные успешно созданы!'))
        self.stdout.write(self.style.SUCCESS(f'Пользователь для входа: testuser / testpass123'))

