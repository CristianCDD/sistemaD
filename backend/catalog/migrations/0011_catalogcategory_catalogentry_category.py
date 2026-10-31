from django.db import migrations, models
import django.db.models.deletion


CATEGORIES = [
    ('Viniles y Backlight', 'viniles-y-backlight'),
    ('Canvas y Lonas', 'canvas-y-lonas'),
    ('Foam y Celtex', 'foam-y-celtex'),
    ('Reflectivos', 'reflectivos'),
    ('Holograficos', 'holograficos'),
    ('Laminados', 'laminados'),
    ('Imantado y Metalicos', 'imantado-y-metalicos'),
    ('Otros materiales', 'otros-materiales'),
    ('Accesorios', 'accesorios'),
]


def classify(name):
    text = (name or '').lower()
    if any(word in text for word in ('back light', 'vinil', 'foto brillo', 'foto mate', 'fotolumin')):
        return 'Viniles y Backlight'
    if 'canvas' in text or 'lona' in text:
        return 'Canvas y Lonas'
    if 'foam' in text or 'celtex' in text:
        return 'Foam y Celtex'
    if 'reflectivo' in text:
        return 'Reflectivos'
    if 'holograf' in text:
        return 'Holograficos'
    if any(word in text for word in ('laminado', 'pavonado', 'perforado', 'seguridad')):
        return 'Laminados'
    if 'iman' in text:
        return 'Imantado y Metalicos'
    if any(word in text for word in ('rol ', 'roll ', 'modulo')):
        return 'Accesorios'
    return 'Otros materiales'


def seed_and_classify(apps, schema_editor):
    Category = apps.get_model('catalog', 'CatalogCategory')
    Entry = apps.get_model('catalog', 'CatalogEntry')
    categories = {}
    for position, (name, slug) in enumerate(CATEGORIES, start=1):
        category, _ = Category.objects.get_or_create(slug=slug, defaults={'name': name, 'sort_order': position})
        categories[name] = category
    for entry in Entry.objects.all():
        category = categories[classify(entry.name)]
        entry.catalog_category_id = category.id
        entry.category = category.name
        entry.save(update_fields=['catalog_category', 'category'])


class Migration(migrations.Migration):
    dependencies = [('catalog', '0010_preserve_existing_material_guide')]

    operations = [
        migrations.CreateModel(
            name='CatalogCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120, unique=True)),
                ('slug', models.SlugField(max_length=140, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
            ],
            options={'verbose_name': 'categoria de catalogo', 'verbose_name_plural': 'categorias de catalogo', 'ordering': ['sort_order', 'name']},
        ),
        migrations.AddField(
            model_name='catalogentry',
            name='catalog_category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entries', to='catalog.catalogcategory'),
        ),
        migrations.RunPython(seed_and_classify, migrations.RunPython.noop),
    ]
