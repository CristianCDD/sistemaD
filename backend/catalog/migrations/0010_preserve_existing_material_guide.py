from django.db import migrations


def preserve_material_guide(apps, schema_editor):
    Product = apps.get_model('catalog', 'Product')
    Entry = apps.get_model('catalog', 'MaterialGuideEntry')
    Image = apps.get_model('catalog', 'MaterialGuideEntryImage')
    alias = schema_editor.connection.alias
    for product in Product.objects.using(alias).prefetch_related('material_images').all():
        entry = Entry.objects.using(alias).create(
            product_id=product.pk, name=product.name, sku=product.sku or '',
            description=product.description, is_active=product.is_active,
        )
        # Preserve the file references; inventory deletion must not remove guide images.
        paths = [item.image.name for item in product.material_images.all() if item.image]
        if product.material_image:
            paths.insert(0, product.material_image.name)
        for path in paths:
            Image.objects.using(alias).create(entry_id=entry.pk, image=path)


class Migration(migrations.Migration):
    dependencies = [('catalog', '0009_materialguideentry_materialguideentryimage')]
    operations = [migrations.RunPython(preserve_material_guide, migrations.RunPython.noop)]
