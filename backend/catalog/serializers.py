from rest_framework import serializers

from inventory.services import get_product_stock

from .models import Category, Product, ProductCatalogImage, ProductMaterialImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    landing_image_url = serializers.SerializerMethodField()
    catalog_images_data = serializers.SerializerMethodField()
    catalog_image_urls = serializers.SerializerMethodField()
    material_images_data = serializers.SerializerMethodField()
    material_image_urls = serializers.SerializerMethodField()
    material_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'sku',
            'description',
            'product_type',
            'category',
            'image',
            'image_url',
            'landing_image',
            'landing_image_url',
            'catalog_images_data',
            'catalog_image_urls',
            'material_image',
            'material_images_data',
            'material_image_urls',
            'material_image_url',
            'sale_price',
            'cost',
            'minimum_stock',
            'manages_stock',
            'show_on_landing',
            'show_price_on_landing',
            'is_active',
            'stock',
            'stock_status',
            'created_at',
            'updated_at',
        ]

    def get_stock(self, obj):
        return get_product_stock(obj)

    def get_stock_status(self, obj):
        stock = get_product_stock(obj)
        if stock <= 0:
            return 'agotado'
        return 'normal'

    def get_image_url(self, obj):
        return self.get_file_url(obj.image)

    def get_landing_image_url(self, obj):
        return self.get_file_url(obj.landing_image)

    def get_catalog_image_urls(self, obj):
        return [item['url'] for item in self.get_catalog_images_data(obj)]

    def get_catalog_images_data(self, obj):
        images = [{'id': item.id, 'url': self.get_file_url(item.image)} for item in obj.catalog_images.all()]
        if obj.landing_image:
            images.insert(0, {'id': None, 'url': self.get_file_url(obj.landing_image)})
        return [item for item in images if item['url']]

    def get_material_image_urls(self, obj):
        return [item['url'] for item in self.get_material_images_data(obj)]

    def get_material_images_data(self, obj):
        images = [{'id': item.id, 'url': self.get_file_url(item.image)} for item in obj.material_images.all()]
        if obj.material_image:
            images.insert(0, {'id': None, 'url': self.get_file_url(obj.material_image)})
        return [item for item in images if item['url']]

    def get_legacy_catalog_image_urls(self, obj):
        urls = [self.get_file_url(item.image) for item in obj.catalog_images.all()]
        if obj.landing_image:
            urls.insert(0, self.get_file_url(obj.landing_image))
        return [url for url in urls if url]

    def get_material_image_url(self, obj):
        return self.get_file_url(obj.material_image)

    def get_file_url(self, file):
        request = self.context.get('request')
        if not file:
            return None
        if request:
            return request.build_absolute_uri(file.url)
        return file.url

    def create(self, validated_data):
        product = super().create(validated_data)
        self.sync_extra_images(product)
        return product

    def update(self, instance, validated_data):
        product = super().update(instance, validated_data)
        self.sync_extra_images(product)
        return product

    def sync_extra_images(self, product):
        request = self.context.get('request')
        if not request:
            return

        legacy_updates = []
        if request.data.get('clear_landing_image') == 'true' and product.landing_image:
            product.landing_image.delete(save=False)
            product.landing_image = None
            legacy_updates.append('landing_image')
        if request.data.get('clear_material_image') == 'true' and product.material_image:
            product.material_image.delete(save=False)
            product.material_image = None
            legacy_updates.append('material_image')
        if legacy_updates:
            product.save(update_fields=legacy_updates)

        catalog_delete_ids = request.data.getlist('delete_catalog_image_ids')
        if catalog_delete_ids:
            product.catalog_images.filter(id__in=catalog_delete_ids).delete()

        material_delete_ids = request.data.getlist('delete_material_image_ids')
        if material_delete_ids:
            product.material_images.filter(id__in=material_delete_ids).delete()

        for image in request.FILES.getlist('catalog_images'):
            ProductCatalogImage.objects.create(product=product, image=image)
        for image in request.FILES.getlist('material_images'):
            ProductMaterialImage.objects.create(product=product, image=image)


class PublicProductSerializer(ProductSerializer):
    display_price = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = [
            'id',
            'name',
            'sku',
            'description',
            'product_type',
            'category',
            'image_url',
            'landing_image_url',
            'catalog_images_data',
            'catalog_image_urls',
            'sale_price',
            'show_price_on_landing',
            'display_price',
        ]

    def get_image_url(self, obj):
        image = obj.catalog_images.first()
        if image:
            return self.get_file_url(image.image)
        return self.get_file_url(obj.landing_image)

    def get_display_price(self, obj):
        if obj.show_price_on_landing and obj.sale_price is not None:
            return obj.sale_price
        return None


class PublicMaterialGuideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    material_image_urls = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'image_url', 'material_image_urls']

    def get_image_url(self, obj):
        image = obj.material_images.first()
        if image:
            return self.get_file_url(image.image)
        return self.get_file_url(obj.material_image)

    def get_material_image_urls(self, obj):
        urls = [self.get_file_url(item.image) for item in obj.material_images.all()]
        if obj.material_image:
            urls.insert(0, self.get_file_url(obj.material_image))
        return [url for url in urls if url]

    def get_file_url(self, file):
        request = self.context.get('request')
        if not file:
            return None
        if request:
            return request.build_absolute_uri(file.url)
        return file.url


class ProductSummarySerializer(serializers.ModelSerializer):
    codigo = serializers.CharField(source='sku')
    nombre = serializers.CharField(source='name')
    precio = serializers.DecimalField(source='sale_price', max_digits=12, decimal_places=2)

    class Meta:
        model = Product
        fields = ['id', 'codigo', 'nombre', 'precio']
