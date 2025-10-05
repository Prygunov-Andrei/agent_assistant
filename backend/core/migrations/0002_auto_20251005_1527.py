# Generated manually for performance optimization

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('artists', '0003_alter_artist_backup_phone_alter_artist_clothing_size_and_more'),
        ('companies', '0002_add_search_indexes'),
        ('people', '0003_add_search_indexes'),
        ('projects', '0004_add_search_indexes'),
        ('telegram_requests', '0004_requestimage_thumbnail'),
    ]

    operations = [
        # Индексы для artists_artist
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_created_by ON artists_artist(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_created_by;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_is_active ON artists_artist(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_gender ON artists_artist(gender);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_gender;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_availability_status ON artists_artist(availability_status);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_availability_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_city ON artists_artist(city);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_city;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_age ON artists_artist(age);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_age;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_height ON artists_artist(height);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_height;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_created_by_active ON artists_artist(created_by_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_created_by_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_gender_availability ON artists_artist(gender, availability_status);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_gender_availability;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_city_active ON artists_artist(city, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_city_active;"
        ),
        
        # Индексы для projects_project
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_created_by ON projects_project(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_created_by;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_is_active ON projects_project(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_status ON projects_project(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_type ON projects_project(project_type_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_type;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_genre ON projects_project(genre_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_genre;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_created_by_active ON projects_project(created_by_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_created_by_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_status_active ON projects_project(status, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_status_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_type_active ON projects_project(project_type_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_type_active;"
        ),
        
        # Индексы для projects_projectrole
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projectrole_project ON projects_projectrole(project_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_projectrole_project;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projectrole_is_active ON projects_projectrole(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_projectrole_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projectrole_role_type ON projects_projectrole(role_type_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_projectrole_role_type;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_projectrole_project_active ON projects_projectrole(project_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_projectrole_project_active;"
        ),
        
        # Индексы для companies_company
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_company_created_by ON companies_company(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_company_created_by;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_company_is_active ON companies_company(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_company_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_company_type ON companies_company(company_type);",
            reverse_sql="DROP INDEX IF EXISTS idx_company_type;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_company_created_by_active ON companies_company(created_by_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_company_created_by_active;"
        ),
        
        # Индексы для people_person
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_person_created_by ON people_person(created_by_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_person_created_by;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_person_is_active ON people_person(is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_person_is_active;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_person_type ON people_person(person_type);",
            reverse_sql="DROP INDEX IF EXISTS idx_person_type;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_person_created_by_active ON people_person(created_by_id, is_active);",
            reverse_sql="DROP INDEX IF EXISTS idx_person_created_by_active;"
        ),
        
        # Индексы для telegram_requests_request
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_agent_id ON telegram_requests_request(agent_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_agent_id;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_status ON telegram_requests_request(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_created_at ON telegram_requests_request(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_created_at;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_original_created_at ON telegram_requests_request(original_created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_original_created_at;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_media_group_id ON telegram_requests_request(media_group_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_media_group_id;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_agent_status ON telegram_requests_request(agent_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_agent_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_created_status ON telegram_requests_request(created_at, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_request_created_status;"
        ),
        
        # Индексы для поиска по тексту
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_request_text_search ON telegram_requests_request USING gin(to_tsvector('russian', text));",
            reverse_sql="DROP INDEX IF EXISTS idx_request_text_search;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_artist_name_search ON artists_artist USING gin(to_tsvector('russian', first_name || ' ' || last_name || ' ' || COALESCE(stage_name, '')));",
            reverse_sql="DROP INDEX IF EXISTS idx_artist_name_search;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_title_search ON projects_project USING gin(to_tsvector('russian', title));",
            reverse_sql="DROP INDEX IF EXISTS idx_project_title_search;"
        ),
    ]