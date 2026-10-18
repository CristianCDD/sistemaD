from django.db import migrations


def preserve_catalog(apps, schema_editor):
    Product = apps.get_model('catalog', 'Product')
    Entry = apps.get_model('catalog', 'CatalogEntry')
    Image = apps.get_model('catalog', 'CatalogEntryImage')
    alias = schema_editor.connection.alias
    for product in Product.objects.using(alias).select_related('category').prefetch_related('catalog_images').all():
        entry = Entry.objects.using(alias).create(
            product_id=product.pk, name=product.name, sku=product.sku or '',
            description=product.description,
            category=product.category.name if product.category else '',
            sale_price=product.sale_price,
            show_price_on_landing=product.show_price_on_landing,
            show_on_landing=product.show_on_landing, is_active=product.is_active,
        )
        # Reuse stored file paths without moving or deleting the original files.
        paths = ([product.landing_image.name] if product.landing_image else [])
        paths.extend(item.image.name for item in product.catalog_images.all() if item.image)
        for path in paths:
            Image.objects.using(alias).create(entry_id=entry.pk, image=path)


class Migration(migrations.Migration):
    dependencies = [('catalog', '0007_catalogentry_catalogentryimage')]
    operations = [migrations.RunPython(preserve_catalog, migrations.RunPython.noop)]
