# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('people', '0001_initial'),
        ('projects', '0008_change_director_to_foreignkey'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='casting_director',
            field=models.ForeignKey(
                blank=True,
                help_text='Кастинг-директор проекта',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='casting_projects',
                to='people.person'
            ),
        ),
    ]

