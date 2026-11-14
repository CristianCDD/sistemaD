from django.db import migrations


def seed_folders(apps, schema_editor):
    folders = apps.get_model('documents', 'Folder').objects.using(schema_editor.connection.alias)
    root = folders.create(name='Impor.Damian', name_key='impor.damian')
    for name in ('Dep\u00f3sitos', 'Facturas', 'Importaciones'):
        folders.create(name=name, name_key=name.casefold(), parent=root)


class Migration(migrations.Migration):
    dependencies = [('documents', '0001_initial')]
    operations = [migrations.RunPython(seed_folders, migrations.RunPython.noop)]
