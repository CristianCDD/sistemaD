from django.test import TestCase
from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import connection
from importlib import import_module
from rest_framework.test import APIClient

from .models import CatalogEntry, CatalogEntryImage, Category, Product, ProductCatalogImage
from .models import MaterialGuideEntry, MaterialGuideEntryImage, ProductMaterialImage


class IndependentCatalogTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(get_user_model().objects.create_user('catalog-admin'))
        self.product = Product.objects.create(name='Original', sku='ABC', show_on_landing=True)
        self.entry = CatalogEntry.objects.create(product=self.product, name='Publico', show_on_landing=True)

    def test_catalog_crud_does_not_change_inventory(self):
        response = self.client.patch(f'/api/catalogo/{self.entry.pk}/', {'name': 'Nombre comercial'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Original')
        response = self.client.post('/api/catalogo/', {'name': 'Compra local', 'origin': 'local'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(self.client.delete(f'/api/catalogo/{self.entry.pk}/').status_code, 204)
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())

    def test_inventory_deletion_keeps_catalog(self):
        self.product.delete()
        self.entry.refresh_from_db()
        self.assertIsNone(self.entry.product_id)
        self.assertEqual(self.entry.name, 'Publico')

    def test_public_views_only_publish_visible_active_entries(self):
        CatalogEntry.objects.create(name='Oculto')
        CatalogEntry.objects.create(name='Inactivo', show_on_landing=True, is_active=False)
        CatalogEntry.objects.create(name='Local', origin='local', show_on_landing=True)
        self.client.force_authenticate(None)
        for url in ['/api/public/productos/', '/api/public/landing/']:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            entries = response.data['products'] if 'landing' in url else response.data
            self.assertEqual({item['name'] for item in entries}, {'Publico', 'Local'})
            self.assertNotIn('cost', entries[0])
            self.assertNotIn('stock', entries[0])
            self.assertNotIn('origin', entries[0])
        self.assertIn(self.client.post('/api/catalogo/', {'name': 'Unauthorized'}).status_code, [401, 403])

    def test_migration_preserves_all_products_images_and_visibility(self):
        category = Category.objects.create(name='Viniles', slug='viniles')
        self.product.category = category
        self.product.landing_image = 'productos/landing/original.png'
        self.product.save()
        ProductCatalogImage.objects.create(product=self.product, image='productos/catalogo/extra.png')
        hidden = Product.objects.create(name='Oculto', is_active=False)
        migrate = import_module('catalog.migrations.0008_preserve_existing_catalog').preserve_catalog
        migrate(apps, connection.schema_editor())
        copied = CatalogEntry.objects.filter(product=self.product).exclude(pk=self.entry.pk).get()
        self.assertEqual(copied.name, self.product.name)
        self.assertEqual(copied.category, 'Viniles')
        self.assertTrue(copied.show_on_landing)
        self.assertEqual(list(copied.images.values_list('image', flat=True)),
                         ['productos/landing/original.png', 'productos/catalogo/extra.png'])
        self.assertFalse(CatalogEntry.objects.get(product=hidden).is_active)
        self.assertEqual(Product.objects.count(), 2)

    def test_image_removal_is_scoped_to_entry(self):
        other = CatalogEntry.objects.create(name='Otro')
        image = CatalogEntryImage.objects.create(entry=other, image='catalogo/other.png')
        response = self.client.patch(f'/api/catalogo/{self.entry.pk}/', {'delete_image_ids': [image.pk]}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(CatalogEntryImage.objects.filter(pk=image.pk).exists())

    def test_inventory_deletion_preserves_both_independent_entries_and_images(self):
        guide = MaterialGuideEntry.objects.create(product=self.product, name='Guia original')
        guide_image = MaterialGuideEntryImage.objects.create(entry=guide, image='productos/materiales/original.png')
        catalog_image = CatalogEntryImage.objects.create(entry=self.entry, image='productos/catalogo/original.png')
        response = self.client.delete(f'/api/productos/{self.product.pk}/')
        self.assertEqual(response.status_code, 204)
        guide.refresh_from_db()
        self.entry.refresh_from_db()
        self.assertIsNone(guide.product_id)
        self.assertIsNone(self.entry.product_id)
        self.assertEqual(guide.name, 'Guia original')
        self.assertTrue(MaterialGuideEntryImage.objects.filter(pk=guide_image.pk).exists())
        self.assertTrue(CatalogEntryImage.objects.filter(pk=catalog_image.pk).exists())

    def test_guide_crud_is_independent(self):
        response = self.client.post('/api/guia-materiales/', {'name': 'Solo guia'}, format='json')
        self.assertEqual(response.status_code, 201)
        guide_id = response.data['id']
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(CatalogEntry.objects.count(), 1)
        response = self.client.patch(f'/api/guia-materiales/{guide_id}/', {'name': 'Editado'}, format='json')
        self.assertEqual(response.status_code, 200)
        response = self.client.delete(f'/api/guia-materiales/{guide_id}/')
        self.assertEqual(response.status_code, 204)
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())
        self.assertTrue(CatalogEntry.objects.filter(pk=self.entry.pk).exists())

    def test_guide_migration_preserves_names_images_and_visibility(self):
        self.product.material_image = 'productos/materiales/legacy.png'
        self.product.save()
        ProductMaterialImage.objects.create(product=self.product, image='productos/materiales/extra.png')
        hidden = Product.objects.create(name='Inactivo', is_active=False)
        migrate = import_module('catalog.migrations.0010_preserve_existing_material_guide').preserve_material_guide
        migrate(apps, connection.schema_editor())
        guide = MaterialGuideEntry.objects.get(product=self.product)
        self.assertEqual(guide.name, self.product.name)
        self.assertEqual(list(guide.images.values_list('image', flat=True)),
                         ['productos/materiales/legacy.png', 'productos/materiales/extra.png'])
        self.assertFalse(MaterialGuideEntry.objects.get(product=hidden).is_active)
        self.assertEqual(Product.objects.count(), 2)

    def test_public_guide_uses_independent_entries(self):
        guide = MaterialGuideEntry.objects.create(name='Solo en guia')
        MaterialGuideEntryImage.objects.create(entry=guide, image='guia-materiales/material.png')
        MaterialGuideEntry.objects.create(name='Inactivo', is_active=False)
        self.client.force_authenticate(None)
        response = self.client.get('/api/public/guia-materiales/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['name'] for item in response.data], ['Solo en guia'])
        self.assertEqual(len(response.data[0]['material_image_urls']), 1)
        self.assertNotIn('product', response.data[0])
        self.assertIn(self.client.post('/api/guia-materiales/', {'name': 'No autorizado'}).status_code, [401, 403])
