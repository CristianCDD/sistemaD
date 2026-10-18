from django.db import transaction
from rest_framework import serializers

from .models import CatalogEntry, CatalogEntryImage


class CatalogEntrySerializer(serializers.ModelSerializer):
    catalog_images_data = serializers.SerializerMethodField()
    catalog_image_urls = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    display_price = serializers.SerializerMethodField()

    class Meta:
        model = CatalogEntry
        fields = ['id', 'product', 'name', 'sku', 'description', 'category', 'origin', 'tags',
                  'sale_price', 'show_price_on_landing', 'show_on_landing', 'is_active',
                  'catalog_images_data', 'catalog_image_urls', 'image_url', 'display_price']

    def get_catalog_images_data(self, obj):
        request = self.context.get('request')
        return [{'id': item.id, 'url': request.build_absolute_uri(item.image.url) if request else item.image.url}
                for item in obj.images.all() if item.image]

    def get_catalog_image_urls(self, obj):
        return [item['url'] for item in self.get_catalog_images_data(obj)]

    def get_image_url(self, obj):
        urls = self.get_catalog_image_urls(obj)
        return urls[0] if urls else None

    def get_display_price(self, obj):
        return obj.sale_price if obj.show_price_on_landing else None

    def sync_images(self, entry):
        request = self.context.get('request')
        if not request:
            return
        data = request.data
        deleted = data.getlist('delete_image_ids') if hasattr(data, 'getlist') else data.get('delete_image_ids', [])
        if deleted:
            entry.images.filter(id__in=deleted).delete()
        for image in request.FILES.getlist('images'):
            CatalogEntryImage.objects.create(entry=entry, image=image)

    @transaction.atomic
    def create(self, validated_data):
        entry = super().create(validated_data)
        self.sync_images(entry)
        return entry

    @transaction.atomic
    def update(self, instance, validated_data):
        entry = super().update(instance, validated_data)
        self.sync_images(entry)
        return entry


class PublicCatalogEntrySerializer(CatalogEntrySerializer):
    class Meta(CatalogEntrySerializer.Meta):
        fields = ['id', 'name', 'sku', 'description', 'category', 'tags',
                  'catalog_images_data', 'catalog_image_urls', 'image_url', 'display_price']
