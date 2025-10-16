# Generated manually

from django.db import migrations


def migrate_contacts_to_arrays(apps, schema_editor):
    """Перенести существующие контакты из одиночных полей в массивы"""
    Person = apps.get_model('people', 'Person')
    
    for person in Person.objects.all():
        updated = False
        
        # Переносим phone -> phones
        if person.phone and person.phone.strip():
            if not person.phones:
                person.phones = []
            if person.phone not in person.phones:
                person.phones.append(person.phone)
                updated = True
        
        # Переносим email -> emails
        if person.email and person.email.strip():
            if not person.emails:
                person.emails = []
            if person.email not in person.emails:
                person.emails.append(person.email)
                updated = True
        
        # Переносим telegram_username -> telegram_usernames
        if person.telegram_username and person.telegram_username.strip():
            if not person.telegram_usernames:
                person.telegram_usernames = []
            if person.telegram_username not in person.telegram_usernames:
                person.telegram_usernames.append(person.telegram_username)
                updated = True
        
        if updated:
            person.save(update_fields=['phones', 'emails', 'telegram_usernames'])


def reverse_migrate_contacts(apps, schema_editor):
    """Обратная миграция: перенести первый контакт из массивов обратно в одиночные поля"""
    Person = apps.get_model('people', 'Person')
    
    for person in Person.objects.all():
        updated = False
        
        # Переносим phones[0] -> phone
        if person.phones and len(person.phones) > 0:
            person.phone = person.phones[0]
            updated = True
        
        # Переносим emails[0] -> email
        if person.emails and len(person.emails) > 0:
            person.email = person.emails[0]
            updated = True
        
        # Переносим telegram_usernames[0] -> telegram_username
        if person.telegram_usernames and len(person.telegram_usernames) > 0:
            person.telegram_username = person.telegram_usernames[0]
            updated = True
        
        if updated:
            person.save(update_fields=['phone', 'email', 'telegram_username'])


class Migration(migrations.Migration):

    dependencies = [
        ('people', '0005_add_multiple_contacts'),
    ]

    operations = [
        migrations.RunPython(migrate_contacts_to_arrays, reverse_migrate_contacts),
    ]

